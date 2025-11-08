import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, userType } = await req.json();

    const user =
      userType === "buyer"
        ? await prisma.buyer.findUnique({ where: { email } })
        : await prisma.supplier.findUnique({ where: { email } });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    const token = jwt.sign(
      { id: user.id, email: user.email, type: userType },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ message: "Login successful", token, user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

