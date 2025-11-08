import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { buyerId, title, description, durationMinutes, bidDecrement, items } = body;

    // Validate required fields
    if (!buyerId || !title || !durationMinutes || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Calculate auction end time
    const now = new Date();
    const endsAt = new Date(now.getTime() + durationMinutes * 60000);

    // Create auction with nested items
    const auction = await prisma.auction.create({
      data: {
        buyerId,
        title,
        description,
        durationMinutes,
        bidDecrement,
        endsAt,
        items: {
          create: items.map((i: any) => ({
            name: i.name || "Unnamed Item",
            quantity: parseFloat(i.quantity) || 0,
            uom: i.uom || "Nos",
          })),
        },
      },
      include: { items: true },
    });

    // Broadcast via socket to all suppliers (realtime update)
    const io = getIO();
    io?.emit("auction-update", { auctionId: auction.id });

    return NextResponse.json({ message: "Auction created successfully", auction });
  } catch (err) {
    console.error("Error creating auction:", err);
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 });
  }
}
