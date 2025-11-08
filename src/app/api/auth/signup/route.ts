import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password, userType, companyName } = await req.json();

    if (!["buyer", "supplier"].includes(userType))
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });

    const hashedPassword = await hash(password, 10);

    if (userType === "buyer") {
      const buyer = await prisma.buyer.create({
        data: { name, email, password: hashedPassword, companyName },
      });
      return NextResponse.json({ message: "Buyer registered", buyer });
    }

    const supplier = await prisma.supplier.create({
      data: { name, email, password: hashedPassword, companyName },
    });
    return NextResponse.json({ message: "Supplier registered", supplier });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}

