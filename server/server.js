require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const publicRoutes = require("./src/routes/publicRoutes");
const authRoutes = require("./src/routes/authRoutes");
const customerRoutes = require("./src/routes/customerRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("RaahSetu backend is running!");
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);

connectDB();

app.listen(process.env.PORT || 5001);