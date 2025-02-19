import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id"); // Recupera el ID del usuario

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    // Eliminar la cuenta de Telegram de 'usersTelegram'
    await convex.mutation(api.usersTelegram.deleteByUserId, { userId });

    // Eliminar la sesión de Telegram de 'telegramSessions'
    await convex.mutation(api.telegramSessions.deleteByUserId, { userId });

    return NextResponse.json({ success: true, message: "Telegram account unlinked successfully." });
  } catch (error) {
    console.error("Error unlinking Telegram account:", error);
    return NextResponse.json(
      { error: "Failed to unlink Telegram account" },
      { status: 500 }
    );
  }
}
