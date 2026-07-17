const mongoose = require("mongoose");
const env = require("../config/env");

async function connectDb() {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required. Set it in backend/.env");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected");
}

module.exports = { connectDb };
