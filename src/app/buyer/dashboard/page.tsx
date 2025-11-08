"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [bidDecrement, setBidDecrement] = useState("");
  const [items, setItems] = useState([{ name: "", quantity: "", uom: "" }]);

  const fetchAuctions = async () => {
    const res = await fetch("/api/auctions");
    if (res.ok) {
      const data = await res.json();
      setAuctions(data.auctions);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleCreateAuction = async () => {
    try {
      const buyer = JSON.parse(localStorage.getItem("buyer") || "{}");
      if (!buyer?.id) {
        alert("Buyer info missing. Please log in again.");
        return;
      }

      const res = await fetch("/api/auctions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: buyer.id, // ✅ Dynamically included buyerId
          title,
          description,
          durationMinutes,
          bidDecrement,
          items,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Auction created successfully!");
        setIsModalOpen(false);
        fetchAuctions();
      } else {
        alert(data.error || "Failed to create auction");
      }
    } catch (err) {
      console.error("Error creating auction:", err);
      alert("Something went wrong.");
    }
  };

  const handleAddItem = () => {
    setItems([...items, { name: "", quantity: "", uom: "" }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Buyer Dashboard</h1>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg mb-6"
      >
        Create New Auction
      </button>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => (
          <motion.div
            key={auction.id}
            className="bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-md"
            whileHover={{ scale: 1.02 }}
          >
            <h2 className="text-xl font-semibold mb-2">{auction.title}</h2>
            <p className="text-gray-400 text-sm mb-2">
              Duration: {auction.durationMinutes} mins
            </p>
            <p className="text-gray-400 text-sm mb-2">
              Bid Decrement: ₹{auction.bidDecrement}
            </p>
            <p className="text-gray-300 text-sm">
              {auction.description || "No description provided."}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-xl w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Create New Auction</h2>

            <div className="mb-3">
              <label className="block mb-1 text-sm">Title</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="block mb-1 text-sm">Description</label>
              <textarea
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block mb-1 text-sm">Duration (mins)</label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm">Bid Decrement ₹</label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                  value={bidDecrement}
                  onChange={(e) => setBidDecrement(e.target.value)}
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-4 mb-2">Auction Items</h3>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-3 gap-3 mb-2">
                <input
                  type="text"
                  placeholder="Name"
                  className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].name = e.target.value;
                    setItems(newItems);
                  }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].quantity = e.target.value;
                    setItems(newItems);
                  }}
                />
                <input
                  type="text"
                  placeholder="UOM"
                  className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
                  value={item.uom}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].uom = e.target.value;
                    setItems(newItems);
                  }}
                />
              </div>
            ))}

            <button
              onClick={handleAddItem}
              className="text-blue-400 text-sm mt-2 mb-4 hover:underline"
            >
              + Add another item
            </button>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAuction}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
