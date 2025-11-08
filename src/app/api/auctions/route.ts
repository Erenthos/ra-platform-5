import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const auctions = await prisma.auction.findMany({
      where: { isActive: true },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ auctions });
  } catch (err) {
    console.error("❌ Error fetching auctions:", err);
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 });
  }
}
