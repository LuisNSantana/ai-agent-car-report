"use client";

import { useState } from "react";

export default function PdfGenerator() {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);

    const content = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            p { font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>Reporte de Análisis</h1>
          <p>Este es un análisis detallado sobre el rendimiento del sistema...</p>
        </body>
      </html>
    `;

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Error al generar el PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Crear enlace de descarga
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      disabled={loading}
    >
      {loading ? "Generando..." : "Descargar Reporte"}
    </button>
  );
}
