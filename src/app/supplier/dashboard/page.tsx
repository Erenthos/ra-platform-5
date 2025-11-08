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

type Auction = {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  bidDecrement: number;
  items: AuctionItem[];
  endsAt: string;
  createdAt: string;
};

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Record<string, number>>({});
  const [rank, setRank] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string>("");

  useEffect(() => {
    const supplier = JSON.parse(localStorage.getItem("supplier") || "null");
    if (supplier?.id) {
      setSupplierId(supplier.id);
      setSupplierName(supplier.name || "Supplier");
    } else {
      alert("Please log in again.");
      window.location.href = "/supplier/login";
    }
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
    if (!supplierId) return;
    fetchAuctions();

    const s = ioClient();
    setSocket(s);

    s.on("connect", () => {
      s.emit("register-supplier", supplierId);
    });

    s.on("auction-update", () => {
      fetchAuctions();
    });

    s.on("rank-update", (payload: any) => {
      console.log("🏁 Rank update received:", payload);
      if (
        payload?.auctionId &&
        selectedAuction &&
        payload.auctionId === selectedAuction.id
      ) {
        setRank(payload.rank);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [supplierId, selectedAuction?.id]);

  const openAuction = (a: Auction) => {
    setSelectedAuction(a);
    setRank(null);
    const initial: Record<string, number> = {};
    for (const it of a.items) initial[it.id] = 0;
    setBids(initial);
    socket?.emit("join-auction", a.id);
  };

  const handleBidChange = (itemId: string, value: string) => {
    const num = Number(value || 0);
    setBids((prev) => ({ ...prev, [itemId]: num }));
  };

  const submitBids = async () => {
    if (!supplierId || !selectedAuction) {
      alert("Please login and select an auction first.");
      return;
    }

    const bidArray = Object.entries(bids).map(([auctionItemId, bidValue]) => ({
      auctionItemId,
      bidValue: Number(bidValue || 0),
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
        alert("Bids submitted successfully! Your rank will update shortly.");
      } else {
        alert(data.error || "Failed to submit bids");
      }
    } catch (err) {
      console.error("Error submitting bids:", err);
      alert("Something went wrong.");
    }
  };

  const logout = () => {
    localStorage.removeItem("supplier");
    window.location.href = "/supplier/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
        <div className="text-right">
          <div className="text-gray-400 text-sm mb-1">
            Welcome,{" "}
            <span className="text-blue-400 font-semibold">{supplierName}</span>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {!selectedAuction ? (
        <>
          {auctions.length === 0 ? (
            <p className="text-center text-gray-400">
              No live auctions available right now.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((a) => (
                <motion.div
                  key={a.id}
                  className="bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-md cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  onClick={() => openAuction(a)}
                >
                  <h2 className="text-xl font-semibold mb-2">{a.title}</h2>
                  <p className="text-gray-400 text-sm mb-2">
                    {a.description || "No description"}
                  </p>
                  <p className="text-gray-300 text-sm">
                    Items: {a.items.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    Ends at: {new Date(a.endsAt).toLocaleString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-md max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold">{selectedAuction.title}</h2>
              <p className="text-gray-400 text-sm">{selectedAuction.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300">Your Rank</div>
              <div
                className={`text-2xl font-bold ${
                  rank === "L1" ? "text-green-400" : "text-blue-300"
                }`}
              >
                {rank ?? "--"}
              </div>
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-gray-300">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Qty</th>
                <th className="p-3">UOM</th>
                <th className="p-3 text-right">Your Bid (₹)</th>
              </tr>
            </thead>
            <tbody>
              {selectedAuction.items.map((it) => (
                <tr key={it.id} className="border-b border-white/10">
                  <td className="p-3">{it.name}</td>
                  <td className="p-3">{it.quantity}</td>
                  <td className="p-3">{it.uom}</td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      className="w-32 p-2 rounded bg-gray-900 border border-gray-700 text-white text-right"
                      value={String(bids[it.id] ?? "")}
                      onChange={(e) => handleBidChange(it.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                socket?.emit("leave-auction", selectedAuction.id);
                setSelectedAuction(null);
                setRank(null);
              }}
              className="bg-gray-700 px-4 py-2 rounded-lg"
            >
              Back
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
