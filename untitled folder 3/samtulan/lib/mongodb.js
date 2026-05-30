import mongoose from "mongoose";
const URI = process.env.MONGODB_URI;
if (!URI) throw new Error("MONGODB_URI not set");
let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });
export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(URI, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}
