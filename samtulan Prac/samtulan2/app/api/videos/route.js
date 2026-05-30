// import { connectDB } from "@/lib/mongodb";
// import { Video } from "@/lib/models";

// export async function GET(req) {
//   try {
//     await connectDB();
//     const { searchParams } = new URL(req.url);
//     const category = searchParams.get("category");
//     const search   = searchParams.get("search");
//     const page     = parseInt(searchParams.get("page")||"1");
//     const limit    = parseInt(searchParams.get("limit")||"12");

//     const filter = { status:"approved" };
//     if (category && category!=="All") filter.category = category;
//     if (search) filter.$or = [
//       { title:{ $regex:search, $options:"i" } },
//       { description:{ $regex:search, $options:"i" } },
//     ];

//     const [videos, total] = await Promise.all([
//       Video.find(filter).sort({ publishedAt:-1 }).skip((page-1)*limit).limit(limit).lean(),
//       Video.countDocuments(filter),
//     ]);
//     return Response.json({ videos, total, page, totalPages: Math.ceil(total/limit) });
//   } catch(e) {
//     return Response.json({ error:"Failed" }, { status:500 });
//   }
// }

// export async function POST(req) {
//   try {
//     await connectDB();
//     const body = await req.json();
//     const { title, description, tags, category, source, uploaderName, fileUrl } = body;
//     if (!title) return Response.json({ error:"Title required" }, { status:400 });

//     const video = await Video.create({
//       title, description:description||"",
//       tags: Array.isArray(tags)?tags:(tags||"").split(",").map(t=>t.trim()).filter(Boolean),
//       category: category||"General",
//       source: source||"web_upload",
//       uploaderName: uploaderName||"Anonymous",
//       fileUrl: fileUrl||null,
//       status: "pending",
//     });

//     // Trigger AI scan in background
//     const base = process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000";
//     fetch(`${base}/api/moderate`, {
//       method:"POST", headers:{"Content-Type":"application/json"},
//       body: JSON.stringify({ title, description, tags, category }),
//     }).then(r=>r.json()).then(async result => {
//       const nextStatus = result.verdict==="rejected"?"rejected": result.verdict==="flagged"?"flagged":"human_review";
//       await Video.findByIdAndUpdate(video._id, { status:nextStatus, ai:{ verdict:result.verdict, confidence:result.confidence, scores:result.scores, reasons:result.reasons||[], suggestion:result.suggestion, checkedAt:new Date() } });
//     }).catch(console.error);

//     return Response.json({ success:true, videoId:video._id, status:"pending" }, { status:201 });
//   } catch(e) {
//     return Response.json({ error:"Failed" }, { status:500 });
//   }
// }

// export async function PATCH(req) {
//   try {
//     await connectDB();
//     const { videoId, action, note } = await req.json();
//     const update = action==="approve"
//       ? { status:"approved", publishedAt:new Date(), "human.verdict":"approved", "human.note":note||"", "human.checkedAt":new Date() }
//       : { status:"rejected", "human.verdict":"rejected", "human.note":note||"", "human.checkedAt":new Date() };
//     const video = await Video.findByIdAndUpdate(videoId, update, { new:true });
//     return Response.json({ success:true, video });
//   } catch(e) {
//     return Response.json({ error:"Failed" }, { status:500 });
//   }
// }


// app/api/videos/route.js
import { connectDB } from "@/lib/mongodb";
import { Video, AuditLog } from "@/lib/models";
import { getToken } from "next-auth/jwt";

