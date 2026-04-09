import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(socketUrl, {
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Socket disconnected");
});

export default socket;
