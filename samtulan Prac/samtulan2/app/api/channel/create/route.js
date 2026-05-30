import { connectDB } from "@/lib/mongodb";
import { User, Video } from "@/lib/models";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { channelName, channelBio } = await req.json();
    if (!channelName || channelName.trim().length === 0) {
      return Response.json({ error: "Channel Name is required" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      token.id,
      { $set: { hasChannel: true, channelName: channelName.trim(), channelBio: channelBio?.trim() || "" } },
      { new: true }
    ).select("-password -email");

    // Sync old videos uploaderName
    await Video.updateMany(
      { uploader: token.id },
      { $set: { uploaderName: channelName.trim() } }
    );

    return Response.json({ success: true, user: updated });
  } catch (error) {
    console.error("POST Create Channel error:", error);
    return Response.json({ error: "Failed to create channel" }, { status: 500 });
  }
}
