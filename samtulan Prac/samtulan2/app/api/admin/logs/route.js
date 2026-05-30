import { connectDB } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userRole = token?.role?.toLowerCase();

    if (!token || (userRole !== "admin" && userRole !== "moderator")) {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return Response.json({ logs });
  } catch (error) {
    console.error("Fetch Logs Error:", error);
    return Response.json({ error: "Logs fetch nahi hue" }, { status: 500 });
  }
}
