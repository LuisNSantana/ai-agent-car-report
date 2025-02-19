import { NextRequest, NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram";
import bigInt from "big-integer";


const apiId = parseInt(process.env.TELEGRAM_API_ID!);
const apiHash = process.env.TELEGRAM_API_HASH!;
const session = process.env.TELEGRAM_SESSION!;

export async function GET(req: NextRequest) {
  const url = new URL(req.url || "");
  const nickname = url.searchParams.get("nickname");
  const phone = url.searchParams.get("phone");

  if (!nickname && !phone) {
    return NextResponse.json(
      { error: "Either nickname or phone is required." },
      { status: 400 }
    );
  }

  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });

  try {
    console.log("Conectando a Telegram...");
    await client.connect();

    let chatId = null;

    if (nickname) {
      const result = await client.invoke(
        new Api.contacts.Search({
          q: nickname,
          limit: 1,
        })
      );
      chatId = result.users?.[0]?.id || null;
    } else if (phone) {
      const result = await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: bigInt(Math.floor(Math.random() * 10000)),
              phone,
              firstName: "Temp",
              lastName: "Contact",
            }),
          ],
        })
      );
      chatId = result.users?.[0]?.id || null;
    }

    if (chatId) {
      return NextResponse.json({ chat_id: chatId });
    } else {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
  } catch (error) {
    console.error("Error buscando chat_id:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat_id." },
      { status: 500 }
    );
  } finally {
    await client.disconnect();
  }
}
