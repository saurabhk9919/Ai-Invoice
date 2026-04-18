const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is not set in environment variables.");
    }

    await mongoose.connect(mongoUri, {
      dbName: "invoice-ai",
    });
    console.log(`MongoDB Connected (${mongoose.connection.name})`);
  } catch (error) {
    console.error("DB Connection Failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;