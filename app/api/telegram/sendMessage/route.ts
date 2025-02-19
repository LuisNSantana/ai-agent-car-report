import { NextRequest, NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = parseInt(process.env.TELEGRAM_API_ID!);
const apiHash = process.env.TELEGRAM_API_HASH!;
const session = process.env.TELEGRAM_SESSION!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { chat_id, text } = body;

  if (!chat_id || !text) {
    return NextResponse.json(
      { error: "chat_id and text are required." },
      { status: 400 }
    );
  }

  try {
    const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
      connectionRetries: 5,
    });

    console.log("Conectando a Telegram...");
    await client.connect();

    console.log(`Enviando mensaje a chat_id: ${chat_id}`);
    const result = await client.sendMessage(chat_id, { message: text });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    return NextResponse.json(
      { error: "Failed to send the message." },
      { status: 500 }
    );
  }
}
