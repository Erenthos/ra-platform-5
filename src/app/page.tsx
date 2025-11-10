"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black text-white overflow-hidden">
      {/* Top Navigation */}
      <header className="flex justify-between items-center p-6 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Reverse Auction Platform
        </h1>
        <nav className="flex gap-6 text-sm">
          <Link href="/buyer/login" className="hover:text-blue-400 transition">
            Buyer Login
          </Link>
          <Link href="/supplier/login" className="hover:text-blue-400 transition">
            Supplier Login
          </Link>
          <Link
            href="/buyer/signup"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold text-white"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 relative">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
            Experience the Future of Bidding with Avaada
          </h2>
          <p className="text-gray-300 text-lg md:text-xl mb-10">
            A next-generation <span className="text-blue-400 font-semibold"> Reverse Auction Platform </span>  
            empowering buyers and suppliers with real-time bidding, live ranking,  
            and total transparency — all in one beautiful interface.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/buyer/signup"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <Sparkles size={18} /> Start as Buyer
            </Link>
            <Link
              href="/supplier/signup"
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <Trophy size={18} /> Start as Supplier
            </Link>
          </div>
        </motion.div>

        {/* Animated gradient orb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
          className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-violet-500/10 to-transparent blur-3xl"
        ></motion.div>
      </section>

      {/* Feature Section */}
      <section className="relative z-10 py-24 px-6 bg-white/5 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          <FeatureCard
            icon={<Users className="text-blue-400" size={32} />}
            title="Buyer & Supplier Portals"
            text="Dedicated dashboards for each role — buyers create auctions, suppliers compete live."
          />
          <FeatureCard
            icon={<Trophy className="text-yellow-400" size={32} />}
            title="Real-Time Ranking"
            text="Suppliers see their rank instantly (L1, L2, L3) without revealing competitor prices."
          />
          <FeatureCard
            icon={<ArrowRight className="text-green-400" size={32} />}
            title="Instant Updates"
            text="Bids, auctions, and analytics refresh automatically without page reloads."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-400 text-sm py-6 border-t border-white/10 bg-black/30">
        © {new Date().getFullYear()} Reverse Auction Platform · Built with ❤️ by Shubham and team
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 border border-white/10 rounded-2xl p-8 shadow-lg hover:border-blue-400/40 transition"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-white/10">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-gray-400 text-sm">{text}</p>
      </div>
    </motion.div>
  );
}

