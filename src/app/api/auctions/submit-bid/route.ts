import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    const { supplierId, auctionId, bids } = await req.json();
    if (!supplierId || !auctionId || !bids)
      return NextResponse.json({ error: "Missing data" }, { status: 400 });

    // Upsert each bid
    for (const b of bids) {
      await prisma.bid.upsert({
        where: {
          supplierId_auctionItemId: {
            supplierId,
            auctionItemId: b.auctionItemId,
          },
        },
        create: {
          supplierId,
          auctionItemId: b.auctionItemId,
          bidValue: b.bidValue,
          auctionId,
        },
        update: { bidValue: b.bidValue },
      });
    }

    // --- 🔢  Recalculate ranks ---
    const allBids = await prisma.bid.findMany({
      where: { auctionId },
      include: { supplier: true },
    });

    const totals: Record<string, number> = {};
    allBids.forEach((b) => {
      totals[b.supplierId] = (totals[b.supplierId] || 0) + b.bidValue;
    });

    const ranked = Object.entries(totals)
      .sort(([, t1], [, t2]) => t1 - t2)
      .map(([sid], i) => ({ supplierId: sid, rank: `L${i + 1}` }));

    const io = getIO();
    ranked.forEach((r) => {
      io?.emit("rank-update", { auctionId, ...r });
    });
    io?.emit("auction-update"); // refresh buyer list

    return NextResponse.json({ message: "Bids saved and ranks updated." });
  } catch (err) {
    console.error("❌ submit-bid error:", err);
    return NextResponse.json({ error: "Bid submit failed" }, { status: 500 });
  }
}
