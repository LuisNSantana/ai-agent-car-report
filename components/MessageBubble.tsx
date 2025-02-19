"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { File } from "lucide-react";
import React from "react";

interface MessageBubbleProps {
  content: string;
  isUser?: boolean;
}

const formatMessage = (content: string): string => {
  // Ajusta el formato del mensaje para mostrarlo correctamente en HTML
  let formatted = content.replace(/\\/g, "\\");
  formatted = formatted.replace(/\n/g, "<br/>");
  formatted = formatted.replace(/---START---\s*/g, "").replace(/\s*---END---/g, "");
  return formatted.trim();
};

const extractPdfUrl = (content: string): string | null => {
  // Utiliza una expresión regular para detectar cualquier URL que contenga "http" y ".pdf" o de un dominio conocido
  const regex = /(https?:\/\/[^\s"]+(?:\.pdf|\/storage\/))/i;
  const match = content.match(regex);
  return match ? match[0] : null;
};

export function MessageBubble({ content, isUser }: MessageBubbleProps) {
  const { user } = useUser();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = extractPdfUrl(content);
    if (url) {
      setPdfUrl(url);
    }
  }, [content]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-4`}>
      <div
        className={`relative rounded-2xl px-4 py-3 max-w-full shadow-sm ring-1 ring-inset ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none ring-blue-700"
            : "bg-white text-gray-900 rounded-bl-none ring-gray-200"
        }`}
        style={{ minWidth: "600px", margin: "0 20px" }}
      >
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />

        {/* Si se detecta una URL de PDF, se muestra el botón de descarga */}
        {pdfUrl && (
          <div className="mt-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              <File className="w-6 h-6" />
              <span>Descargar Informe PDF</span>
            </a>
          </div>
        )}

        <div
          className={`absolute bottom-0 ${
            isUser
              ? "right-0 translate-x-1/2 translate-y-1/2"
              : "left-0 -translate-x-1/2 translate-y-1/2"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full border-2 ${
              isUser ? "bg-white border-gray-100" : "bg-blue-600 border-white"
            } flex items-center justify-center shadow-sm`}
          >
            {isUser ? (
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <File className="h-5 w-5 text-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
