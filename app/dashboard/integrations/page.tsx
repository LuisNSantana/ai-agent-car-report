"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FaTelegramPlane } from "react-icons/fa"; 

export default function IntegrationsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
   
  const { user } = useUser();

  useEffect(() => {
    const fetchSessionId = async () => {
      try {
        if (!user) {
          setErrorMessage("User is not authenticated.");
          return; // Si el usuario no está autenticado, salimos de la función
        }

        const userId = user.id; // Obtener el userId correcto desde el sistema de autenticación (Clerk en este caso)
        console.log("User ID in frontend:", userId); // Verifica que el userId es correcto
        
        // Solicitar el estado de la sesión de Telegram usando el userId
        const sessionResponse = await fetch("/api/telegram/status", {
          method: "GET",
          headers: {
            "x-user-id": userId, // Pasa el userId del sistema de autenticación
          },
        });

        const sessionData = await sessionResponse.json();
        console.log("Session Data:", sessionData); // Verifica que los datos de la sesión están llegando correctamente

        // Si la sesión está vinculada, actualizamos el estado
        if (sessionData.isConnected) {
          setIsConnected(true);
          setTelegramUsername(sessionData.username || "");
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setErrorMessage("Failed to fetch session. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionId();
  }, [user]); // Ejecutar cuando el usuario cambie (si usas Clerk o un sistema similar)
  
  

  const handleUnlink = async () => {
    try {
      const response = await fetch("/api/telegram/unlink", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to unlink Telegram account.");
      }

      setIsConnected(false);
      setTelegramUsername("");
      alert("Telegram account unlinked successfully.");
    } catch (error: unknown) {
      console.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800">Integrations</h1>

      {loading ? (
        <div className="flex justify-center items-center text-gray-600">Loading...</div>
      ) : isConnected ? (
        <div className="flex flex-col items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FaTelegramPlane className="text-2xl text-blue-600" /> {/* Icono de Telegram */}
            <span className="text-lg text-green-700 font-semibold">
              Connected: {telegramUsername}
            </span>
            <span className="text-green-500">✅</span>
          </div>
          <button
            onClick={handleUnlink}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition duration-200"
          >
            Unlink Account
          </button>
        </div>
      ) : (
        <div className="flex justify-center items-center p-6">
          <button
            onClick={() => (window.location.href = "/dashboard/integrations/telegram")}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Link Telegram Account
          </button>
        </div>
      )}

      {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
    </div>
  );
}
