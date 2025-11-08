"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ioClient from "socket.io-client";

type AuctionItem = {
  id: string;
  name: string;
  quantity: number;
  uom: string;
};

type SupplierBid = {
  supplierId: string;
  supplierName: string;
  totalValue: number;
  rank: string;
};

type Auction = {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  endsAt: string;
  createdAt: string;
  items: AuctionItem[];
  bids?: SupplierBid[];
};

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [buyer, setBuyer] = useState<any>(null);

  useEffect(() => {
    const buyerData = JSON.parse(localStorage.getItem("buyer") || "null");
    if (!buyerData) {
      alert("Please log in again.");
      window.location.href = "/buyer/login";
    } else setBuyer(buyerData);
  }, []);

  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/auctions");
      if (res.ok) {
        const data = await res.json();
        setAuctions(data.auctions || []);
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
    }
  };

  useEffect(() => {
    fetchAuctions();
    const s = ioClient();
    setSocket(s);

    s.on("connect", () => console.log("Socket connected"));
    s.on("auction-update", fetchAuctions);
    s.on("rank-update", fetchAuctions);
    s.on("auction-closed", fetchAuctions);

    return () => {
      s.disconnect();
    };
  }, []);

  const handleCloseAuction = async (auctionId: string) => {
    if (!confirm("Are you sure you want to close this auction?")) return;
    try {
      const res = await fetch("/api/auctions/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId }),
      });
      if (res.ok) {
        alert("Auction closed successfully!");
        fetchAuctions();
      } else {
        alert("Failed to close auction.");
      }
    } catch (err) {
      console.error("Error closing auction:", err);
    }
  };

  const handleDownloadSummary = async (auctionId: string) => {
    try {
      const res = await fetch("/api/auctions/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId }),
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Auction_Summary_${auctionId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download summary");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
        <button
          onClick={() => {
            localStorage.removeItem("buyer");
            window.location.href = "/buyer/login";
          }}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm"
        >
          Logout
        </button>
      </div>

      <div className="text-right mb-6">
        <a
          href="#"
          onClick={() => (window.location.href = "/buyer/new-auction")}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
        >
          + Create New Auction
        </a>
      </div>

      {auctions.length === 0 ? (
        <p className="text-center text-gray-400">No auctions found.</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {auctions.map((a) => (
            <motion.div
              key={a.id}
              className={`p-6 rounded-xl backdrop-blur-xl border shadow-md ${
                a.isActive
                  ? "bg-green-900/40 border-green-500/30"
                  : "bg-gray-800/40 border-gray-600/30"
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-xl font-semibold mb-2">{a.title}</h2>
              <p className="text-gray-400 text-sm mb-2">
                {a.description || "No description"}
              </p>
              <p className="text-sm">
                Status:{" "}
                <span
                  className={`font-bold ${
                    a.isActive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {a.isActive ? "Live" : "Closed"}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Ends at: {new Date(a.endsAt).toLocaleString()}
              </p>

              {a.bids && a.bids.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2 text-gray-300">
                    Supplier Rankings
                  </h3>
                  <table className="w-full text-sm border border-white/10 rounded">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="p-2 text-left">Rank</th>
                        <th className="p-2 text-left">Supplier</th>
                        <th className="p-2 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.bids.map((b) => (
                        <tr key={b.supplierId} className="border-t border-white/10">
                          <td className="p-2">{b.rank}</td>
                          <td className="p-2">{b.supplierName}</td>
                          <td className="p-2 text-right">{b.totalValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                {a.isActive ? (
                  <button
                    onClick={() => handleCloseAuction(a.id)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                  >
                    Close Auction
                  </button>
                ) : (
                  <button
                    onClick={() => handleDownloadSummary(a.id)}
                    className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg"
                  >
                    Download Summary
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
