"use client";

import { useState } from "react";

type AuctionItem = {
  name: string;
  quantity: number;
  uom: string;
};

export default function NewAuctionPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [bidDecrement, setBidDecrement] = useState<number>(100);
  const [items, setItems] = useState<AuctionItem[]>([
    { name: "", quantity: 1, uom: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const addItem = () =>
    setItems([...items, { name: "", quantity: 1, uom: "" }]);

  const updateItem = (index: number, field: keyof AuctionItem, value: string) => {
    const updated = [...items];
    updated[index][field] =
      field === "quantity" ? Number(value) : (value as string);
    setItems(updated);
  };

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const buyer = JSON.parse(localStorage.getItem("buyer") || "null");
    if (!buyer?.id) {
      alert("Please log in again.");
      window.location.href = "/buyer/login";
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auctions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: buyer.id,
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
        window.location.href = "/buyer/dashboard";
      } else {
        alert(data.error || "Failed to create auction");
      }
    } catch (err) {
      console.error("Error creating auction:", err);
      alert("Error creating auction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <div className="max-w-3xl mx-auto bg-white/10 p-8 rounded-xl shadow-lg border border-white/10">
        <h1 className="text-3xl font-bold mb-6 text-center">Create New Auction</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Bid Decrement (₹)
              </label>
              <input
                type="number"
                value={bidDecrement}
                onChange={(e) => setBidDecrement(Number(e.target.value))}
                className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Auction Items</label>
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 mb-2 items-center"
              >
                <input
                  type="text"
                  placeholder="Item Name"
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  className="col-span-5 p-2 bg-gray-900 border border-gray-700 rounded"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  className="col-span-2 p-2 bg-gray-900 border border-gray-700 rounded"
                />
                <input
                  type="text"
                  placeholder="UOM"
                  value={item.uom}
                  onChange={(e) => updateItem(index, "uom", e.target.value)}
                  className="col-span-3 p-2 bg-gray-900 border border-gray-700 rounded"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="col-span-2 text-red-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addItem}
              className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
            >
              + Add another item
            </button>
          </div>

          <div className="flex justify-end mt-6 gap-3">
            <button
              onClick={() => (window.location.href = "/buyer/dashboard")}
              className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-4 py-2 rounded-lg ${
                loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Creating..." : "Create Auction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
