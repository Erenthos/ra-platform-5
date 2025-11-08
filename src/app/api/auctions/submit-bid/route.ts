import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";

type BidInput = { auctionItemId: string; bidValue: number };

export async function POST(req: Request) {
  try {
    const { supplierId, auctionId, bids } = await req.json() as {
      supplierId: string;
      auctionId: string;
      bids: BidInput[];
    };

    if (!supplierId || !auctionId || !Array.isArray(bids)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Upsert each bid (atomic transaction)
    await prisma.$transaction(
      bids.map((b) =>
        prisma.bid.upsert({
          where: {
            supplierId_auctionItemId: {
              supplierId,
              auctionItemId: b.auctionItemId,
            },
          },
          update: {
            bidValue: Number(b.bidValue),
            createdAt: new Date(),
          },
          create: {
            supplierId,
            auctionId,
            auctionItemId: b.auctionItemId,
            bidValue: Number(b.bidValue),
          },
        })
      )
    );

    // Recalculate totals per supplier for this auction
    const allBids = await prisma.bid.findMany({
      where: { auctionId },
      include: { supplier: true },
    });

    // Sum totals per supplierId
    const totals: Record<string, number> = {};
    for (const b of allBids) {
      totals[b.supplierId] = (totals[b.supplierId] || 0) + Number(b.bidValue);
    }

    // Build ranking: lower total -> better rank (L1)
    const rankingArray = Object.entries(totals)
      .map(([supId, total]) => ({ supplierId: supId, total }))
      .sort((a, b) => a.total - b.total);

    // Create map supplierId -> rank (L1, L2, ...)
    const rankMap: Record<string, number> = {};
    rankingArray.forEach((r, idx) => {
      rankMap[r.supplierId] = idx + 1;
    });

    // Emit updated rank to each supplier individually (do not reveal other suppliers' totals)
    const io = getIO();
    for (const supId of Object.keys(rankMap)) {
      // Emit to supplier-specific room
      io?.to(`supplier-${supId}`).emit("rank-update", {
        auctionId,
        rank: `L${rankMap[supId]}`,
        totalBid: totals[supId], // optional: total for supplier themself only
      });
    }

    // Also emit a generic auction-update to refresh listings (buyers/suppliers)
    io?.to(`auction-${auctionId}`).emit("auction-update", { auctionId });

    return NextResponse.json({ message: "Bids saved and ranks emitted" });
  } catch (err) {
    console.error("Bid submission failed:", err);
    return NextResponse.json({ error: "Bid submission failed" }, { status: 500 });
  }
}
