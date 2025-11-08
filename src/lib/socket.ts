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

      socket.on("join-auction", (auctionId: string) => {
        socket.join(auctionId);
        console.log(`📦 Joined auction room: ${auctionId}`);
      });

      socket.on("leave-auction", (auctionId: string) => {
        socket.leave(auctionId);
        console.log(`🚪 Left auction room: ${auctionId}`);
      });

      socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  return io;
}

export { io };

