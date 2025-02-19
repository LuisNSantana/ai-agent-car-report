import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    title: v.string(),
    userId: v.string(),
    sessionId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    createdAt: v.number(),
  }).index("by_chat", ["chatId"]),

  usersTelegram: defineTable({
    nickname: v.string(), // Nombre del usuario
    chat_id: v.number(), // ID del chat en Telegram
    userId: v.string(),
  }).index("by_nickname", ["nickname"]),

  telegramSessions: defineTable({
    session_id: v.string(),
    createdAt: v.number(),
    userId: v.string(),
    username: v.optional(v.string()),
  }).index("by_session_id", ["session_id"]),

  // Nueva tabla para almacenar archivos PDF en Convex
  files: defineTable({
    content: v.bytes(), // Almacena el contenido del archivo en binario
    mimeType: v.string(), // Tipo de archivo (ejemplo: application/pdf)
    createdAt: v.number(), // Timestamp de creación
  }).index("by_createdAt", ["createdAt"]),

  // Tabla para almacenar los informes PDF temporalmente
  reports: defineTable({
    // Si prefieres guardarte el PDF como base64, lo dejas en pdfData.
    // Si no, igual lo puedes borrar. Tu sabrás ;)
    pdfData: v.optional(v.string()),

    // Aquí definimos storageId como un Id del storage de Convex
    // Para que se guarde adecuadamente y no haya drama.
    storageId: v.optional(v.id("_storage")),

    // La URL pública de acceso, la dejamos obligatoria (o optional,
    // depende de tus necesidades). Recomendado dejarla "optional"
    // si a veces no la tienes.
    publicUrl: v.optional(v.string()),

    // El resto según tu ejemplo
    fileName: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_expiresAt", ["expiresAt"]), // index de ejemplo
});