// Only force-dynamic for user-specific feeds; public feed uses smart cache
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category   = searchParams.get("category");
    const search     = searchParams.get("search");
    const page       = parseInt(searchParams.get("page")  || "1");
    const limit      = parseInt(searchParams.get("limit") || "12");
    const all        = searchParams.get("all");
    const id         = searchParams.get("id");
    const mine       = searchParams.get("mine");
    const uploaderId = searchParams.get("uploaderId");
    const feed       = searchParams.get("feed");

    // Public request = can be cached. Private = no cache
    const isPublicRequest = !mine && !feed && !all;
    const cacheHeaders = isPublicRequest
      ? { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
      : { "Cache-Control": "no-store" };

    if (id) {
      const video = await Video.findById(id)
        .populate("uploader", "channelName name avatar subscribers isVerified")
        .lean();
      
      if (!video) return Response.json({ error: "Video missing" }, { status: 404 });

      if (video.uploader) {
        video.uploaderName = video.uploader.channelName || video.uploader.name;
        video.uploaderAvatar = video.uploader.avatar || null;
        video.verified = video.uploader.isVerified || false;
      }

      // Fetch related videos (by category, excluding itself)
      const related = await Video.find({ 
        category: video.category, 
        _id: { $ne: id }, 
        status: "approved" 
      }).limit(10).lean();

      return Response.json(
        { video, related, success: true },
        { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15" } }
      );
    }

    const filter = {};
    if (!all && !mine) filter.status = "approved";
    if (uploaderId) filter.uploader = uploaderId;
    
    if (mine) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
      filter.uploader = token.id;
    }

    if (feed) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
      const { User } = require("@/lib/models");
      const currentUser = await User.findById(token.id);
      
      if (feed === "saved") {
        filter._id = { $in: currentUser.savedVideos || [] };
      } else if (feed === "subscriptions") {
        filter.uploader = { $in: currentUser.subscribedTo || [] };
      } else if (feed === "liked") {
        filter._id = { $in: currentUser.likedVideos || [] };
      } else if (feed === "disliked") {
        filter._id = { $in: currentUser.dislikedVideos || [] };
      }
    }

    if (category && category !== "All") filter.category = category;
    
    let sortObj = { publishedAt:-1, createdAt:-1 };
    let projection = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
      sortObj = { createdAt: -1 };
    }

    let [videos, total] = await Promise.all([
      Video.find(filter, projection)
        .populate("uploader", "channelName name avatar subscribers isVerified")
        .sort(sortObj).skip((page-1)*limit).limit(limit).lean(),
      Video.countDocuments(filter),
    ]);

    videos = videos.map(v => {
      if (v.uploader) {
        v.uploaderName = v.uploader.channelName || v.uploader.name;
        v.uploaderAvatar = v.uploader.avatar || null;
        v.verified = v.uploader.isVerified || false;
      }
      return v;
    });

    return Response.json(
      { videos, total, page, totalPages: Math.ceil(total/limit) },
      { headers: cacheHeaders }
    );
  } catch(e) {
    console.error("GET /api/videos:", e);
    return Response.json({ error: "Videos fetch nahi hue" }, { status:500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { title, description, tags, category, source, uploaderName, fileUrl, thumbnailUrl } = await req.json();
    if (!title) return Response.json({ error:"Title required" }, { status:400 });

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const video = await Video.create({
      title, description: description||"",
      tags: Array.isArray(tags)?tags:(tags||"").split(",").map(t=>t.trim()).filter(Boolean),
      category: category||"General",
      source: source||"web_upload",
      uploader: token.id,
      uploaderName: uploaderName||"Anonymous",
      fileUrl: fileUrl||null,
      thumbnailUrl: thumbnailUrl||null,
      status: "pending",
    });

    // AI scan background mein (Without HTTP fetch to prevent port/deadlock issues)
    setTimeout(async () => {
      let result;
      try {
        const { POST: moderateFn } = require("@/app/api/moderate/route.js");
        const modReq = { json: async () => ({ title, description, tags, category }) };
        const res = await moderateFn(modReq);
        result = await res.json();
      } catch (err) {
        console.error("Local Mod Error:", err);
        result = { 
          verdict:"flagged", confidence:50, scores:{}, 
          reasons:["AI scan failed network/fetch"], 
          summary: "AI scanning system mein temporary issue hai, isliye ise manual review ke liye flag kiya gaya hai.",
          suggestion:null 
        };
      }
      
      const nextStatus = result.verdict==="rejected"?"rejected": result.verdict==="flagged"?"flagged":"human_review";
      await Video.findByIdAndUpdate(video._id, {
        status: nextStatus,
        ai: { verdict:result.verdict, confidence:result.confidence, scores:result.scores, reasons:result.reasons||[], summary:result.summary, violations:result.violations||[], suggestion:result.suggestion, checkedAt:new Date() },
      });
    }, 100);

    return Response.json({ success:true, videoId:video._id }, { status:201 });
  } catch(e) {
    return Response.json({ error:"Submit fail" }, { status:500 });
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userRole = token?.role?.toLowerCase();
    if (!token || (userRole !== "admin" && userRole !== "moderator")) {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { videoId, action, note } = await req.json();
    let update;
    let logAction = "";

    if (action === "approve") {
      update = { status:"approved", publishedAt:new Date(), "human.verdict":"approved", "human.note":note||"", "human.checkedAt":new Date() };
      logAction = "APPROVE_VIDEO";
    } else if (action === "reject") {
      update = { status:"rejected", "human.verdict":"rejected", "human.note":note||"", "human.checkedAt":new Date() };
      logAction = "REJECT_VIDEO";
    } else if (action === "flagged") {
      update = { status:"flagged", "human.verdict":"flagged", "human.note":note||"", "human.checkedAt":new Date() };
      logAction = "FLAG_VIDEO";
    } else if (action === "rescan") {
      const video = await Video.findById(videoId);
      if (!video) return Response.json({ error:"Video not found" }, { status:404 });
      
      const { POST: moderateFn } = require("@/app/api/moderate/route.js");
      const modReq = { json: async () => ({ title: video.title, description: video.description, tags: video.tags, category: video.category }) };
      const modRes = await moderateFn(modReq);
      const result = await modRes.json();
      
      const nextStatus = result.verdict==="rejected"?"rejected": result.verdict==="flagged"?"flagged":"human_review";
      const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        status: nextStatus,
        ai: { verdict:result.verdict, confidence:result.confidence, scores:result.scores, reasons:result.reasons||[], summary:result.summary, violations:result.violations||[], suggestion:result.suggestion, checkedAt:new Date() },
      }, { new: true });

      await AuditLog.create({
        action: "RESCAN_VIDEO",
        actor: token.id,
        actorEmail: token.email,
        targetId: videoId,
        targetType: "Video",
        details: { verdict: result.verdict }
      });

      return Response.json({ success:true, video: updatedVideo });
    } else {
      return Response.json({ error:"Unknown action" }, { status:400 });
    }

    const video = await Video.findByIdAndUpdate(videoId, update, { new:true });
    
    await AuditLog.create({
      action: logAction,
      actor: token.id,
      actorEmail: token.email,
      targetId: videoId,
      targetType: "Video",
      details: { note }
    });

    return Response.json({ success:true, video });
  } catch(e) {
    return Response.json({ error:"Update fail" }, { status:500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userRole = token?.role?.toLowerCase();
    if (!token || (userRole !== "admin" && userRole !== "moderator")) {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error:"Missing id" }, { status:400 });
    
    await Video.findByIdAndDelete(id);

    await AuditLog.create({
      action: "DELETE_VIDEO",
      actor: token.id,
      actorEmail: token.email,
      targetId: id,
      targetType: "Video"
    });

    return Response.json({ success:true });
  } catch(e) {
    return Response.json({ error:"Delete fail" }, { status:500 });
  }
}