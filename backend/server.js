const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load env variables
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Server running...");
});

// API test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working ✅" });
});

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`🔥 Server started on http://localhost:${PORT}`);
});
