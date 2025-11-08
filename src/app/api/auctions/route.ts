import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Auto-expire finished auctions
    await prisma.auction.updateMany({
      where: { endsAt: { lt: now }, isActive: true },
      data: { isActive: false },
    });

    // Pull every auction, include items and summarized bids
    const auctions = await prisma.auction.findMany({
      include: {
        items: true,
        bids: {
          include: { supplier: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build rank summary for buyer view
    const withRanks = auctions.map((a) => {
      const supplierTotals: Record<string, number> = {};
      a.bids.forEach((b) => {
        supplierTotals[b.supplierId] =
          (supplierTotals[b.supplierId] || 0) + b.bidValue;
      });

      const sorted = Object.entries(supplierTotals)
        .sort(([, t1], [, t2]) => t1 - t2)
        .map(([sid, total], i) => ({
          supplierId: sid,
          supplierName:
            a.bids.find((b) => b.supplierId === sid)?.supplier?.name || "",
          totalValue: total,
          rank: `L${i + 1}`,
        }));

      return { ...a, bids: sorted };
    });

    return NextResponse.json({ auctions: withRanks });
  } catch (err) {
    console.error("❌ auctions fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 });
  }
}
