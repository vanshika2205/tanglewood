import { connectDB } from "@/lib/mongodb";
import { Report } from "@/lib/models";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token.role !== "admin" && token.role !== "moderator")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sort = { createdAt: -1 };
    
    const reports = await Report.find({})
      .sort(sort)
      .populate("videoId", "title uploaderName category") // Get Video Info
      .populate("reporterId", "name email") // Get Reporter Info
      .lean();

    return Response.json({ success: true, reports });
  } catch (error) {
    console.error("GET Reports error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token.role !== "admin" && token.role !== "moderator")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId, status } = await req.json();
    if (!reportId || !status) return Response.json({ error: "Missing fields" }, { status: 400 });

    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    return Response.json({ success: true, report });

  } catch (error) {
    console.error("PATCH Report error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
