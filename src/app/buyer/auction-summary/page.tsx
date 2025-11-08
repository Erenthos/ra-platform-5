"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import { Trophy, RefreshCcw } from "lucide-react";

const socket = io();

export default function AuctionSummary() {
  const [auctionId, setAuctionId] = useState<string>("");
  const [summary, setSummary] = useState<any[]>([]);
  const [auctionTitle, setAuctionTitle] = useState<string>("Auction Summary");
  const [loading, setLoading] = useState(false);

  const fetchSummary = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/api/auctions/summary?auctionId=${id}`);
    if (res.ok) {
      const data = await res.json();
      setSummary(data.summary);
      setAuctionTitle(data.title || "Auction Summary");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (auctionId) fetchSummary(auctionId);
  }, [auctionId]);

  useEffect(() => {
    // Realtime update
    socket.on("auction-update", () => {
      if (auctionId) fetchSummary(auctionId);
    });
    socket.on("auction-closed", () => {
      if (auctionId) fetchSummary(auctionId);
    });

    return () => {
      socket.off("auction-update");
      socket.off("auction-closed");
    };
  }, [auctionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold drop-shadow">{auctionTitle}</h1>
          <p className="text-gray-400 text-sm">
            Live ranking and bid summary for all suppliers
          </p>
        </div>
        <button
          onClick={() => auctionId && fetchSummary(auctionId)}
          disabled={!auctionId}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          <RefreshCcw size={18} /> Refresh
        </button>
      </header>

      {/* Auction ID Input */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6 shadow-lg">
        <label className="block mb-2 text-gray-300 text-sm font-medium">
          Enter Auction ID
        </label>
        <div className="flex gap-2">
          <input
            placeholder="e.g. 21af98c1-..." 
            className="flex-1 rounded-lg bg-white/20 text-white p-3 placeholder-gray-400 focus:outline-white"
            value={auctionId}
            onChange={(e) => setAuctionId(e.target.value)}
          />
          <button
            onClick={() => fetchSummary(auctionId)}
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg font-semibold"
          >
            Load
          </button>
        </div>
      </div>

      {/* Summary Table */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading summary...</div>
      ) : summary.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No data available. Enter a valid auction ID.
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Supplier Rankings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/20 text-gray-300">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Supplier Email</th>
                  <th className="p-3 text-right">Total Bid (₹)</th>
                  <th className="p-3 text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row: any, i: number) => (
                  <motion.tr
                    key={row.supplierEmail}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border-b border-white/10 ${
                      i === 0
                        ? "bg-green-600/30 border-green-400/50 shadow-green-500/20"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <td className="p-3 font-semibold flex items-center gap-2">
                      {i === 0 ? (
                        <Trophy className="text-yellow-400 animate-pulse" size={16} />
                      ) : null}
                      <span>L{i + 1}</span>
                    </td>
                    <td className="p-3 text-gray-200">{row.supplierName}</td>
                    <td className="p-3 text-gray-300">{row.supplierEmail}</td>
                    <td className="p-3 text-right font-medium text-blue-400">
                      ₹{row.totalBid.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-gray-400 text-xs">
                      {new Date(row.updatedAt).toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
