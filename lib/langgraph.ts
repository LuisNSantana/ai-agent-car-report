import { ChatDeepSeek } from "@langchain/deepseek";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { trimMessages } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { getConvexClient } from "./convex";
import { api } from "@/convex/_generated/api";
import SYSTEM_MESSAGE from "@/constants/systemMessage";

// More accurate token estimation for DeepSeek model
// DeepSeek uses a similar tokenizer to GPT models, with approximately 4 characters per token
const estimateTokens = (text: string) => {
  // If text is not a string (e.g., it's an object), stringify it first
  if (typeof text !== 'string') {
    try {
      text = JSON.stringify(text);
    } catch (e) {
      text = String(text);
    }
  }
  
  // Count tokens based on character count with adjustments for common patterns
  const charCount = text.length;
  
  // Adjust for whitespace and punctuation which typically use fewer tokens
  const whitespaceCount = (text.match(/\s/g) || []).length;
  
  // Adjust for numbers which typically use fewer tokens
  const numberCount = (text.match(/\d/g) || []).length;
  
  // Adjust for special characters which might use more tokens
  const specialCharCount = (text.match(/[^\w\s]/g) || []).length;
  
  // Calculate adjusted character count
  const adjustedCharCount = charCount - (whitespaceCount * 0.5) - (numberCount * 0.5) + (specialCharCount * 0.5);
  
  // Convert to tokens (approximately 4 characters per token for most models)
  return Math.ceil(adjustedCharCount / 4);
};

// Función para añadir encabezados de caché a los mensajes
const addCachingHeaders = (messages: BaseMessage[]): BaseMessage[] => {
  return messages.map((message) => {
    if (message._getType() === "human") {
      return new HumanMessage({
        content: message.content,
      });
    } else if (message._getType() === "ai") {
      return new AIMessage({
        content: message.content,
      });
    } else {
      return message;
    }
  });
};

// Crear un trimmer para mensajes que excedan el límite de tokens
const trimmer = trimMessages({
  maxTokens: 7000, // Reduced from 8000 to leave room for system message and response
  tokenCounter: (messages: BaseMessage[]) => {
    // Custom token counter for messages
    return messages.reduce((acc, message) => {
      const content = typeof message.content === 'string' 
        ? message.content 
        : JSON.stringify(message.content);
      
      try {
        return acc + estimateTokens(content);
      } catch (error) {
        console.error("Failed to calculate number of tokens, falling back to approximate count", error);
        return acc + Math.ceil(String(content).length / 4);
      }
    }, 0);
  }
});

// Función para guardar el uso de tokens en la base de datos
const saveTokenUsage = async (usage: { input_tokens: number; output_tokens: number }, chatId?: string, userId?: string) => {
  try {
    // Use the Convex client directly
    const convexClient = getConvexClient();
    
    // Format chatId correctly for Convex if it exists
    let formattedChatId = undefined;
    if (chatId && chatId.trim() !== "") {
      try {
        // For Convex, we need to pass the ID directly, not an object
        formattedChatId = chatId as any;
      } catch (e) {
        console.error("Invalid chat ID format:", e);
      }
    }
    
    // Ensure we have positive token counts
    const inputTokens = Math.max(1, usage.input_tokens || 0);
    const outputTokens = Math.max(1, usage.output_tokens || 0);
    
    // Get the current user ID from localStorage if available
    // This is set by the ChatInterface component when the user logs in
    let userIdToUse = "system"; // Default fallback
    
    if (userId) {
      userIdToUse = userId;
    } else {
      try {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedUserId = localStorage.getItem('currentUserId');
          if (storedUserId) {
            userIdToUse = storedUserId;
            console.log("Using user ID from localStorage:", userIdToUse);
          } else {
            console.log("No user ID found in localStorage, using system as fallback");
          }
        } else {
          console.log("Not in browser environment, using system as fallback");
        }
      } catch (error) {
        console.error("Error getting user ID from localStorage:", error);
      }
    }
    
    console.log("Saving token usage to database:", {
      userId: userIdToUse,
      chatId: formattedChatId,
      inputTokens,
      outputTokens,
      total: inputTokens + outputTokens
    });
    
    // The server-side code in convex/tokenUsage.ts will 
    // replace this with the actual authenticated user ID if available
    await convexClient.mutation(api.tokenUsage.saveTokenUsage, {
      userId: userIdToUse, 
      chatId: formattedChatId,
      inputTokens,
      outputTokens,
      model: "deepseek-chat",
    });
    
    console.log("Token usage saved to database successfully");
  } catch (error) {
    console.error("Error saving token usage:", error);
  }
};

// Custom token counter for DeepSeek model
const countTokensManually = (messages: BaseMessage[]): { input_tokens: number } => {
  let totalTokens = 0;
  
  for (const message of messages) {
    const content = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
    
    totalTokens += estimateTokens(content);
    
    // Add overhead for message formatting (role, etc.)
    totalTokens += 4; // Approximate overhead per message
  }
  
  return { input_tokens: totalTokens };
};

