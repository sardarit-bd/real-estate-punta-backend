// app/config/db.js
import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    await mongoose.connect(process.env.DB_URL);

    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("DB connection error:", error);
    throw error;
  }
};
