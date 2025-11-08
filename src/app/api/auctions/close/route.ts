import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    const { auctionId } = await req.json();
    if (!auctionId)
      return NextResponse.json({ error: "auctionId required" }, { status: 400 });

    const auction = await prisma.auction.update({
      where: { id: auctionId },
      data: { isActive: false },
    });

    const io = getIO();
    io?.emit("auction-closed", { auctionId });

    return NextResponse.json({ message: "Auction closed successfully", auction });
  } catch (err) {
    console.error("❌ Error closing auction:", err);
    return NextResponse.json({ error: "Failed to close auction" }, { status: 500 });
  }
}
