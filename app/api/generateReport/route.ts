import { NextResponse } from 'next/server';
import { generateCarReportPDF, MarketData } from '@/lib/generateCarReport';
import { auth } from '@clerk/nextjs/server';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Obtén los datos del informe
    const data = (await req.json()) as MarketData;
    
    // Genera el PDF y obtén el buffer
    const pdfBuffer = await generateCarReportPDF(data);
    // Convertir el buffer a base64
    const pdfBase64 = pdfBuffer.toString("base64");
    
    // Obtén la instancia de Convex
    const convex = getConvexClient();
    
    const expiresAt = Date.now() + 30 * 60 * 1000; // Set expiration time (e.g., 30 minutes from now)

    // Llama a la mutación de Convex para almacenar el PDF usando file storage
    const fileRef = await convex.mutation(api.reports.storePDFFile, {
      fileData: pdfBase64,
      expiresAt: expiresAt, // Include the expiresAt property
    });
    console.log("File reference returned:", fileRef);
    
    // Genera un enlace firmado (o URL pública) a partir de la referencia del archivo.
    // Convex provee una función para generar URLs. Suponiendo que la tienes configurada:
    const downloadUrl = await convex.query(api.reports.getPDFFileUrl, { fileRef });
    console.log("Generated download URL:", downloadUrl);
    // Si no tienes una función getPDFFileUrl, puedes configurar la forma de obtener el URL según Convex.

    // Devuelve el enlace firmado en la respuesta.
    return NextResponse.json({ downloadUrl });
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
