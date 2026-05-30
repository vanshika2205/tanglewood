import { connectDB } from "@/lib/mongodb";
import { Video } from "@/lib/models";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { videoId, action, text, commentId, replyId } = body;

    if (!videoId) return Response.json({ error: "Video ID required" }, { status: 400 });
    const video = await Video.findById(videoId);
    if (!video) return Response.json({ error: "Video not found" }, { status: 404 });

    const newCommentObj = {
      _id: new mongoose.Types.ObjectId(),
      user: token.id,
      userName: token.name,
      text: text,
      likes: 0,
      isEdited: false,
      createdAt: new Date(),
      replies: []
    };

    if (action === "add_comment") {
      video.comments.push(newCommentObj);
      await video.save();
      return Response.json({ success: true, comment: newCommentObj });
    }

    if (action === "add_reply") {
      const commentIndex = video.comments.findIndex(c => c._id.toString() === commentId);
      if (commentIndex === -1) return Response.json({ error: "Comment not found" }, { status: 404 });
      
      const newReply = { ...newCommentObj };
      delete newReply.replies; // Replies don't have nested replies
      
      video.comments[commentIndex].replies.push(newReply);
      await video.save();
      return Response.json({ success: true, reply: newReply });
    }

    if (action === "edit_comment") {
      const commentIndex = video.comments.findIndex(c => c._id.toString() === commentId);
      if (commentIndex === -1) return Response.json({ error: "Comment not found" }, { status: 404 });
      
      // Ensure the user owns the comment
      if (video.comments[commentIndex].user.toString() !== token.id && token.role !== "admin") {
        return Response.json({ error: "Unauthorized operation" }, { status: 403 });
      }

      video.comments[commentIndex].text = text;
      video.comments[commentIndex].isEdited = true;
      await video.save();
      return Response.json({ success: true, comment: video.comments[commentIndex] });
    }

    if (action === "edit_reply") {
      const commentIndex = video.comments.findIndex(c => c._id.toString() === commentId);
      if (commentIndex === -1) return Response.json({ error: "Comment not found" }, { status: 404 });
      
      const replyIndex = video.comments[commentIndex].replies.findIndex(r => r._id.toString() === replyId);
      if (replyIndex === -1) return Response.json({ error: "Reply not found" }, { status: 404 });

      // Ensure the user owns the reply
      if (video.comments[commentIndex].replies[replyIndex].user.toString() !== token.id && token.role !== "admin") {
        return Response.json({ error: "Unauthorized operation" }, { status: 403 });
      }

      video.comments[commentIndex].replies[replyIndex].text = text;
      video.comments[commentIndex].replies[replyIndex].isEdited = true;
      await video.save();
      return Response.json({ success: true, reply: video.comments[commentIndex].replies[replyIndex] });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Comment API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const commentId = searchParams.get("commentId");
    const replyId = searchParams.get("replyId");

    const video = await Video.findById(videoId);
    if (!video) return Response.json({ error: "Video not found" }, { status: 404 });

    if (replyId) {
      // Delete reply
      const commentIndex = video.comments.findIndex(c => c._id.toString() === commentId);
      if (commentIndex !== -1) {
        const replyIndex = video.comments[commentIndex].replies.findIndex(r => r._id.toString() === replyId);
        if (replyIndex !== -1) {
          if (video.comments[commentIndex].replies[replyIndex].user.toString() !== token.id && token.role !== "admin" && token.role !== "moderator") {
             return Response.json({ error: "Unauthorized" }, { status: 403 });
          }
          video.comments[commentIndex].replies.splice(replyIndex, 1);
          await video.save();
        }
      }
    } else if (commentId) {
      // Delete comment
      const commentIndex = video.comments.findIndex(c => c._id.toString() === commentId);
      if (commentIndex !== -1) {
        if (video.comments[commentIndex].user.toString() !== token.id && token.role !== "admin" && token.role !== "moderator") {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
        }
        video.comments.splice(commentIndex, 1);
        await video.save();
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete Comment error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
