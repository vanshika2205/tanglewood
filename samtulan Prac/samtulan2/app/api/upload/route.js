import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized: Please log in to upload" }, { status: 401 });

    const data = await req.formData();
    const file = data.get("file");
    const thumbnail = data.get("thumbnail");

    if (!file || typeof file === "string") {
      return Response.json({ error: "Missing video file" }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Save video
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
    await writeFile(join(uploadDir, filename), buffer);

    // Save thumbnail optionally
    let thumbFilename = null;
    if (thumbnail && typeof thumbnail !== "string") {
      const thumbBytes = await thumbnail.arrayBuffer();
      const thumbBuffer = Buffer.from(thumbBytes);
      thumbFilename = `thumb_${Date.now()}_${thumbnail.name.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
      await writeFile(join(uploadDir, thumbFilename), thumbBuffer);
    }

    return Response.json({ 
      success: true, 
      fileUrl: `/uploads/${filename}`, 
      thumbnailUrl: thumbFilename ? `/uploads/${thumbFilename}` : null
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
