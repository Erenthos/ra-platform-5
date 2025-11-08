"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { Trophy, Send, TrendingDown } from "lucide-react";

const socket = io();

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [rank, setRank] = useState<string | null>(null);

  // Simulate supplier ID for now
  const supplierId = "supplier-123";

  // Fetch live auctions
  const fetchAuctions = async () => {
    const res = await fetch("/api/auctions?active=true");
    if (res.ok) {
      const data = await res.json();
      setAuctions(data.auctions || []);
    }
  };

  // Fetch ranking (mocked backend route for now)
  const fetchRanking = async (auctionId: string) => {
    const res = await fetch(`/api/auctions/rank?auctionId=${auctionId}&supplierId=${supplierId}`);
    if (res.ok) {
      const data = await res.json();
      setRank(data.rank);
    }
  };

  useEffect(() => {
    fetchAuctions();

    socket.on("auction-update", fetchAuctions);
    socket.on("auction-closed", fetchAuctions);

    return () => {
      socket.off("auction-update");
      socket.off("auction-closed");
    };
  }, []);

  const handleBidChange = (itemId: string, value: number) => {
    const updated = bids.map((b) =>
      b.auctionItemId === itemId ? { ...b, bidValue: value } : b
    );
    setBids(updated);
  };

  const submitBids = async () => {
    if (!selectedAuction) return;
    await fetch("/api/auctions/submit-bid", {
      method: "POST",
      body: JSON.stringify({
        supplierId,
        auctionId: selectedAuction.id,
        bids,
      }),
    });
    fetchRanking(selectedAuction.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold drop-shadow">Supplier Dashboard</h1>
          <p className="text-gray-400 text-sm">
            Join live auctions and compete for L1 position
          </p>
        </div>
      </header>

      {/* Auction List */}
      {!selectedAuction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Live Auctions</h2>
          {auctions.length === 0 ? (
            <p className="text-gray-400 text-sm">No live auctions currently.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {auctions.map((a, i) => (
                <motion.div
                  key={a.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 border border-white/10 rounded-xl p-4 hover:border-blue-400/50 cursor-pointer transition"
                  onClick={() => {
                    setSelectedAuction(a);
                    setBids(
                      a.items.map((it: any) => ({
                        auctionItemId: it.id,
                        bidValue: 0,
                      }))
                    );
                    fetchRanking(a.id);
                    socket.emit("join-auction", a.id);
                  }}
                >
                  <h3 className="font-semibold text-white text-lg">{a.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    {a.description || "No description"}
                  </p>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>{a.items.length} items</span>
                    <span>{a.durationMinutes} min</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Auction Details + Bid Form */}
      {selectedAuction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {selectedAuction.title}
              </h2>
              <p className="text-gray-400 text-sm">
                {selectedAuction.description}
              </p>
            </div>
            <button
              onClick={() => {
                socket.emit("leave-auction", selectedAuction.id);
                setSelectedAuction(null);
              }}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
            >
              ← Back
            </button>
          </div>

          {rank && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
              className={`text-center mb-6 p-4 rounded-xl ${
                rank === "L1"
                  ? "bg-green-600/30 border border-green-400 shadow-green-400/40"
                  : "bg-white/10 border border-white/10"
              }`}
            >
              <div className="flex justify-center items-center gap-2 text-xl font-bold text-white">
                <Trophy
                  className={
                    rank === "L1"
                      ? "text-yellow-400 animate-pulse"
                      : "text-gray-300"
                  }
                />
                Your Current Rank:{" "}
                <span className="text-blue-400 ml-1">{rank}</span>
              </div>
            </motion.div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/20 text-gray-300">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">UOM</th>
                  <th className="p-3 text-right">Your Bid (₹)</th>
                </tr>
              </thead>
              <tbody>
                {selectedAuction.items.map((item: any, index: number) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/10 hover:bg-white/10 transition"
                  >
                    <td className="p-3 text-gray-200 font-medium">{item.name}</td>
                    <td className="p-3 text-gray-400">{item.quantity}</td>
                    <td className="p-3 text-gray-400">{item.uom}</td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        placeholder="Enter bid"
                        className="w-28 text-right p-2 bg-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-white"
                        onChange={(e) =>
                          handleBidChange(item.id, Number(e.target.value))
                        }
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={submitBids}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-lg font-semibold"
            >
              <Send size={18} /> Submit Bids
            </button>
            <button
              onClick={() => {
                fetchRanking(selectedAuction.id);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg font-semibold"
            >
              <TrendingDown size={18} /> Refresh Rank
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

