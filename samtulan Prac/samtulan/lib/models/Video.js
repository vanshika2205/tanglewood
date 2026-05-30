import mongoose from "mongoose";
const VideoSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String, default: "" },
  tags:         [String],
  category:     { type: String, default: "General" },
  duration:     String,
  fileUrl:      String,
  thumbnailUrl: String,
  source:       { type: String, default: "web_upload" },
  status:       { type: String, enum: ["pending","ai_scanning","human_review","flagged","approved","rejected","draft"], default: "pending" },
  ai: {
    verdict: String, confidence: Number,
    scores: { violence:{type:Number,default:0}, adult_content:{type:Number,default:0}, hate_speech:{type:Number,default:0}, drugs:{type:Number,default:0}, dangerous:{type:Number,default:0}, misleading:{type:Number,default:0}, profanity:{type:Number,default:0}, copyright:{type:Number,default:0} },
    reasons: [String], suggestion: String, checkedAt: Date,
  },
  human: { verdict: String, note: String, checkedAt: Date },
  views:    { type: Number, default: 0 },
  likes:    { type: Number, default: 0 },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploaderName: String,
  publishedAt: Date,
}, { timestamps: true });
VideoSchema.index({ status:1, publishedAt:-1 });
VideoSchema.index({ category:1, status:1 });
export const Video = mongoose.models.Video || mongoose.model("Video", VideoSchema);
