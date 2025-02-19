import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { generateCarReportPDF } from "@/lib/generateCarReport";

export async function POST(req: Request) {
  try {
   
    const { data, userId } = await req.json();

    if (!data || !userId) {
      
      return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 });
    }

    console.log("📌 Generando PDF con Puppeteer...");
    const pdfBuffer = await generateCarReportPDF(data);
    console.log("✅ PDF generado con éxito");
    console.log(`📌 Tamaño del PDF generado: ${pdfBuffer.byteLength} bytes`);

    console.log("📌 Convirtiendo PDF a Base64...");
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    console.log("📌 Subiendo PDF a Convex...");
    const convex = getConvexClient();
    // OJO: Desestructuramos storageId y publicUrl
    const { storageId, publicUrl } = await convex.action(api.reports.storePDFAction, {
      fileData: pdfBase64,
    });

    if (!storageId || !publicUrl) {
      console.error("❌ Error: No se generó storageId o publicUrl.");
      return NextResponse.json(
        { error: "Error almacenando el archivo en Convex." },
        { status: 500 }
      );
    }

    console.log("📌 Guardando metadatos del PDF en la base de datos...");
    const fileName = `reporte_${Date.now()}.pdf`;

    await convex.mutation(api.reports.savePDFMetadata, {
      storageId,       // el ID interno de Convex
      publicUrl,       // la URL pública que te dio la action
      userId,
      fileName,
      expiresAt: Date.now() + 30 * 60 * 1000, // Ej: 30 min
    });

    console.log("📌 Archivo almacenado en Convex con ID:", storageId);

    // Retorna directamente la URL pública real
    const pdfUrl = publicUrl;
    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    return NextResponse.json({ error: "Error generating PDF" }, { status: 500 });
  }
}
