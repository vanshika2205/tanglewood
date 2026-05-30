import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";

export async function POST(req) {
  try {
    const { name, email, password, role, website } = await req.json();

    // 1. HONEYPOT CHECK (Bot Protection)
    if (website) {
      console.warn("Bot detected via honeymoon field!");
      return Response.json({ error: "System error: 0x882" }, { status: 400 }); 
    }

    // 2. INPUT VALIDATION (Manual Integrity Check)
    const cleanName = name?.trim();
    const cleanEmail = email?.toLowerCase()?.trim();

    if (!cleanName || cleanName.length < 2) 
      return Response.json({ error: "Naam bahut chhota hai" }, { status: 400 });
    
    if (!cleanEmail || !cleanEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      return Response.json({ error: "Sahi email address daalein" }, { status: 400 });

    if (!password || password.length < 6)
      return Response.json({ error: "Password kam se kam 6 characters ka hona chahiye" }, { status: 400 });

    if (password.length > 100)
      return Response.json({ error: "Password bahut bada hai" }, { status: 400 });

    if (role && role !== "creator") {
      // Allow only CK to be admin if they request it, otherwise block.
      const isCK = email.toLowerCase().includes("ck");
      if (!isCK) {
        return Response.json({ error: "Moderator or Admin accounts must be pre-approved in DB. Request denied." }, { status: 403 });
      }
    }

    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return Response.json({ error: "Yeh email already registered hai" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    const isCKadmin = email.toLowerCase() === "ck@samtulan.com" || email.toLowerCase().startsWith("ck@");
    const assignedRole = isCKadmin ? "admin" : "creator";
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashed, role: assignedRole });

    return Response.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Registration fail ho gayi" }, { status: 500 });
  }
}