// Inicializar modelo con DeepSeek
const initialiseModel = (chatId?: string) => {
  try {
    const model = new ChatDeepSeek({
      model: "deepseek-chat", 
      apiKey: process.env.DEEPSEEK_API_KEY,
      temperature: 0.5, // Reduced from 0.7 to make responses more deterministic and faster
      maxCompletionTokens: 2048, // Reduced from 4096 to improve response time
      streaming: false, // Disable streaming to ensure we get token usage
      callbacks: [
        {
          handleLLMStart: async (llmInput: any) => {
            // Count tokens manually before sending to the API
            try {
              const messages = llmInput.messages || [];
              const tokenCount = countTokensManually(messages);
              console.log("Estimated input tokens:", tokenCount.input_tokens);
            } catch (error) {
              console.error("Error counting tokens manually:", error);
            }
          },
          handleLLMEnd: async (output: any) => {
            const usage = output.llmOutput?.usage;
            
            // If the API doesn't return token usage, estimate it manually
            if (!usage || !usage.input_tokens || !usage.output_tokens) {
              console.log("API did not return token usage, estimating manually");
              
              // Estimate input tokens from the original messages
              const inputMessages = output.runId?.configurable?.messages || [];
              const inputTokens = countTokensManually(inputMessages).input_tokens;
              
              // Estimate output tokens from the generated content
              let outputContent = "";
              
              // Try to extract content from different response formats
              if (output.generations && output.generations[0] && output.generations[0][0]) {
                outputContent = output.generations[0][0].text || "";
              } else if (output.text) {
                outputContent = output.text;
              } else if (output.content) {
                outputContent = output.content;
              }
              
              const outputTokens = estimateTokens(outputContent);
              
              const estimatedUsage = {
                input_tokens: inputTokens,
                output_tokens: outputTokens
              };
              
              console.log("Estimated Token Usage:", {
                input: estimatedUsage.input_tokens,
                output: estimatedUsage.output_tokens,
                total: estimatedUsage.input_tokens + estimatedUsage.output_tokens,
              });
              
              // Save estimated token usage to database
              await saveTokenUsage(estimatedUsage);
            } else {
              // Use the API-provided token usage
              console.log("Token Usage from API:", {
                input: usage.input_tokens,
                output: usage.output_tokens,
                total: usage.input_tokens + usage.output_tokens,
              });
              
              // Save token usage to database
              await saveTokenUsage(usage);
            }
          },
          handleLLMError: async (err: Error) => {
            console.error("LLM Error:", err.message);
          },
        },
      ],
    });

    return model;
  } catch (error) {
    console.error("Error initializing DeepSeek model:", error);
    throw error;
  }
};

/**
 * Submit a question to the DeepSeek model
 * @param messages The messages to send to the model
 * @param chatId The chat ID to associate with the question
 * @param userId The user ID to associate with the token usage
 * @returns The model's response
 */
export async function submitQuestion(
  messages: BaseMessage[],
  chatId: string,
  userId?: string
) {
  try {
    console.log("Processing question with DeepSeek...");
    
    // Cache the messages
    const cachedMessages = messages;
    
    // Initialize the model with chatId
    const model = initialiseModel(chatId);
    
    // Create the prompt template
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_MESSAGE],
      new MessagesPlaceholder("messages"),
    ]);
    
    // Trim messages to fit context window
    const trimmedMessages = await trimmer.invoke(cachedMessages);
    
    // Calculate token usage before sending to API
    const allMessages = [
      new SystemMessage(SYSTEM_MESSAGE),
      ...trimmedMessages
    ];
    
    // Manually count input tokens
    const inputTokens = countTokensManually(allMessages).input_tokens;
    console.log("Manual token count before API call:", inputTokens);
    
    // Create the prompt
    const prompt = await promptTemplate.invoke({ messages: trimmedMessages });
    
    // Get response from model
    const response = await model.invoke(prompt, {
      runId: chatId,
      configurable: { 
        thread_id: chatId,
        messages: allMessages
      },
    });
    
    // Extract content from response for token estimation
    let outputContent = "";
    if (typeof response === 'object') {
      if ('content' in response) {
        outputContent = response.content as string;
      } else if ('text' in response) {
        outputContent = (response as any).text;
      }
    } else if (typeof response === 'string') {
      outputContent = response;
    }
    
    // Always save token usage after getting a response
    const outputTokens = estimateTokens(outputContent);
    console.log("Final token usage:", {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
    });
    
    // Save token usage with the provided userId
    await saveTokenUsage({
      input_tokens: inputTokens,
      output_tokens: outputTokens
    }, chatId, userId);
    
    console.log("Response generated successfully");
    return response;
  } catch (error) {
    console.error("Error in submitQuestion:", error);
    // Re-throw the error to be handled by the API route
    throw error;
  }
}