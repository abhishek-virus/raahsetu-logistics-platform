
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const publicRoutes = require("./src/routes/publicRoutes");
const authRoutes = require("./src/routes/authRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");

const bookingRoutes = require("./src/routes/bookingRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.status(200).send("RaahSetu backend is running!");
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/customer/dashboard", dashboardRoutes);

app.use("/api/customer/bookings", bookingRoutes);

// Handle unknown API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`RaahSetu server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed. Check MongoDB configuration.");
    process.exit(1);
  }
}

startServer();
