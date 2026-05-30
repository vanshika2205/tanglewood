import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { creatorId } = body;
    if (!creatorId) return Response.json({ error: "Missing creator ID" }, { status: 400 });

    const userId = token.id;

    if (userId === creatorId) {
      return Response.json({ error: "You cannot subscribe to yourself" }, { status: 400 });
    }

    const currUser = await User.findById(userId);
    const creator = await User.findById(creatorId);

    if (!currUser || !creator) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const isSubscribed = currUser.subscribedTo.includes(creatorId);

    if (isSubscribed) {
      // Unsubscribe
      await User.findByIdAndUpdate(userId, { $pull: { subscribedTo: creatorId } });
      await User.findByIdAndUpdate(creatorId, { $inc: { subscribers: -1 } });
      return Response.json({ success: true, subscribed: false });
    } else {
      // Subscribe
      await User.findByIdAndUpdate(userId, { $addToSet: { subscribedTo: creatorId } });
      await User.findByIdAndUpdate(creatorId, { $inc: { subscribers: 1 } });
      return Response.json({ success: true, subscribed: true });
    }
  } catch (error) {
    console.error("Subscribe API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
