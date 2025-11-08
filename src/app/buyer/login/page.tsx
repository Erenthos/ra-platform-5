"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/buyer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // ✅ Store buyer info locally for dashboard use
      localStorage.setItem("buyer", JSON.stringify(data.buyer));

      alert("Login successful!");
      router.push("/buyer/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <form
        onSubmit={handleLogin}
        className="bg-white/10 backdrop-blur-xl p-8 rounded-xl w-full max-w-md border border-white/10"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Buyer Login</h2>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Email</label>
          <input
            type="email"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-sm">Password</label>
          <input
            type="password"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
