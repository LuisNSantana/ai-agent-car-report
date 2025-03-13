// scripts/generateRefreshToken.js
import { google } from "googleapis";
import { promises as fsPromises, existsSync } from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";

// Obtener __filename y __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde .env.local manualmente (simulación para scripts)
const loadEnv = async () => {
  const envPath = resolve(__dirname, "../.env.local");
  if (existsSync(envPath)) {
    const envContent = await fsPromises.readFile(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      if (line.trim() && !line.startsWith("#")) {
        const [key, value] = line.split("=");
        process.env[key.trim()] = value.trim();
      }
    });
  } else {
    console.error("No se encontró .env.local. Asegúrate de que exista y contenga GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.");
    process.exit(1);
  }
};

// Cargar variables de entorno
await loadEnv();

const auth = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: "http://localhost:3000", // Mantén este URI web
});

console.log("1. Visita esta URL en tu navegador y autoriza:");
const authUrl = auth.generateAuthUrl({
  scope: ["https://www.googleapis.com/auth/adwords"], // Añadimos scopes adicionales
  access_type: "offline", // Forzar la obtención de refresh_token
  prompt: "consent", // Forzar que el usuario otorgue consentimiento cada vez
});
console.log(authUrl);

console.log("\n2. Ingresa el código de autorización que obtengas:");
process.stdin.once("data", async (code) => {
  try {
    console.log("Código recibido:", code.toString().trim());
    const { tokens } = await auth.getToken(code.toString().trim());
    console.log("Tokens obtenidos:", JSON.stringify(tokens, null, 2));

    if (!tokens.refresh_token) {
      console.error("No se obtuvo un refresh_token. Verifica las credenciales, scopes, y el modo de prueba en Google Cloud Console.");
      console.error("Detalles de tokens:", JSON.stringify(tokens, null, 2));
      console.error("Posibles causas: modo de prueba, credenciales incorrectas, o scopes insuficientes. Asegúrate de que 'access_type: offline' y 'prompt: consent' estén configurados.");
      process.exit(1);
    }

    console.log("Refresh Token:", tokens.refresh_token);
    console.log("\nAñade esta línea a tu .env.local:");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    process.exit(0); // Usamos 0 para indicar éxito
  } catch (error) {
    console.error("Error obteniendo el refresh token:", error);
    if (error.response) {
      console.error("Detalles del error de Google:", error.response.data);
    }
    process.exit(1); // Usamos 1 para indicar error
  }
});