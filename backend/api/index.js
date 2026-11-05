// server/api/index.js

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors({
  origin: "https://future-skill-n54f.vercel.app",
  credentials: true
}));

app.use(express.json());

// Database connection ko reuse karne ki koshish
let connectionPromise;

async function connectDB() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}

// Database wali routes se pehle connection establish karo
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Example route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working!" });
});

// Apni existing routes yahan add karo
// app.use("/api/users", userRoutes);

module.exports = app;
