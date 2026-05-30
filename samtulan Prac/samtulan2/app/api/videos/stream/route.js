import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fileParam = searchParams.get("file"); 
    
    if (!fileParam) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Sanitize path
    const rawFilename = fileParam.split('/').pop() || "";
    const filename = rawFilename.replace(/(\.\.)/g, ""); 

    const possiblePaths = [
      join(process.cwd(), "public", "uploads", filename),
      join(process.cwd(), "public", filename),
      join(process.cwd(), "public", fileParam.startsWith('/') ? fileParam.slice(1) : fileParam)
    ];

    let filePath = null;
    let fileStats = null;

    for (const p of possiblePaths) {
      const stats = await stat(p).catch(() => null);
      if (stats && stats.isFile()) {
        filePath = p;
        fileStats = stats;
        break;
      }
    }

    if (!fileStats) {
      return NextResponse.json({ error: "Video file missing on server" }, { status: 404 });
    }

    const { size } = fileStats;
    const range = req.headers.get("range");

    // Dynamic MIME detection
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeMap = {
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mkv: "video/x-matroska"
    };
    const contentType = mimeMap[ext] || "video/mp4";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;

      // Validate range
      if (isNaN(start) || start >= size || end >= size || start > end) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` }
        });
      }

      const chunksize = (end - start) + 1;
      const nodeStream = createReadStream(filePath, { start, end });
      
      const stream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => controller.enqueue(new Uint8Array(chunk)));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        }
      });

      return new Response(stream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } else {
      const nodeStream = createReadStream(filePath);
      const stream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => controller.enqueue(new Uint8Array(chunk)));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        }
      });

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Length": size.toString(),
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600"
        },
      });
    }
  } catch (error) {
    console.error("[STREAMING] Error:", error);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}
