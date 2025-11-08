import { Server } from "socket.io";

let io: Server | null = null;

export function getIO() {
  if (!io) {
    io = new Server({
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);

      // join auction room
      socket.on("join-auction", (auctionId: string) => {
        socket.join(`auction-${auctionId}`);
        console.log(`📦 Socket ${socket.id} joined auction room: auction-${auctionId}`);
      });

      socket.on("leave-auction", (auctionId: string) => {
        socket.leave(`auction-${auctionId}`);
        console.log(`🚪 Socket ${socket.id} left auction room: auction-${auctionId}`);
      });

      // register supplier so we can send private rank updates
      socket.on("register-supplier", (supplierId: string) => {
        if (!supplierId) return;
        socket.join(`supplier-${supplierId}`);
        console.log(`🔖 Socket ${socket.id} registered supplier room: supplier-${supplierId}`);
      });

      socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  return io;
}
