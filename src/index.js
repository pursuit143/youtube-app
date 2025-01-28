import dotenv from "dotenv";
import connectDB from "./db/index.js";

// Load environment variables

dotenv.config({
  path: "./env"
});

const PORT = process.env.PORT || 5000;

// Define Express app
// Connect to MongoDB

connectDB();
