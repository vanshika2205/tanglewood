import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });

    const user = await User.findById(id).select("-password -email -role -savedVideos -likedVideos -subscribedTo").lean();
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({ user });
  } catch (error) {
    console.error("GET User Profile error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { getToken } from "next-auth/jwt";

export async function PATCH(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const allowedUpdates = {};
    if (body.name !== undefined) allowedUpdates.name = body.name.trim();
    if (body.bio !== undefined) allowedUpdates.bio = body.bio.trim();
    if (body.avatar !== undefined) allowedUpdates.avatar = body.avatar.trim();
    if (body.channelName !== undefined) allowedUpdates.channelName = body.channelName.trim();
    if (body.channelBio !== undefined) allowedUpdates.channelBio = body.channelBio.trim();

    const updated = await User.findByIdAndUpdate(token.id, { $set: allowedUpdates }, { new: true }).select("-password");
    
    // Sync to videos if channelName was updated
    if (allowedUpdates.channelName) {
      const { Video } = await import("@/lib/models");
      await Video.updateMany(
        { uploader: token.id },
        { $set: { uploaderName: allowedUpdates.channelName } }
      );
    }

    return Response.json({ success: true, user: updated });
  } catch (error) {
    console.error("PATCH User Profile error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
