
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./src/config/db");

// =========================================
// ROUTE IMPORTS
// =========================================

// Customer Routes
const publicRoutes = require("./src/routes/publicRoutes");
const authRoutes = require("./src/routes/authRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");

// Driver Routes
const driverAuthRoutes = require("./src/routes/driverAuthRoutes");
const driverRoutes = require("./src/routes/driverRoutes");

// Marketplace & Finance Routes
const financeEnquiryRoutes = require("./src/routes/financeEnquiryRoutes");
const vehicleListingRoutes = require("./src/routes/vehicleListingRoutes");

// Staff Routes
const staffAuthRoutes = require("./src/routes/staffAuthRoutes");
const staffDashboardRoutes = require("./src/routes/staffDashboardRoutes");
const staffDriverRoutes = require("./src/routes/staffDriverRoutes");
const staffLoadRoutes = require("./src/routes/staffLoadRoutes");
const staffVehicleRoutes = require("./src/routes/staffVehicleRoutes");
const staffFinanceRoutes = require("./src/routes/staffFinanceRoutes");
const staffDispatchRoutes = require("./src/routes/staffDispatchRoutes");

// =========================================
// EXPRESS APP
// =========================================

const app = express();

app.disable("x-powered-by");

// =========================================
// GLOBAL MIDDLEWARE
// =========================================

// Configure allowed frontend origins through CORS_ORIGINS.
// Multiple origins can be separated by commas.

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGINS) {
  console.warn(
    "WARNING: Set CORS_ORIGINS to your production frontend origin."
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g. server-to-server).
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS.");
      error.status = 403;

      return callback(error);
    },
  })
);

app.use(express.json({ limit: "10kb" }));

// =========================================
// ROOT ROUTE
// =========================================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "RaahSetu backend is running!",
  });
});

// =========================================
// CUSTOMER ROUTES
// =========================================

app.use("/api/public", publicRoutes);

app.use("/api/auth", authRoutes);

// Specific routes first
app.use("/api/customer/dashboard", dashboardRoutes);

app.use("/api/customer/bookings", bookingRoutes);

// General customer routes after specific routes
app.use("/api/customer", customerRoutes);

// =========================================
// DRIVER ROUTES
// =========================================

app.use("/api/driver/auth", driverAuthRoutes);

app.use("/api/driver", driverRoutes);

// =========================================
// MARKETPLACE & FINANCE ROUTES
// =========================================

app.use("/api/finance-enquiries", financeEnquiryRoutes);

app.use("/api/vehicle-listings", vehicleListingRoutes);

// =========================================
// STAFF AUTHENTICATION
// =========================================

app.use("/api/staff/auth", staffAuthRoutes);

// =========================================
// STAFF DASHBOARD
// =========================================

app.use("/api/staff/dashboard", staffDashboardRoutes);

// =========================================
// STAFF DRIVER VERIFICATION
// =========================================

app.use("/api/staff/drivers", staffDriverRoutes);

// =========================================
// STAFF LOAD VERIFICATION
// =========================================

app.use("/api/staff/loads", staffLoadRoutes);

// =========================================
// STAFF VEHICLE MANAGEMENT
// =========================================

app.use("/api/staff/vehicles", staffVehicleRoutes);

// =========================================
// STAFF FINANCE & INSURANCE
// =========================================

app.use("/api/staff/finance-enquiries", staffFinanceRoutes);

// =========================================
// STAFF DISPATCH MANAGEMENT
// =========================================

app.use("/api/staff/dispatch", staffDispatchRoutes);

// =========================================
// STATIC FILE SERVING
// =========================================

// Vehicle listing photos are publicly accessible.
// Driver documents and profile photos remain protected
// through authenticated API endpoints.

app.use(
  "/uploads/vehicle-photos",
  express.static(
    path.join(process.cwd(), "uploads", "vehicle-photos"),
    {
      dotfiles: "deny",
      index: false,
      maxAge: "1d",
    }
  )
);

// =========================================
// UNKNOWN ROUTE HANDLER
// =========================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// =========================================
// CENTRAL ERROR HANDLER
// =========================================

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  if (res.headersSent) {
    return next(err);
  }

  let statusCode = Number(err.status || err.statusCode) || 500;

  // Handle common upload errors.
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
  } else if (
    err.code === "LIMIT_FILE_COUNT" ||
    err.code === "LIMIT_UNEXPECTED_FILE" ||
    err.code === "LIMIT_FIELD_COUNT"
  ) {
    statusCode = 400;
  }

  // Invalid JSON request.
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
  }

  if (statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 403
        ? "Request origin is not allowed."
        : statusCode === 413
          ? "Uploaded file or request is too large."
          : statusCode === 400
            ? "Invalid request data."
            : "Internal server error.",
  });
});

// =========================================
// SERVER START
// =========================================

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`RaahSetu server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server startup error:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
