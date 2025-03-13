import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  ChatRequestBody,
  StreamMessage,
  StreamMessageType,
  SSE_DATA_PREFIX,
  SSE_LINE_DELIMITER,
} from "@/lib/types";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { AIMessage, HumanMessage, ToolMessage, BaseMessage } from "@langchain/core/messages";
import { submitQuestion } from "@/lib/langgraph";

// Cambiamos a runtime "nodejs" para soportar módulos nativos de Node.js como 'stream' (necesarios para google-ads-api)
export const runtime = "nodejs";

// Define un interface para los resultados de búsqueda de autos
interface CarSearchResult {
  num_found: number;
  listings: Array<{
    make: string;
    model: string;
    year: number;
    price: number;
    miles: number;
    exterior_color?: string;
    interior_color?: string;
  }>;
}

const carSearchMemory: Record<string, CarSearchResult> = {}; // Especifica el tipo

function sendSSEMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: StreamMessage
) {
  const encoder = new TextEncoder();
  return writer.write(
    encoder.encode(`${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`)
  );
}

export async function POST(req: Request) {
  try {
    // 1) Verificar usuario con Clerk
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2) Obtener datos del body
    const { messages, newMessage, chatId } = (await req.json()) as ChatRequestBody;

    // 3) Validar parámetros requeridos
    if (!newMessage || !chatId) {
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      await sendSSEMessage(writer, {
        type: StreamMessageType.Error,
        error: "Faltan parámetros requeridos (newMessage o chatId)",
      });
      await writer.close();
      return new Response(stream.readable, {
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    // 4) Crear un stream SSE
    const stream = new TransformStream({}, { highWaterMark: 1024 });
    const writer = stream.writable.getWriter();

    // Preparamos respuesta SSE
    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });

    // 5) Iniciamos flujo asíncrono
    (async () => {
      const convex = getConvexClient();

      try {
        // Indicar al cliente que estamos conectados
        await sendSSEMessage(writer, { type: StreamMessageType.Connected });

        // Guardar el nuevo mensaje en la base de datos, si procede
        await convex.mutation(api.messages.send, {
          chatId,
          content: newMessage,
        });

        // Convertimos los mensajes a formato LangChain
        const langChainMessages = [
          ...messages.map((m) => {
            if (m.role === "user") {
              return new HumanMessage(m.content);
            } else if (m.role === "assistant") {
              return new AIMessage(m.content);
            } else if (m.role === "tool") {
              return new ToolMessage({
                content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
                tool_call_id: "default-tool-call-id", // Ajusta según tu lógica
              });
            }
            return new HumanMessage(m.content); // Fallback seguro
          }),
          new HumanMessage(newMessage),
        ];

        // 5A) Detectamos si es una solicitud de búsqueda de autos
        const searchRegex =
          /\b(?:buscar|busco)\b\s+(?<make>\w+)\s+(?<model>\w+)\s+(?<zip>\d{5})/i;
        const match = newMessage.match(searchRegex);

        if (match?.groups) {
          const { make, model, zip } = match.groups;

          try {
            await sendSSEMessage(writer, {
              type: StreamMessageType.Token,
              token: `Buscando autos ${make} ${model} cerca de ${zip}...`,
            });

            const res = await fetch(
              `https://8794-79-116-251-143.ngrok-free.app/api/customMyQuery?zip=${zip}&make=${make}&model=${model}`
            );
            if (!res.ok) {
              throw new Error(`Fallo la llamada a customMyQuery: ${res.statusText}`);
            }
            const result = await res.json();
            carSearchMemory[chatId] = result;

            await sendSSEMessage(writer, {
              type: StreamMessageType.Token,
              token: `Encontré ${result.num_found} listados de ${make} ${model} en ${zip}. Di "pdf" o "informe" para generar un reporte detallado.`,
            });
          } catch (error) {
            console.error("Error en la búsqueda de autos:", error);
            await sendSSEMessage(writer, {
              type: StreamMessageType.Token,
              token: "Ocurrió un error en la búsqueda de vehículos.",
            });
          }
        }

        // 5B) Detectar solicitud de Google Ads y agregar mensaje
        const googleAdsRegex = /\b(?:analiza|informe|datos)\b\s+la\s+campaña\s+de\s+Google\s+Ads\s+con\s+ID\s+(\d+)/i;
        const googleAdsMatch = newMessage.match(googleAdsRegex);

        if (googleAdsMatch) {
          const campaignId = googleAdsMatch[1]; // Extrae el campaignId (ej. "123456789")
          await sendSSEMessage(writer, {
            type: StreamMessageType.Token,
            token: `Analizando la campaña de Google Ads con ID ${campaignId}...`,
          });
          // Añade el mensaje para que LangChain lo procese con google_ads
          langChainMessages.push(new HumanMessage(`Analiza la campaña de Google Ads con ID ${campaignId}`));
        }

        // 5C) Llamamos a tu LLM normal (submitQuestion) con los mensajes actualizados
        try {
          const eventStream = await submitQuestion(langChainMessages, chatId);

          for await (const event of eventStream) {
            if (event.event === "on_chat_model_stream") {
              const text = event.data.chunk?.content?.at(0)?.["text"];
              if (text) {
                await sendSSEMessage(writer, {
                  type: StreamMessageType.Token,
                  token: text,
                });
              }
            } else if (event.event === "on_tool_start") {
              const toolName = (event.data as any).tool; // Usamos as any para ignorar el error// Usamos 'tool' desde event.data (ahora TypeScript lo reconoce)
              await sendSSEMessage(writer, {
                type: StreamMessageType.Token,
                token: `Iniciando herramienta: ${toolName}...`,
              });
            } else if (event.event === "on_tool_end") {
              const toolOutput = event.data.output; // Usamos 'output' en lugar de 'result'
              await sendSSEMessage(writer, {
                type: StreamMessageType.Token,
                token: `Herramienta completada: ${JSON.stringify(toolOutput)}`,
              });
            }
          }

          await sendSSEMessage(writer, { type: StreamMessageType.Done });
        } catch (streamError) {
          console.error("Error en la generación de respuestas:", streamError);
          await sendSSEMessage(writer, {
            type: StreamMessageType.Error,
            error: "Error generando la respuesta del asistente.",
          });
        }

        // 6) Verificamos si el usuario quiere PDF
        if (/\b(pdf|informe)\b/i.test(newMessage)) {
          try {
            const searchData = carSearchMemory[chatId];

            if (!searchData) {
              await sendSSEMessage(writer, {
                type: StreamMessageType.Token,
                token: "No hay datos recientes de búsqueda. Intenta buscar un vehículo primero.",
              });
              return;
            }

            console.log("📌 Enviando datos a generate-pdf...");
            const pdfResponse = await fetch(
              "https://8794-79-116-251-143.ngrok-free.app/api/generate-pdf",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: searchData, userId }),
              }
            );

            if (pdfResponse.ok) {
              const pdfJson = await pdfResponse.json();
              const pdfUrl = pdfJson.pdfUrl;
              console.log("✅ PDF generado correctamente:", pdfUrl);

              await sendSSEMessage(writer, {
                type: StreamMessageType.Token,
                token: `¡Informe PDF generado! Descárgalo aquí: ${pdfUrl}`,
              });
            } else {
              console.error("❌ Error generando el PDF:", pdfResponse.statusText);
              await sendSSEMessage(writer, {
                type: StreamMessageType.Token,
                token: "Hubo un problema al generar el PDF. Intenta nuevamente.",
              });
            }
          } catch (pdfError) {
            console.error("❌ Error al generar el PDF:", pdfError);
            await sendSSEMessage(writer, {
              type: StreamMessageType.Token,
              token: "Error inesperado al generar el PDF.",
            });
          }
        }
      } catch (error) {
        console.error("Error en la API de chat:", error);
        await sendSSEMessage(writer, {
          type: StreamMessageType.Error,
          error: "Ocurrió un error inesperado en el chat.",
        });
      } finally {
        await writer.close();
      }
    })();

    return response;
  } catch (error) {
    console.error("Error en la API de chat:", error);
    return NextResponse.json({ error: "Fallo en el procesamiento del chat" }, { status: 500 });
  }
}