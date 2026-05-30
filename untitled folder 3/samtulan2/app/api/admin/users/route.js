import { connectDB } from "@/lib/mongodb";
import { User, Video } from "@/lib/models";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token.role !== "admin" && token.role !== "moderator")) return Response.json({ error: "Forbidden" }, { status: 403 });

    const users = await User.find({}).sort({ createdAt: -1 }).select("-password").lean();
    return Response.json({ users });
  } catch(e) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") return Response.json({ error: "Only admins can delete users" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if(!id) return Response.json({ error: "Missing ID" }, { status: 400 });

    await User.findByIdAndDelete(id);
    await Video.deleteMany({ uploader: id }); // Wipe all their content

    return Response.json({ success: true });
  } catch(e) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") return Response.json({ error: "Only admins can change roles" }, { status: 403 });

    const { userId, role } = await req.json();
    if (!userId || !role) return Response.json({ error: "Missing fields" }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    if (user.role === "admin") return Response.json({ error: "Cannot change admin role" }, { status: 403 });

    user.role = role;
    await user.save();
    return Response.json({ success: true, user });
  } catch(e) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
