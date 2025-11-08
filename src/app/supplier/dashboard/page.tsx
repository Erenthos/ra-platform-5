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

  // ✅ Load supplier info
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

  // ✅ Fetch all live auctions
  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/auctions");
      if (res.ok) {
        const data = await res.json();
        const activeOnly = (data.auctions || []).filter((a: Auction) => a.isActive);
        setAuctions(activeOnly);
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
    }
  };

  // ✅ Fetch rank directly (for reliability)
  const fetchRank = async (auctionId: string) => {
    try {
      const res = await fetch(`/api/auctions`);
      if (!res.ok) return;
      const data = await res.json();
      const auction = data.auctions.find((a: any) => a.id === auctionId);
      if (auction && auction.bids) {
        const myBid = auction.bids.find((b: any) => b.supplierId === supplierId);
        if (myBid?.rank) {
          setRank(myBid.rank);
        }
      }
    } catch (err) {
      console.error("Error fetching rank:", err);
    }
  };

  // ✅ Socket connection
  useEffect(() => {
    fetchAuctions();
    const s = ioClient();
    setSocket(s);

    s.on("connect", () => console.log("✅ Socket connected"));
    s.on("auction-update", fetchAuctions);
    s.on("rank-update", (payload: any) => {
      if (
        payload.supplierId === supplierId &&
        selectedAuction?.id === payload.auctionId
      ) {
        console.log("📈 Rank update:", payload.rank);
        setRank(payload.rank);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [supplierId, selectedAuction?.id]);

  // ✅ Submit bids
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

      if (res.ok) {
        alert("✅ Bids submitted!");
        // Fetch the updated rank directly after submitting
        await fetchRank(selectedAuction.id);
      } else {
        alert("Failed to submit bids.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting bid");
    }
  };

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
            Welcome, <span className="text-blue-400 font-semibold">{supplierName}</span>
          </p>
        </div>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm"
        >
          Logout
        </button>
      </div>

      {/* BODY */}
      {!selectedAuction ? (
        <div className="grid md:grid-cols-2 gap-6">
          {auctions.length === 0 ? (
            <p className="text-gray-400">No live auctions available.</p>
          ) : (
            auctions.map((a) => (
              <motion.div
                key={a.id}
                className="bg-white/10 p-6 rounded-xl cursor-pointer border border-white/10 hover:border-blue-400/40"
                whileHover={{ scale: 1.03 }}
                onClick={() => {
                  setSelectedAuction(a);
                  setRank("--");
                  fetchRank(a.id); // load initial rank
                }}
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

          {/* Rank display under the table */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-lg">
              <span className="text-gray-300">Your Current Rank:</span>{" "}
              <span
                className={`font-bold ${
                  rank === "L1" ? "text-green-400" : "text-blue-300"
                }`}
              >
                {rank}
              </span>
            </p>

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
