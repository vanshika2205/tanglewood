import { connectDB } from "@/lib/mongodb";
import { Video } from "@/lib/models";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search   = searchParams.get("search");
    const page     = parseInt(searchParams.get("page")||"1");
    const limit    = parseInt(searchParams.get("limit")||"12");

    const filter = { status:"approved" };
    if (category && category!=="All") filter.category = category;
    if (search) filter.$or = [
      { title:{ $regex:search, $options:"i" } },
      { description:{ $regex:search, $options:"i" } },
    ];

    const [videos, total] = await Promise.all([
      Video.find(filter).sort({ publishedAt:-1 }).skip((page-1)*limit).limit(limit).lean(),
      Video.countDocuments(filter),
    ]);
    return Response.json({ videos, total, page, totalPages: Math.ceil(total/limit) });
  } catch(e) {
    return Response.json({ error:"Failed" }, { status:500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, description, tags, category, source, uploaderName, fileUrl } = body;
    if (!title) return Response.json({ error:"Title required" }, { status:400 });

    const video = await Video.create({
      title, description:description||"",
      tags: Array.isArray(tags)?tags:(tags||"").split(",").map(t=>t.trim()).filter(Boolean),
      category: category||"General",
      source: source||"web_upload",
      uploaderName: uploaderName||"Anonymous",
      fileUrl: fileUrl||null,
      status: "pending",
    });

    // Trigger AI scan in background
    const base = process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000";
    fetch(`${base}/api/moderate`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ title, description, tags, category }),
    }).then(r=>r.json()).then(async result => {
      const nextStatus = result.verdict==="rejected"?"rejected": result.verdict==="flagged"?"flagged":"human_review";
      await Video.findByIdAndUpdate(video._id, { status:nextStatus, ai:{ verdict:result.verdict, confidence:result.confidence, scores:result.scores, reasons:result.reasons||[], suggestion:result.suggestion, checkedAt:new Date() } });
    }).catch(console.error);

    return Response.json({ success:true, videoId:video._id, status:"pending" }, { status:201 });
  } catch(e) {
    return Response.json({ error:"Failed" }, { status:500 });
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const { videoId, action, note } = await req.json();
    const update = action==="approve"
      ? { status:"approved", publishedAt:new Date(), "human.verdict":"approved", "human.note":note||"", "human.checkedAt":new Date() }
      : { status:"rejected", "human.verdict":"rejected", "human.note":note||"", "human.checkedAt":new Date() };
    const video = await Video.findByIdAndUpdate(videoId, update, { new:true });
    return Response.json({ success:true, video });
  } catch(e) {
    return Response.json({ error:"Failed" }, { status:500 });
  }
}
