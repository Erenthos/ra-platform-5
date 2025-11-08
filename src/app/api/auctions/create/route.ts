import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      buyerId,
      title,
      description,
      durationMinutes,
      bidDecrement,
      items,
    } = body;

    // ✅ Convert numeric fields safely
    const duration = Number(durationMinutes);
    const decrement = Number(bidDecrement);

    if (!buyerId || !title || !duration || isNaN(duration)) {
      return NextResponse.json(
        { error: "Invalid input: buyerId, title, or duration missing" },
        { status: 400 }
      );
    }

    // Calculate auction end time
    const now = new Date();
    const endsAt = new Date(now.getTime() + duration * 60000);

    // ✅ Create auction with numeric values and nested items
    const auction = await prisma.auction.create({
      data: {
        buyerId,
        title,
        description,
        durationMinutes: duration, // 👈 integer
        bidDecrement: decrement,   // 👈 float
        endsAt,
        items: {
          create: items.map((i: any) => ({
            name: i.name || "Unnamed Item",
            quantity: Number(i.quantity) || 0,
            uom: i.uom || "Nos",
          })),
        },
      },
      include: { items: true },
    });

    // Notify suppliers in real time
    const io = getIO();
    io?.emit("auction-update", { auctionId: auction.id });

    return NextResponse.json({
      message: "Auction created successfully",
      auction,
    });
  } catch (err) {
    console.error("❌ Error creating auction:", err);
    return NextResponse.json(
      { error: "Failed to create auction" },
      { status: 500 }
    );
  }
}
