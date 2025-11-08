"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupplierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/supplier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // show server-provided error if present
        alert(data?.error || "Login failed");
        setLoading(false);
        return;
      }

      // Save supplier info for dashboard use
      localStorage.setItem("supplier", JSON.stringify(data.supplier));

      alert("Login successful!");
      router.push("/supplier/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Supplier Login
        </h2>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block mb-1 text-sm text-gray-300">Email</label>
            <input
              type="email"
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="supplier@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-1 text-sm text-gray-300">Password</label>
            <input
              type="password"
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-4">
          Don’t have an account?{" "}
          <a href="/supplier/signup" className="text-blue-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
