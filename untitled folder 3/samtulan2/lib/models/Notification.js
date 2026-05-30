import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:   { type: String, required: true },
  desc:    { type: String, required: true },
  type:    { type: String, enum: ["success","warning","danger","info"], default: "info" },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

export const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
