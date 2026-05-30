import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true,
    enum: [
      "DELETE_USER", "CHANGE_ROLE", "APPROVE_VIDEO", 
      "REJECT_VIDEO", "FLAG_VIDEO", "RESCAN_VIDEO", 
      "DELETE_VIDEO", "SECURITY_ALERT"
    ]
  },
  actor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  actorEmail: String,
  targetId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  targetType: { 
    type: String, 
    enum: ["Video", "User", "Report", "System"] 
  },
  details: { 
    type: mongoose.Schema.Types.Mixed,
    default: {} 
  },
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ actor: 1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
