import { v } from "convex/values";
import { action, mutation } from "./_generated/server";

// Acción para subir el PDF a Convex File Storage
export const storePDFAction = action({
  args: { fileData: v.string() },
  handler: async (ctx, { fileData }) => {
    console.log("📌 Generando URL de subida en Convex...");
    const uploadUrl = await ctx.storage.generateUploadUrl();

    console.log("📌 Subiendo archivo a Convex Storage...");
    const binaryString = atob(fileData);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: buffer,
    });

    if (!response.ok) {
      throw new Error("❌ Error al subir el archivo a Convex");
    }

    const { storageId } = await response.json();

    console.log("📌 Archivo almacenado en Convex con ID:", storageId);

    // Generar la URL pública del archivo
    const publicUrl = await ctx.storage.getUrl(storageId);
    if (!publicUrl) {
      throw new Error("❌ No se pudo generar la URL pública del archivo.");
    }

    console.log("📌 URL pública del archivo generada:", publicUrl);
    return { storageId, publicUrl };
  },
});

// Mutación para guardar los metadatos del PDF en la base de datos
export const savePDFMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    publicUrl: v.string(),
    userId: v.string(),
    fileName: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, { storageId, publicUrl, userId, fileName, expiresAt }) => {
    console.log("📌 Guardando metadatos del PDF en la base de datos...");

    await ctx.db.insert("reports", {
      storageId,
      publicUrl,
      userId,
      fileName,
      createdAt: Date.now(),
      expiresAt,
    });

    return storageId;
  },
});
