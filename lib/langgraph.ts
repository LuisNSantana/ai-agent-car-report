import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  trimMessages,
} from "@langchain/core/messages";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { GoogleAdsApi } from "google-ads-api"; // Nueva importación para Google Ads
import { DynamicStructuredTool } from "@langchain/core/tools"; // Usamos DynamicStructuredTool
import { z } from "zod"; // Usamos zod con tipos nativos
import SYSTEM_MESSAGE from "@/constants/systemMessage";

// Estimación de tokens basada en caracteres (aprox. 4 caracteres por token, más precisa)
const estimateTokens = (text: string) => {
  return Math.ceil(text.length / 4);
};

// Trimmer optimizado con un límite más razonable y tokenCounter mejorado
const trimmer = trimMessages({
  maxTokens: 1000, // Aumentamos a 1000 para análisis complejos, más realista que 10
  strategy: "last",
  tokenCounter: (msgs) => {
    const totalText = msgs.map((m) => (m.content as string) || "").join(" ");
    return estimateTokens(totalText);
  },
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

// Conexión a wxflows usando variables nativas de Next.js
const toolClient = new wxflows({
  endpoint: process.env.WXFLOWS_ENDPOINT || "",
  apikey: process.env.WXFLOWS_APIKEY,
});

// Obtener herramientas iniciales de wxflows
const toolsPromise = toolClient.lcTools;
const wxTools = await toolsPromise;

// Herramienta para Google Ads como DynamicStructuredTool
const googleAdsSchema = z.object({
  campaignId: z.string().describe("The ID of the Google Ads campaign to analyze"),
});

const googleAdsTool = new DynamicStructuredTool({
  name: "google_ads",
  description: "Fetch marketing data from Google Ads for a specific campaign ID",
  schema: googleAdsSchema,
  func: async (input: z.infer<typeof googleAdsSchema>, runManager?: any, config?: any) => {
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, ""); // Ej. "1234567890"
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!customerId || !developerToken) {
      throw new Error("Missing Google Ads credentials in .env. Check .env.local file.");
    }

    const client = new GoogleAdsApi({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      developer_token: developerToken || "",
      refresh_token: refreshToken || undefined, // Ahora TypeScript lo reconoce gracias a types/google-ads-api.d.ts
    });

    try {
      const customer = client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken || undefined, // Opcional, solo si lo tienes
      });

      const response = await customer.query(`
        SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros
        FROM campaign
        WHERE campaign.id = ${parseInt(input.campaignId, 10)}
        DURING LAST_30_DAYS
      `);

      const data = response[0]; // La respuesta es un array de resultados
      if (!data) throw new Error("No data found for campaign ID");

      return {
        campaignName: data.campaign?.name || "Unknown Campaign",
        impressions: data.metrics?.impressions || 0,
        clicks: data.metrics?.clicks || 0,
        cost: Number(data.metrics?.cost_micros || 0) / 1000000, // Convertir de micros a dólares
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Error fetching Google Ads data: ${error.message}`);
      } else {
        throw new Error("Error fetching Google Ads data: An unknown error occurred.");
      }
    }
  },
});

// Definir todas las herramientas, incluyendo google_ads
const tools = [
  ...wxTools,
  googleAdsTool, // Añadimos la herramienta de Google Ads
];
const toolNode = new ToolNode(tools);

// Inicializar el modelo Anthropic con mejores callbacks y tool instructions
const initialiseModel = () => {
  const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20241022",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.7,
    maxTokens: 4096,
    streaming: true,
    clientOptions: {
      defaultHeaders: {
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
    },
    callbacks: [
      {
        handleLLMStart: async () => {
          console.log("🤖 Starting LLM call");
        },
        handleLLMEnd: async (output) => {
          console.log("🤖 End LLM call", output);
          const usage = output.llmOutput?.usage;
          if (usage) {
            console.log("📊 Token Usage:", {
              input_tokens: usage.input_tokens,
              output_tokens: usage.output_tokens,
              total_tokens: usage.input_tokens + usage.output_tokens,
              cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
              cache_read_input_tokens: usage.cache_read_input_tokens || 0,
            });
          }
        },
        handleLLMNewToken: async (token: string) => {
          console.log("🔤 New token:", token);
        },
      },
    ],
  }).bindTools(tools);

  return model;
};

// Lógica para decidir si continuar el flujo
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  if (lastMessage.content && lastMessage._getType() === "tool") {
    return "agent";
  }
  return END;
}

// Crear el flujo de trabajo
const createWorkflow = () => {
  const model = initialiseModel();

  return new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      const systemContent = SYSTEM_MESSAGE;

      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, { cache_control: { type: "ephemeral" } }),
        new MessagesPlaceholder("messages"),
      ]);

      const trimmedMessages = await trimmer.invoke(state.messages);
      const prompt = await promptTemplate.invoke({ messages: trimmedMessages });
      const response = await model.invoke(prompt);

      // Si hay datos de herramientas, estructurar un informe
      if (state.messages.some((m) => m._getType() === "tool")) {
        const toolData = state.messages
          .filter((m) => m._getType() === "tool")
          .map((m) => m.content);
        const report = {
          summary: response.content,
          data: toolData,
          recommendations: "Recomendaciones placeholder", // Implementar lógica después
        };
        return { messages: [new AIMessage(JSON.stringify(report))] };
      }

      return { messages: [response] };
    })
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");
};

// Optimización del caching para mensajes
function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
  if (!messages.length) return messages;

  const cachedMessages = [...messages];
  const addCache = (message: BaseMessage) => {
    message.content = [
      {
        type: "text",
        text: message.content as string,
        cache_control: { type: "ephemeral" },
      },
    ];
  };

  const lastMessage = cachedMessages.at(-1);
  if (lastMessage && lastMessage._getType() === "human") {
    addCache(lastMessage);
  }

  return cachedMessages;
}

// Función principal exportada
export async function submitQuestion(messages: BaseMessage[], chatId: string) {
  const cachedMessages = addCachingHeaders(messages);

  const workflow = createWorkflow();
  const checkpointer = new MemorySaver();
  const app = workflow.compile({ checkpointer });

  const stream = await app.streamEvents(
    { messages: cachedMessages },
    {
      version: "v2",
      configurable: { thread_id: chatId },
      streamMode: "messages",
      runId: chatId,
    }
  );
  return stream;
}