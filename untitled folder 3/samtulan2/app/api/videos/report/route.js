import { connectDB } from "@/lib/mongodb";
import { Report, Video } from "@/lib/models";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { videoId, reason, details } = await req.json();
    if (!videoId || !reason) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if valid video
    const video = await Video.findById(videoId).lean();
    if (!video) return Response.json({ error: "Video not found" }, { status: 404 });

    // Ensure user hasn't already reported this video recently (prevent spam)
    const existing = await Report.findOne({ videoId, reporterId: token.id });
    if (existing) {
      return Response.json({ error: "You have already reported this video" }, { status: 400 });
    }

    await Report.create({
      videoId,
      reporterId: token.id,
      reason,
      details: details || "",
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Report POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
