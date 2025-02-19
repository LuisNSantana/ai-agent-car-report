import { NextRequest, NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api"; // Asegúrate de importar correctamente tu API de Convex

const apiId = parseInt(process.env.TELEGRAM_API_ID!);
const apiHash = process.env.TELEGRAM_API_HASH!;
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phoneCode, session, phoneNumber, userId } = body;

  if (!phoneCode || !session || !phoneNumber || !userId) {
    return NextResponse.json(
      { error: "Verification code, session, phone number, and user ID are required." },
      { status: 400 }
    );
  }

  try {
    // Crear un nuevo cliente de Telegram usando la sesión temporal
    const client = new TelegramClient(
      new StringSession(session),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );

    console.log("Conectando a Telegram...");
    await client.start({
      phoneNumber: async () => phoneNumber, // El número de teléfono del usuario
      password: async () => "", // Si el usuario tiene 2FA
      phoneCode: async () => phoneCode,
      onError: (err) => console.error("Error de autenticación:", err),
    });

    // Guardamos la sesión para utilizarla después
    const finalSession = client.session.save() as unknown as string;

    // Obtén información del usuario (como el username y el chat_id)
    const me = await client.getMe();
    const username = me.username || phoneNumber;
    const chatId = Number(me.id); // Convertir BigInteger a number

    console.log("Autenticación completa. Sesión generada.");
    console.log(`Usuario: ${username}, chat_id: ${chatId}`);

    // Guarda la sesión y detalles del usuario en Convex
    await convex.mutation(api.telegramSessions.addSession, {
      userId,
      session_id: finalSession,
      createdAt: Date.now(),
      username
    });

    // Guarda el nombre de usuario de Telegram y el chat_id
    await convex.mutation(api.usersTelegram.addUserTelegram, {
      nickname: username,
      chat_id: chatId, // Ahora se guarda el chat_id real
      userId
    });

    return NextResponse.json({
      success: true,
      message: "Telegram account linked successfully.",
      session: finalSession,
      username: username, // Retorna el username junto con la sesión
    });
  } catch (error) {
    console.error("Error verifying Telegram code:", error);
    return NextResponse.json(
      { error: "Failed to verify Telegram code." },
      { status: 500 }
    );
  }
}
