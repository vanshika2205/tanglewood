import { connectDB } from "@/lib/mongodb";

// This endpoint is called on app load to pre-warm the MongoDB connection pool.
// First request after server cold-start is slow (3-8s), warmup fixes this.
export async function GET() {
  try {
    await connectDB();
    return Response.json({ ok: true }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
