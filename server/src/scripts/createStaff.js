
require("dotenv").config();

const mongoose = require("mongoose");
const readline = require("readline");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const Staff = require("../models/Staff");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createStaff() {
  let exitCode = 0;

  try {
    console.log("\n========== RaahSetu Staff Account Setup ==========\n");

    const name = (await ask("Staff name: ")).trim();
    const email = (await ask("Staff Gmail: ")).trim().toLowerCase();
    const password = await ask("Staff password: ");

    // Validate required fields
    if (!name || !email || !password) {
      throw new Error("All fields are required.");
    }

    if (name.length > 100) {
      throw new Error("Staff name cannot exceed 100 characters.");
    }

    // Validate Gmail address
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailRegex.test(email) || email.includes("..")) {
      throw new Error(
        "Invalid email! Please enter a valid Gmail address ending with @gmail.com."
      );
    }

    // Validate password
    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    // Connect to MongoDB
    await connectDB();

    // Check existing staff account
    const existingStaff = await Staff.findOne({ email });

    if (existingStaff) {
      throw new Error(
        "A staff account with this email already exists."
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create staff account
    const staff = await Staff.create({
      name,
      email,
      passwordHash,
      isActive: true,
    });

    console.log("\n==============================================");
    console.log("Staff account created successfully!");
    console.log("==============================================");
    console.log("Staff ID:", staff._id.toString());
    console.log("Staff Name:", staff.name);
    console.log("Staff Email:", staff.email);
    console.log("Account Status: Active");
    console.log("==============================================\n");

  } catch (error) {
    exitCode = 1;
    console.error("\nStaff creation failed:", error.message);

  } finally {
    rl.close();

    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch (disconnectError) {
      exitCode = 1;
      console.error(
        "MongoDB disconnect error:",
        disconnectError.message
      );
    }

    process.exitCode = exitCode;
  }
}

createStaff();
