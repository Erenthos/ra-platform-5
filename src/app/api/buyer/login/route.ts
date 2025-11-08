import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find buyer by email
    const buyer = await prisma.buyer.findUnique({
      where: { email },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Support both bcrypt-hashed and plain-text stored passwords:
    // - If password field looks like a bcrypt hash, use bcrypt.compare
    // - Otherwise fall back to plain equality (for legacy/test data)
    const isHashed = typeof buyer.password === "string" && buyer.password.startsWith("$2");
    const passwordMatches = isHashed
      ? await bcrypt.compare(password, buyer.password)
      : buyer.password === password;

    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Remove password before returning
    // (convert to plain object to allow destructuring)
    const { password: _pwd, ...safeBuyer } = buyer as any;

    return NextResponse.json({
      message: "Login successful",
      buyer: safeBuyer,
    });
  } catch (err) {
    console.error("Buyer login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
