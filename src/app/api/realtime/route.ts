import { NextResponse } from "next/server";
import { getIO } from "@/lib/socket";

export async function GET() {
  // Get Socket.IO instance safely
  const io = getIO();

  // Emit a ping event only if initialized
  io?.emit("ping", { message: "Realtime service active" });

  return NextResponse.json({ message: "Socket.IO running" });
}
