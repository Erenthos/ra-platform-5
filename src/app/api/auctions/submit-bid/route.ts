import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    const { supplierId, auctionId, bids } = await req.json();
    if (!supplierId || !auctionId || !bids)
      return NextResponse.json({ error: "Missing data" }, { status: 400 });

    // 1️⃣ Save each bid
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

    // 2️⃣ Calculate total bid per supplier for this auction
    const allBids = await prisma.bid.findMany({
      where: { auctionId },
      include: { supplier: true },
    });

    const totals: Record<string, number> = {};
    for (const b of allBids) {
      totals[b.supplierId] = (totals[b.supplierId] || 0) + b.bidValue;
    }

    // 3️⃣ Determine ranks (lowest = L1)
    const ranked = Object.entries(totals)
      .sort(([, t1], [, t2]) => t1 - t2)
      .map(([sid], i) => ({
        supplierId: sid,
        rank: `L${i + 1}`,
      }));

    // 4️⃣ Emit live rank updates via Socket.IO
    const io = getIO();
    ranked.forEach((r) => {
      io?.emit("rank-update", {
        auctionId,
        supplierId: r.supplierId,
        rank: r.rank,
      });
    });

    // Also notify buyers to refresh auction data
    io?.emit("auction-update");

    return NextResponse.json({ message: "Bids saved and ranks updated." });
  } catch (err) {
    console.error("❌ submit-bid error:", err);
    return NextResponse.json({ error: "Bid submit failed" }, { status: 500 });
  }
}
