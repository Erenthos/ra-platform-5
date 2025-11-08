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

  // Read logged-in supplier from localStorage
  const supplier = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("supplier") || "null") : null;
  const supplierId = supplier?.id;

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

    // init socket
    const s = ioClient();
    setSocket(s);

    s.on("connect", () => {
      console.log("Socket connected:", s.id);
      if (supplierId) {
        s.emit("register-supplier", supplierId);
      }
    });

    s.on("auction-update", (payload: any) => {
      // refresh auctions list for supplier
      fetchAuctions();
    });

    // Listen for rank updates for this supplier
    s.on("rank-update", (payload: any) => {
      if (payload?.auctionId && selectedAuction && payload.auctionId === selectedAuction.id) {
        setRank(payload.rank);
      } else if (payload?.auctionId) {
        // If rank update for another auction and the supplier is viewing list,
        // we could optionally notify; for now we'll console.log
        console.log("Rank update (other auction):", payload);
      }

      // Optionally show supplier's own total
      if (payload?.totalBid !== undefined) {
        console.log(`Your total for auction ${payload.auctionId}:`, payload.totalBid);
      }
    });

    return () => {
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId, selectedAuction?.id]);

  const openAuction = (a: Auction) => {
    setSelectedAuction(a);
    setRank(null);

    // Pre-fill bids state for this auction items (existing 0)
    const initial: Record<string, number> = {};
    for (const it of a.items) initial[it.id] = 0;
    setBids(initial);

    // join auction room for potential auction-level events
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

    // prepare payload
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
        // Server will emit rank-update; show immediate feedback
        alert("Bids submitted. Your rank will update shortly.");
        // Optionally request rank refresh by refetching totals (but server pushes rank)
      } else {
        alert(data.error || "Failed to submit bids");
      }
    } catch (err) {
      console.error("Error submitting bids:", err);
      alert("Something went wrong while submitting bids.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Supplier Dashboard</h1>

      {!selectedAuction ? (
        <>
          {auctions.length === 0 ? (
            <p className="text-center text-gray-400">No live auctions available right now.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((a) => (
                <motion.div
                  key={a.id}
                  className="bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-md transition cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  onClick={() => openAuction(a)}
                >
                  <h2 className="text-xl font-semibold mb-2">{a.title}</h2>
                  <p className="text-gray-400 text-sm mb-2">{a.description}</p>
                  <p className="text-gray-300 text-sm">Items: {a.items.length}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Ends at: {new Date(a.endsAt).toLocaleString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Selected auction view with bid inputs
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-md max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold">{selectedAuction.title}</h2>
              <p className="text-gray-400 text-sm">{selectedAuction.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300">Your Rank</div>
              <div className={`text-2xl font-bold ${rank === "L1" ? "text-green-400" : "text-blue-300"}`}>
                {rank ?? "--"}
              </div>
            </div>
          </div>

          <div>
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

              <button onClick={submitBids} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">
                Submit Bids
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
