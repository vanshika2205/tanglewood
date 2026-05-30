import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { getToken } from "next-auth/jwt";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const user = await User.findById(token.id).lean();
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({
      name: user.name,
      email: user.email,
      bio: user.bio || "",
      followers: user.subscribers || 0,
      following: (user.subscribedTo || []).length,
      likedVideos: user.likedVideos || [],
      dislikedVideos: user.dislikedVideos || [],
      savedVideos: user.savedVideos || [],
      subscribedTo: user.subscribedTo || [],
      hasChannel: user.hasChannel || false,
      channelName: user.channelName || "",
      channelBio: user.channelBio || "",
    });
  } catch (error) {
    console.error("GET User Me error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { name, bio } = await req.json();
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;

    const user = await User.findByIdAndUpdate(token.id, updates, { new: true });
    return Response.json({ success: true, user: { name: user.name, bio: user.bio } });
  } catch (error) {
    console.error("PATCH User error:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

