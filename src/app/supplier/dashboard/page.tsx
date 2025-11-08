"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ioClient, { Socket } from "socket.io-client";

type AuctionItem = {
  id: string;
  name: string;
  quantity: number;
  uom: string;
};

type Auction = {
  id: string;
  title: string;
  description?: string;
  endsAt: string;
  isActive: boolean;
  items: AuctionItem[];
};

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Record<string, number>>({});
  const [rank, setRank] = useState<string>("--");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string>("");

  // ✅ Load supplier info from localStorage
  useEffect(() => {
    const supplier = JSON.parse(localStorage.getItem("supplier") || "null");
    if (!supplier?.id) {
      alert("Please log in again.");
      window.location.href = "/supplier/login";
    } else {
      setSupplierId(supplier.id);
      setSupplierName(supplier.name || "Supplier");
    }
  }, []);

  // ✅ Fetch all auctions (we’ll filter active ones)
  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/auctions");
      if (res.ok) {
        const data = await res.json();
        // Only show live auctions to suppliers
        const activeOnly = (data.auctions || []).filter(
          (a: Auction) => a.isActive
        );
        setAuctions(activeOnly);
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
    }
  };

  // ✅ Setup socket for live updates
  useEffect(() => {
    fetchAuctions();
    const s = ioClient();
    setSocket(s);

    s.on("connect", () => console.log("Socket connected to server"));
    s.on("auction-update", fetchAuctions);

    s.on("rank-update", (payload: any) => {
      if (
        payload.supplierId === supplierId &&
        selectedAuction?.id === payload.auctionId
      ) {
        setRank(payload.rank);
      }
    });

    // ✅ Proper cleanup
    return () => {
      s.disconnect();
    };
  }, [supplierId, selectedAuction?.id]);

  // ✅ Submit bid handler
  const submitBids = async () => {
    if (!selectedAuction || !supplierId) {
      alert("Please select auction first.");
      return;
    }

    const bidArray = Object.entries(bids).map(([auctionItemId, bidValue]) => ({
      auctionItemId,
      bidValue: Number(bidValue),
    }));

    try {
      const res = await fetch("/api/auctions/submit-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          auctionId: selectedAuction.id,
          bids: bidArray,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Bids submitted! Rank will update automatically.");
      } else {
        alert(data.error || "Failed to submit bids");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting bid");
    }
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("supplier");
    window.location.href = "/supplier/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
          <p className="text-gray-400 text-sm">
            Welcome,{" "}
            <span className="text-blue-400 font-semibold">{supplierName}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Your Rank</p>
          <p
            className={`text-3xl font-bold ${
              rank === "L1" ? "text-green-400" : "text-blue-300"
            }`}
          >
            {rank}
          </p>
          <button
            onClick={logout}
            className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* BODY */}
      {!selectedAuction ? (
        <div className="grid md:grid-cols-2 gap-6">
          {auctions.length === 0 ? (
            <p className="text-gray-400">
              No live auctions available at the moment.
            </p>
          ) : (
            auctions.map((a) => (
              <motion.div
                key={a.id}
                className="bg-white/10 p-6 rounded-xl cursor-pointer border border-white/10 hover:border-blue-400/40"
                whileHover={{ scale: 1.03 }}
                onClick={() => setSelectedAuction(a)}
              >
                <h2 className="text-xl font-semibold mb-1">{a.title}</h2>
                <p className="text-gray-400 text-sm">{a.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Ends: {new Date(a.endsAt).toLocaleString()}
                </p>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white/10 p-6 rounded-xl max-w-4xl mx-auto border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">{selectedAuction.title}</h2>
            <button
              onClick={() => {
                setSelectedAuction(null);
                setRank("--");
              }}
              className="bg-gray-700 px-4 py-1 rounded-lg text-sm"
            >
              ← Back
            </button>
          </div>

          <table className="w-full text-sm border border-white/10">
            <thead className="bg-white/10">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-center">UOM</th>
                <th className="p-2 text-right">Your Bid (₹)</th>
              </tr>
            </thead>
            <tbody>
              {selectedAuction.items.map((it) => (
                <tr key={it.id} className="border-t border-white/10">
                  <td className="p-2">{it.name}</td>
                  <td className="p-2 text-center">{it.quantity}</td>
                  <td className="p-2 text-center">{it.uom}</td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      className="bg-gray-900 border border-gray-700 text-right rounded p-2 w-28"
                      value={String(bids[it.id] ?? "")}
                      onChange={(e) =>
                        setBids((prev) => ({
                          ...prev,
                          [it.id]: Number(e.target.value),
                        }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4 gap-3">
            <button
              onClick={() => {
                setSelectedAuction(null);
                setRank("--");
              }}
              className="bg-gray-700 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={submitBids}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
            >
              Submit Bids
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
