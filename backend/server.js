// server.js

const express = require("express");
const app = express();

// Middleware
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully!");
});

// Sample API Route
app.get("/api/data", (req, res) => {
  res.json({
    message: "Hello from backend 👋",
    status: "success",
  });
});

// POST Example
app.post("/api/post", (req, res) => {
  const data = req.body;

  res.json({
    message: "Data received successfully!",
    receivedData: data,
  });
});

// Port
const PORT = 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
