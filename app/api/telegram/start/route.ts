import { NextRequest, NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = parseInt(process.env.TELEGRAM_API_ID!);
const apiHash = process.env.TELEGRAM_API_HASH!;

// Caché en memoria para evitar solicitudes repetidas


export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phoneNumber } = body;

  if (!phoneNumber) {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 }
    );
  }

  try {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 5,
    });

    console.log("Conectando a Telegram...");
    await client.connect();

    const { phoneCodeHash } = await client.sendCode(
      { apiId, apiHash },
      phoneNumber
    );

    const session = client.session.save();

    return NextResponse.json({
      success: true,
      message: "Verification code sent to Telegram.",
      session,
      phoneCodeHash,
      phoneNumber, // Incluye el número de teléfono en la respuesta
    });
  } catch (error: unknown) {
    console.error("Error during Telegram login:", error);
    return NextResponse.json(
      { error: "Failed to send verification code." },
      { status: 500 }
    );
  }
}

