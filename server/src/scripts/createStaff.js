
require("dotenv").config();

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
  try {
    const name = (await ask("Staff name: ")).trim();
    const email = (await ask("Staff Gmail: ")).trim().toLowerCase();
    const password = await ask("Staff password: ");

    if (!name || !email || !password) {
      throw new Error("All fields are required.");
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailRegex.test(email) || email.includes("..")) {
      throw new Error(
        "Invalid email! Please enter a valid Gmail address ending with @gmail.com."
      );
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    await connectDB();

    const existingStaff = await Staff.findOne({ email });

    if (existingStaff) {
      throw new Error("A staff account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const staff = await Staff.create({
      name,
      email,
      passwordHash,
    });

    console.log("\nStaff account created successfully!");
    console.log("Staff ID:", staff._id);
    console.log("Staff email:", staff.email);
  } catch (error) {
    console.error("\nStaff creation failed:", error.message);
  } finally {
    rl.close();
    process.exit();
  }
}

createStaff();
