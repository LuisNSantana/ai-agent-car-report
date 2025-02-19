import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = parseInt(process.env.TELEGRAM_API_ID!); // Tu API ID
const apiHash = process.env.TELEGRAM_API_HASH!; // Tu API Hash

export const connectTelegram = async (
  phoneNumber: string,
  phoneCode: string,
  password?: string
) => {
  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("Conectando a Telegram...");

  await client.start({
    phoneNumber: async () => phoneNumber,
    password: async () => password || "",
    phoneCode: async () => phoneCode,
    onError: (err) => console.error("Error de autenticación:", err),
  });

  console.log("Autenticación exitosa. Sesión generada:");
  console.log(client.session.save());

  return client;
};
