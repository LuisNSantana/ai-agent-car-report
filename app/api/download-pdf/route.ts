import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { fileData, userId } = await request.json();
    if (!fileData || !userId) {
      throw new Error("Faltan campos: fileData o userId");
    }

    // 1) Llama a tu action "storePDFAction"
    const storeResponse = await fetch(
      "https://robust-gerbil-591.convex.cloud/api/actions/reports:storePDFAction",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileData }),
      }
    );
    if (!storeResponse.ok) {
      throw new Error(`Error subiendo PDF: ${await storeResponse.text()}`);
    }
    const { storageId, publicUrl } = await storeResponse.json();

    // 2) Llama a tu mutation "savePDFMetadata"
    const fileName = `reporte_${Date.now()}.pdf`;
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 min
    const metaResponse = await fetch(
      "https://robust-gerbil-591.convex.cloud/api/mutations/reports:savePDFMetadata",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageId, publicUrl, userId, fileName, expiresAt }),
      }
    );
    if (!metaResponse.ok) {
      throw new Error(`Error guardando metadatos: ${await metaResponse.text()}`);
    }

    // 3) Devolver la URL pública
    return NextResponse.json({
      success: true,
      publicUrl,
      message: "PDF generado y almacenado con éxito",
    });
  } catch (error: unknown) {
    console.error("❌ Error generando PDF:", error);
    return NextResponse.json(
      { success: false, error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
