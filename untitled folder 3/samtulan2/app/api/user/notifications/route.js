import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/lib/models/Notification";
import { getToken } from "next-auth/jwt";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await Notification.find({ user: token.id }).sort({ createdAt: -1 }).limit(20).lean();
    return Response.json({ notifications });
  } catch (error) {
    console.error("GET Notifications error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
