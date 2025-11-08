// src/app/api/supplier/login/route.ts
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

    const supplier = await prisma.supplier.findUnique({ where: { email } });

    if (!supplier) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isHashed =
      typeof supplier.password === "string" && supplier.password.startsWith("$2");

    const passwordMatches = isHashed
      ? await bcrypt.compare(password, supplier.password)
      : supplier.password === password;

    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Remove password before returning
    const { password: _pwd, ...safeSupplier } = supplier as any;

    return NextResponse.json({
      message: "Login successful",
      supplier: safeSupplier,
    });
  } catch (err) {
    console.error("Supplier login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
