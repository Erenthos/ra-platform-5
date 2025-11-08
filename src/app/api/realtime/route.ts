import { NextResponse } from "next/server";
import { io } from "@/lib/socket";

export async function GET() {
  // Simple endpoint to check socket connection health
  io.emit("ping", { message: "Realtime service active" });
  return NextResponse.json({ message: "Socket.IO running" });
}

