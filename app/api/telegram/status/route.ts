import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");

  console.log("User ID received:", userId);

  if (!userId) {
    console.log("User ID is missing");
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    // Consultar 'usersTelegram' con el userId
    const userTelegram = await convex.query(api.usersTelegram.getByUserId, { userId });

    console.log("User data from usersTelegram:", userTelegram);

    if (!userTelegram || !userTelegram.nickname) {
      console.log("User not linked with Telegram or nickname missing.");
      return NextResponse.json({ isConnected: false });
    }

    // Consultar session_id en 'telegramSessions'
    const session = await convex.query(api.telegramSessions.getByUserId, { userId });

    console.log("Session data from telegramSessions:", session);

    if (!session || !session.session_id) {
      console.log("Session ID is missing or user is not linked.");
      return NextResponse.json({ isConnected: false });
    }

    return NextResponse.json({
      isConnected: true,
      username: userTelegram.nickname,
      session_id: session.session_id,
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
