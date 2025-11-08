"use client";

import AuthCard from "@/components/AuthCard";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupplierLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });

  const login = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...form, userType: "supplier" }),
    });

    if (res.ok) router.push("/supplier/dashboard");
    else alert("Login failed");
  };

  return (
    <AuthCard title="Supplier Login" subtitle="Access live auctions & submit bids">
      <div className="space-y-4">
        <input
          placeholder="Email"
          className="w-full rounded-lg bg-white/20 text-white p-3 placeholder-gray-300 focus:outline-white"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          className="w-full rounded-lg bg-white/20 text-white p-3 placeholder-gray-300 focus:outline-white"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          onClick={login}
          className="w-full bg-blue-500 hover:bg-blue-600 transition text-white p-3 rounded-lg font-semibold"
        >
          Login
        </button>

        <button
          className="w-full mt-2 text-gray-300 hover:underline text-sm"
          onClick={() => router.push("/supplier/signup")}
        >
          Create supplier account →
        </button>
      </div>
    </AuthCard>
  );
}

