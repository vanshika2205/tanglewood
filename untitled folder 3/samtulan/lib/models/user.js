import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hashed
    role:     { type: String, enum: ["creator", "moderator", "admin"], default: "creator" },
    avatar:   { type: String, default: null },
    bio:      { type: String, default: "" },
    subscribers: { type: Number, default: 0 },
    isVerified:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);