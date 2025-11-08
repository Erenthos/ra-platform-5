import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { title, description, buyerId, items, bidDecrement, durationMinutes } = await req.json();

    const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const auction = await prisma.auction.create({
      data: {
        title,
        description,
        buyerId,
        bidDecrement,
        durationMinutes,
        endsAt,
        items: {
          create: items.map((i: any) => ({
            name: i.name,
            description: i.description,
            quantity: i.quantity,
            uom: i.uom,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ message: "Auction created", auction });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Auction creation failed" }, { status: 500 });
  }
}

