import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true },
  details: { type: String, default: "" },
  status: { type: String, enum: ["pending", "resolved", "dismissed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

export const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);
