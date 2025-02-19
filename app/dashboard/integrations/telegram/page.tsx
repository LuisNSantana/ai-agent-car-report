"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function TelegramIntegration() {
  const { user } = useUser();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [session, setSession] = useState(""); // Almacena la sesión temporal
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isValidPhoneNumber = (phone: string) => /^\+\d{1,3}\d{9,15}$/.test(phone);

  const handleStartLogin = async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      setErrorMessage("Invalid phone number format.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/telegram/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start Telegram login.");
      }

      setSession(data.session); // Guardar la sesión temporal
      alert("Check your Telegram app for the verification code!");
      setStep(2); // Avanzar al siguiente paso
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

      // Manejo de errores específicos
      if (errorMessage.includes("FLOOD")) {
        setErrorMessage(
          "Too many attempts. Please wait a few minutes before trying again."
        );
      } else if (errorMessage.includes("PHONE_NUMBER_INVALID")) {
        setErrorMessage("The phone number you entered is invalid.");
      } else {
        setErrorMessage(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
  
    // Asegúrate de que estos valores existan
    if (!phoneCode || !session || !phoneNumber || !user?.id) {
      setErrorMessage("Verification code, session, phone number, and user ID are required.");
      setIsSubmitting(false);
      return;
    }
  
    try {
      const response = await fetch("/api/telegram/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneCode,
          session,
          phoneNumber,
          userId: user.id,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to verify Telegram code.");
      }
  
      alert("Your Telegram account has been linked successfully!");
      window.location.href = "/dashboard/integrations"; // Redirigir al dashboard
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-4">
      <h1 className="text-xl font-bold">Link Your Telegram Account</h1>
      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
      {step === 1 ? (
        <>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter your phone number (e.g., +34XXXXXXXXX)"
            className="border rounded px-4 py-2 w-64"
          />
          <button
            onClick={handleStartLogin}
            disabled={isSubmitting}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isSubmitting ? "Submitting..." : "Start Login"}
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={phoneCode}
            onChange={(e) => setPhoneCode(e.target.value)}
            placeholder="Enter the code you received"
            className="border rounded px-4 py-2 w-64"
          />
          <button
            onClick={handleCompleteLogin}
            disabled={isSubmitting}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isSubmitting ? "Submitting..." : "Complete Login"}
          </button>
        </>
      )}
    </div>
  );
}
