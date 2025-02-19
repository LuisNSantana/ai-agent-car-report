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
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { submitQuestion } from "@/lib/langgraph";

// Necesitarás esto si tu runtime es Edge:
export const runtime = "edge";

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

    // 3) Crear un stream SSE
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

    // 4) Iniciamos flujo asíncrono
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
          ...messages.map((m) =>
            m.role === "user"
              ? new HumanMessage(m.content)
              : new AIMessage(m.content)
          ),
          new HumanMessage(newMessage),
        ];

        // 4A) Detectamos si es una solicitud de búsqueda de autos
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
              throw new Error("Fallo la llamada a customMyQuery");
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

        // 4B) Llamamos a tu LLM normal (submitQuestion)
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

        // 5) Verificamos si el usuario quiere PDF
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
