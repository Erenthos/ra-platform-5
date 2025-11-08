import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 🔍 Find buyer by email
    const buyer = await prisma.buyer.findUnique({
      where: { email },
    });

    if (!buyer || buyer.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Remove password from the returned object
    const { password: _, ...safeBuyer } = buyer;

    return NextResponse.json({
      message: "Login successful",
      buyer: safeBuyer,
    });
  } catch (err) {
    console.error("❌ Buyer login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
