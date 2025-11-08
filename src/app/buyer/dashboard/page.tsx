"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { PlusCircle, Clock, Hammer } from "lucide-react";

const socket = io();

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 10,
    bidDecrement: 50,
    items: [{ name: "", quantity: "", uom: "" }],
  });

  useEffect(() => {
    // Simulate fetching buyer auctions
    const fetchAuctions = async () => {
      const res = await fetch("/api/auctions?buyerId=dummy");
      if (res.ok) {
        const data = await res.json();
        setAuctions(data.auctions || []);
      }
    };
    fetchAuctions();

    // Listen for live updates
    socket.on("auction-update", () => fetchAuctions());
    socket.on("auction-closed", () => fetchAuctions());

    return () => {
      socket.off("auction-update");
      socket.off("auction-closed");
    };
  }, []);

  const createAuction = async () => {
    await fetch("/api/auctions/create", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        buyerId: "dummy",
      }),
    });
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow">
            Buyer Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Manage your live and completed auctions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-lg font-semibold"
        >
          <PlusCircle size={18} /> Create Auction
        </button>
      </header>

      {/* Auction Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Active Auctions
        </h2>
        {auctions.length === 0 ? (
          <p className="text-gray-400 text-sm">No active auctions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/20 text-gray-300">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Bid Decrement</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/10 hover:bg-white/10 transition"
                  >
                    <td className="p-3 font-medium">{a.title}</td>
                    <td className="p-3 text-gray-300">
                      {a.items?.length || 0} items
                    </td>
                    <td className="p-3 text-gray-300">₹{a.bidDecrement}</td>
                    <td className="p-3 text-gray-300">{a.durationMinutes} min</td>
                    <td className="p-3">
                      {a.isActive ? (
                        <span className="text-green-400 font-semibold flex items-center gap-1">
                          <Clock size={14} /> Live
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <Hammer size={14} /> Closed
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        disabled={!a.isActive}
                        onClick={async () => {
                          await fetch("/api/auctions/close", {
                            method: "POST",
                            body: JSON.stringify({ auctionId: a.id }),
                          });
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold ${
                          a.isActive
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-gray-600 cursor-not-allowed"
                        }`}
                      >
                        {a.isActive ? "Close Auction" : "Closed"}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Creating Auction */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 border border-white/20 rounded-xl p-6 w-full max-w-lg"
          >
            <h2 className="text-xl font-semibold mb-4">Create New Auction</h2>

            <div className="space-y-3">
              <input
                placeholder="Title"
                className="w-full p-2 rounded bg-white/20 text-white placeholder-gray-300"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                placeholder="Description"
                className="w-full p-2 rounded bg-white/20 text-white placeholder-gray-300"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Duration (mins)"
                  className="w-1/2 p-2 rounded bg-white/20 text-white placeholder-gray-300"
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  placeholder="Bid Decrement ₹"
                  className="w-1/2 p-2 rounded bg-white/20 text-white placeholder-gray-300"
                  onChange={(e) =>
                    setForm({ ...form, bidDecrement: Number(e.target.value) })
                  }
                />
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h3 className="text-sm text-gray-300 font-medium">
                  Auction Items
                </h3>
                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      placeholder="Name"
                      className="w-1/2 p-2 rounded bg-white/20 text-white"
                      onChange={(e) => {
                        const newItems = [...form.items];
                        newItems[index].name = e.target.value;
                        setForm({ ...form, items: newItems });
                      }}
                    />
                    <input
                      placeholder="Qty"
                      className="w-1/4 p-2 rounded bg-white/20 text-white"
                      onChange={(e) => {
                        const newItems = [...form.items];
                        newItems[index].quantity = e.target.value;
                        setForm({ ...form, items: newItems });
                      }}
                    />
                    <input
                      placeholder="UOM"
                      className="w-1/4 p-2 rounded bg-white/20 text-white"
                      onChange={(e) => {
                        const newItems = [...form.items];
                        newItems[index].uom = e.target.value;
                        setForm({ ...form, items: newItems });
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    setForm({
                      ...form,
                      items: [...form.items, { name: "", quantity: "", uom: "" }],
                    })
                  }
                  className="text-blue-400 text-sm font-medium hover:underline"
                >
                  + Add another item
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={createAuction}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 font-semibold"
                >
                  Create
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

