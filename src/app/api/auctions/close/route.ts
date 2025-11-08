import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    const { auctionId } = await req.json();

    const auction = await prisma.auction.update({
      where: { id: auctionId },
      data: { isActive: false, closedManually: true },
    });

    // Safely get Socket.IO instance and emit event
    const io = getIO();
    io?.emit(`auction-closed-${auctionId}`, { auctionId });

    return NextResponse.json({
      message: "Auction closed successfully",
      auction,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to close auction" },
      { status: 500 }
    );
  }
}
