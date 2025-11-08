import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const auctionId = searchParams.get("auctionId");

  if (!auctionId) return NextResponse.json({ error: "Missing auctionId" }, { status: 400 });

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      bids: {
        include: { supplier: true },
      },
    },
  });

  if (!auction) return NextResponse.json({ error: "Auction not found" }, { status: 404 });

  // Group bids by supplier and calculate total
  const totals: Record<string, number> = {};
  for (const bid of auction.bids) {
    totals[bid.supplierId] = (totals[bid.supplierId] || 0) + bid.bidValue;
  }

  // Convert to rank array
  const summary = Object.entries(totals)
    .map(([supplierId, totalBid]) => {
      const s = auction.bids.find((b) => b.supplierId === supplierId)?.supplier;
      return {
        supplierName: s?.name,
        supplierEmail: s?.email,
        totalBid,
        updatedAt: new Date(),
      };
    })
    .sort((a, b) => a.totalBid - b.totalBid); // lowest first (L1)

  return NextResponse.json({
    title: auction.title,
    summary,
  });
}
