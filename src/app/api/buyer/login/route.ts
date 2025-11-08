import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Look up buyer by email
    const buyer = await prisma.buyer.findUnique({ where: { email } });
    if (!buyer) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare password (hashed or plain for now)
    const passwordMatches = buyer.password.startsWith("$2b$")
      ? await bcrypt.compare(password, buyer.password)
      : buyer.password === password;

    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Success → return buyer info (no password)
    const { password: _, ...safeBuyer } = buyer;
    return NextResponse.json({ buyer: safeBuyer });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
