import { stat, open } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fileParam = searchParams.get("file"); // e.g. /uploads/filename.mp4
    
    if (!fileParam) {
      return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
    }

    // Strictly resolve the file from public/uploads to avoid path traversal
    const filename = fileParam.split('/').pop();
    const filePath = join(process.cwd(), "public", "uploads", filename);

    const fileStats = await stat(filePath).catch(() => null);
    if (!fileStats) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { size } = fileStats;
    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
      const chunksize = (end - start) + 1;

      const fileHandle = await open(filePath, 'r');
      const stream = fileHandle.readableWebStream({ start, end: end + 1 });

      const headers = new Headers();
      headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
      headers.set("Accept-Ranges", "bytes");
      headers.set("Content-Length", chunksize.toString());
      headers.set("Content-Type", "video/mp4");

      return new Response(stream, {
        status: 206,
        headers,
      });
    } else {
      const headers = new Headers();
      headers.set("Content-Length", size.toString());
      headers.set("Content-Type", "video/mp4");
      
      const fileHandle = await open(filePath, 'r');
      const stream = fileHandle.readableWebStream();

      return new Response(stream, {
        status: 200,
        headers,
      });
    }
  } catch (error) {
    console.error("Stream error:", error);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}
