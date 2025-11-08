import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    const { supplierId, auctionId, bids } = await req.json();

    // bids = [{ auctionItemId: '...', bidValue: 123.45 }, ...]

    await prisma.$transaction(
      bids.map((b: any) =>
        prisma.bid.upsert({
          where: {
            supplierId_auctionItemId: {
              supplierId,
              auctionItemId: b.auctionItemId,
            },
          },
          update: {
            bidValue: b.bidValue,
            createdAt: new Date(),
          },
          create: {
            supplierId,
            auctionId,
            auctionItemId: b.auctionItemId,
            bidValue: b.bidValue,
          },
        })
      )
    );

    // Emit live update event safely
    const io = getIO();
    io?.emit(`auction-update-${auctionId}`, { auctionId });

    return NextResponse.json({ message: "Bids submitted successfully" });
  } catch (err) {
    console.error("Bid submission failed:", err);
    return NextResponse.json(
      { error: "Bid submission failed" },
      { status: 500 }
    );
  }
}
