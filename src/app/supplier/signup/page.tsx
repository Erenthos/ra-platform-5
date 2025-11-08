"use client";

import AuthCard from "@/components/AuthCard";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupplierSignup() {
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
      body: JSON.stringify({ ...form, userType: "supplier" }),
    });
    router.push("/supplier/login");
  };

  return (
    <AuthCard title="Supplier Sign Up" subtitle="Become an approved bidder">
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

