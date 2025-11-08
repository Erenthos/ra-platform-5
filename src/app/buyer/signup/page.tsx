"use client";

import AuthCard from "@/components/AuthCard";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyerSignup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
  });

  const signup = async () => {
    await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...form, userType: "buyer" }),
    });
    router.push("/buyer/login");
  };

  return (
    <AuthCard title="Buyer Sign Up" subtitle="Start reverse auctions instantly">
      <div className="space-y-4">
        {["name", "companyName", "email", "password"].map((field) => (
          <input
            key={field}
            placeholder={field.replace(/^\w/, (c) => c.toUpperCase())}
            type={field === "password" ? "password" : "text"}
            className="w-full rounded-lg bg-white/20 text-white p-3 placeholder-gray-300"
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          />
        ))}

        <button
          onClick={signup}
          className="w-full bg-green-500 hover:bg-green-600 transition text-white p-3 rounded-lg font-semibold"
        >
          Create Account
        </button>
      </div>
    </AuthCard>
  );
}

