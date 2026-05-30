import { connectDB } from "@/lib/mongodb";
import { User, Video } from "@/lib/models";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route"; // Ensure correct import if needed, or use generic
import { getToken } from "next-auth/jwt"; // Using jwt token directly since it's easier

export async function POST(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    const body = await req.json();
    const { videoId, action } = body;
    
    if (!videoId || !action) return Response.json({ error: "Missing fields" }, { status: 400 });

    if (action === "view") {
      // Allow views without login, but prevent spam by requiring user action (basic)
      const video = await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }, { new: true });
      return Response.json({ success: true, views: video.views });
    }

    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const userId = token.id;

    if (action === "like") {
      const user = await User.findById(userId);
      const isLiked = user.likedVideos.includes(videoId);
      const isDisliked = user.dislikedVideos?.includes(videoId);

      let likesInc = 0;
      if (isLiked) {
        await User.findByIdAndUpdate(userId, { $pull: { likedVideos: videoId } });
        likesInc = -1;
      } else {
        const updateDoc = { $addToSet: { likedVideos: videoId } };
        if (isDisliked) updateDoc.$pull = { dislikedVideos: videoId };
        await User.findByIdAndUpdate(userId, updateDoc);
        likesInc = 1;
      }
      const video = await Video.findByIdAndUpdate(videoId, { $inc: { likes: likesInc } }, { new: true });
      return Response.json({ success: true, liked: !isLiked, likes: video.likes });
    }

    if (action === "dislike") {
      const user = await User.findById(userId);
      const isLiked = user.likedVideos.includes(videoId);
      const isDisliked = user.dislikedVideos?.includes(videoId);

      let likesInc = 0;
      if (isDisliked) {
        await User.findByIdAndUpdate(userId, { $pull: { dislikedVideos: videoId } });
      } else {
        const updateDoc = { $addToSet: { dislikedVideos: videoId } };
        if (isLiked) {
          updateDoc.$pull = { likedVideos: videoId };
          likesInc = -1;
        }
        await User.findByIdAndUpdate(userId, updateDoc);
      }
      
      const video = await Video.findByIdAndUpdate(videoId, { $inc: { likes: likesInc } }, { new: true });
      return Response.json({ success: true, disliked: !isDisliked, likes: video.likes });
    }

    if (action === "save") {
      const user = await User.findById(userId);
      const isSaved = user.savedVideos.includes(videoId);

      if (isSaved) {
        await User.findByIdAndUpdate(userId, { $pull: { savedVideos: videoId } });
        return Response.json({ success: true, saved: false });
      } else {
        await User.findByIdAndUpdate(userId, { $addToSet: { savedVideos: videoId } });
        return Response.json({ success: true, saved: true });
      }
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
