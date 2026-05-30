"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { PlayIcon, LikeIcon, SaveIcon, ShareIcon, BackIcon, CheckIcon, ShieldIcon } from "@/components/Icons";

const COLORS = [["#1a3a2a","#0d2318"],["#1a1a3a","#0d0d23"],["#3a1a1a","#230d0d"],["#1a2a3a","#0d1823"],["#2a1a3a","#180d23"],["#3a2a1a","#23180d"]];

const RELATED = [
  { _id:"r1", title:"React Hooks Tutorial — useState aur useEffect",    uploaderName:"CodeWithPriya", views:310000, duration:"25:10", color:1 },
  { _id:"r2", title:"JavaScript Advanced — Closures aur Promises",      uploaderName:"DevDuniya",     views:620000, duration:"32:00", color:2 },
  { _id:"r3", title:"Node.js Backend — REST API Banao",                  uploaderName:"CodeWithPriya", views:180000, duration:"45:30", color:3 },
  { _id:"r4", title:"Ghar pe Pizza Banao — Easy Recipe",                uploaderName:"KitchenKing",   views:510000, duration:"12:15", color:4 },
  { _id:"r5", title:"Space Documentary — Planets ki Duniya",            uploaderName:"ScienceWala",   views:870000, duration:"24:00", color:5 },
  { _id:"r6", title:"Guitar Basics — Pehla Lesson",                     uploaderName:"MusicMaestro",  views:340000, duration:"15:20", color:0 },
  { _id:"r7", title:"Minecraft Survival Guide S3",                       uploaderName:"GamersAdda",    views:990000, duration:"32:10", color:1 },
];

function fmtViews(n) {
  if (!n) return "0";
  if(n>=1e7) return (n/1e7).toFixed(1)+"Cr";
  if(n>=1e5) return (n/1e5).toFixed(1)+"L";
  if(n>=1e3) return (n/1e3).toFixed(1)+"K";
  return String(n);
}

function CreatorAvatar({ name, size=36 }) {
  const i = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const h = (name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
  return <div style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,background:`hsl(${h},40%,22%)`,border:`1.5px solid hsl(${h},40%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:`hsl(${h},60%,75%)` }}>{i}</div>;
}

export default function WatchPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id");

  const [video,    setVideo]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [playing,  setPlaying]  = useState(false);
  const [liked,    setLiked]    = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [comment,  setComment]  = useState("");
  const [comments, setComments] = useState([
    { id:1, user:"Rahul Sharma",  text:"Bahut acha samjhaya! Finally samajh aaya.", likes:142, ago:"2 ghante pehle" },
    { id:2, user:"Priya Mehta",   text:"Platform ka content really family-friendly hai. 👍", likes:87, ago:"5 ghante pehle" },
    { id:3, user:"Amit Kumar",    text:"Mast video hai! Part 2 kab aayega?", likes:63, ago:"1 din pehle" },
  ]);

  // Demo video data (real app mein DB se aayega)
  const demoVideo = {
    _id: videoId||"1",
    title: "Python Seekhein — Bilkul Shuruaat se | Complete Beginners Guide 2025",
    uploaderName: "CodeWithPriya",
    description: "Yeh video Python programming seekhne ke liye ek complete guide hai.\n\n• Python installation\n• Variables aur data types\n• Loops aur conditions\n• Functions\n• Real world projects\n\n🛡 Yeh video Samtulan ke AI + Human moderation se verified hai.",
    views: 234891, likes: 18000, duration: "18:42",
    category: "Education", color: 0, verified: true,
    tags: ["Python","Coding","Programming","Beginners"],
    createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
  };

  useEffect(() => {
    setLoading(true);
    // Try to fetch from API, fallback to demo
    fetch(`/api/videos?id=${videoId||""}`)
      .then(r=>r.ok?r.json():null)
      .then(data => {
        if (data?.videos?.[0]) setVideo(data.videos[0]);
        else setVideo(demoVideo);
      })
      .catch(()=>setVideo(demoVideo))
      .finally(()=>setLoading(false));
  }, [videoId]);

  const v = video || demoVideo;
  const [c1,c2] = COLORS[(v.color||0) % COLORS.length];
  const daysAgo = v.createdAt ? Math.floor((Date.now()-new Date(v.createdAt))/86400000) : 3;

  const addComment = () => {
    if (!comment.trim()) return;
    setComments(prev=>[{ id:Date.now(),user:"Aap",text:comment,likes:0,ago:"Abhi" },...prev]);
    setComment("");
  };

  return (
    <div style={{ minHeight:"100vh",background:"#0F0F0F" }}>
      <Navbar />
      <div style={{ paddingTop:56,display:"flex",gap:0 }}>
        {/* Main */}
        <div style={{ flex:1,minWidth:0,padding:"16px 20px 40px" }}>
          <Link href="/" style={{ display:"inline-flex",alignItems:"center",gap:6,color:"#AAAAAA",fontSize:13,marginBottom:14,padding:"6px 10px",borderRadius:8,background:"#1a1a1a" }}>
            <BackIcon /> Back
          </Link>

          {/* Player */}
          <div style={{ width:"100%",paddingTop:"56.25%",position:"relative",borderRadius:12,overflow:"hidden",background:`linear-gradient(135deg,${c1},${c2})`,marginBottom:16 }}>
            {!playing ? (
              <div onClick={()=>setPlaying(true)} style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:14 }}>
                <div style={{ width:68,height:68,borderRadius:"50%",background:"rgba(0,0,0,0.7)",border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <PlayIcon />
                </div>
                <div style={{ color:"rgba(255,255,255,0.7)",fontSize:14 }}>{v.title?.slice(0,50)}...</div>
              </div>
            ) : (
              <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10 }}>
                <div style={{ color:"rgba(255,255,255,0.7)",fontSize:14 }}>▶ Playing: {v.duration}</div>
                <div style={{ width:"60%",height:4,background:"rgba(255,255,255,0.15)",borderRadius:2 }}>
                  <div style={{ width:"35%",height:"100%",background:"#2ECC71",borderRadius:2 }} />
                </div>
                <button onClick={()=>setPlaying(false)} style={{ background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:12 }}>⏹ Stop</button>
              </div>
            )}
            <div style={{ position:"absolute",top:10,right:10,background:"rgba(46,204,113,0.2)",border:"1px solid rgba(46,204,113,0.5)",color:"#2ECC71",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:5,display:"flex",alignItems:"center",gap:4 }}>
              <ShieldIcon /> VERIFIED SAFE
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontSize:18,fontWeight:700,lineHeight:1.4,marginBottom:12 }}>{v.title}</h1>

          {/* Channel row */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,paddingBottom:14,borderBottom:"1px solid #272727",marginBottom:14 }}>
            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
              <CreatorAvatar name={v.uploaderName||"Creator"} size={42} />
              <div>
                <div style={{ fontSize:15,fontWeight:600,display:"flex",alignItems:"center",gap:5 }}>
                  {v.uploaderName} {v.verified && <span style={{ color:"#2ECC71" }}><CheckIcon /></span>}
                </div>
                <div style={{ fontSize:13,color:"#AAAAAA" }}>Verified Creator</div>
              </div>
              <button style={{ background:"#F1F1F1",color:"#0F0F0F",border:"none",borderRadius:20,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                Subscribe
              </button>
            </div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              <div style={{ display:"flex",background:"#272727",borderRadius:20,overflow:"hidden" }}>
                <button onClick={()=>setLiked(p=>!p)} style={{ background:"none",border:"none",borderRight:"1px solid #3F3F3F",color:liked?"#2ECC71":"#F1F1F1",padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,fontFamily:"inherit" }}>
                  <LikeIcon /> {liked?fmtViews((v.likes||0)+1):fmtViews(v.likes||0)}
                </button>
                <button style={{ background:"none",border:"none",color:"#AAAAAA",padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",fontSize:12,fontFamily:"inherit" }}>👎</button>
              </div>
              <button style={{ background:"#272727",border:"none",color:"#F1F1F1",borderRadius:20,padding:"8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
                <ShareIcon /> Share
              </button>
              <button onClick={()=>setSaved(p=>!p)} style={{ background:"#272727",border:"none",color:saved?"#2ECC71":"#F1F1F1",borderRadius:20,padding:"8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
                <SaveIcon /> {saved?"Saved":"Save"}
              </button>
            </div>
          </div>

          {/* Description */}
          <div style={{ background:"#1a1a1a",borderRadius:12,padding:"14px 16px",marginBottom:22 }}>
            <div style={{ fontSize:13,fontWeight:600,marginBottom:8 }}>
              {fmtViews(v.views)} views • {daysAgo} din pehle
              <span style={{ marginLeft:10,background:"rgba(46,204,113,0.1)",border:"1px solid #1A7A43",color:"#2ECC71",fontSize:11,padding:"2px 8px",borderRadius:4 }}>✓ Family Safe</span>
            </div>
            <div style={{ fontSize:13,color:"#AAAAAA",lineHeight:1.7,whiteSpace:"pre-line",maxHeight:showMore?"none":"72px",overflow:"hidden" }}>
              {v.description}
            </div>
            <button onClick={()=>setShowMore(p=>!p)} style={{ background:"none",border:"none",color:"#F1F1F1",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:6,fontFamily:"inherit" }}>
              {showMore?"Show less":"...more"}
            </button>
            {v.tags?.length>0 && (
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:10 }}>
                {v.tags.map(t=><span key={t} style={{ background:"#272727",color:"#AAAAAA",fontSize:12,padding:"3px 10px",borderRadius:99 }}>#{t}</span>)}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 style={{ fontSize:16,fontWeight:700,marginBottom:18 }}>{comments.length} Comments</h3>
            <div style={{ display:"flex",gap:12,marginBottom:24 }}>
              <div style={{ width:36,height:36,borderRadius:"50%",background:"#272727",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#AAAAAA",flexShrink:0 }}>AA</div>
              <div style={{ flex:1 }}>
                <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comment karein..." rows={2}
                  style={{ width:"100%",background:"transparent",border:"none",borderBottom:"1px solid #3F3F3F",color:"#F1F1F1",fontSize:14,fontFamily:"inherit",outline:"none",resize:"none",lineHeight:1.6,padding:"4px 0" }} />
                {comment && (
                  <div style={{ display:"flex",justifyContent:"flex-end",gap:8,marginTop:8 }}>
                    <button onClick={()=>setComment("")} style={{ background:"none",border:"none",color:"#AAAAAA",fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:"7px 14px",borderRadius:20 }}>Cancel</button>
                    <button onClick={addComment} style={{ background:"#2ECC71",border:"none",color:"#071209",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",padding:"7px 16px",borderRadius:20 }}>Comment</button>
                  </div>
                )}
              </div>
            </div>
            {comments.map(c=>(
              <div key={c.id} style={{ display:"flex",gap:12,marginBottom:22 }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:"#272727",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#AAAAAA",flexShrink:0 }}>
                  {c.user.split(" ").map(w=>w[0]).join("").slice(0,2)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                    <span style={{ fontSize:13,fontWeight:600 }}>{c.user}</span>
                    <span style={{ fontSize:12,color:"#717171" }}>{c.ago}</span>
                  </div>
                  <div style={{ fontSize:14,color:"#E1E1E1",lineHeight:1.5,marginBottom:6 }}>{c.text}</div>
                  <button style={{ background:"none",border:"none",color:"#AAAAAA",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4 }}>
                    👍 {c.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        <div style={{ width:360,flexShrink:0,padding:"16px 16px 40px",borderLeft:"1px solid #1a1a1a",position:"sticky",top:56,maxHeight:"calc(100vh - 56px)",overflowY:"auto" }}>
          <div style={{ fontSize:14,fontWeight:600,marginBottom:14,color:"#AAAAAA" }}>Up next</div>
          {RELATED.map(rv=>{
            const [rc1,rc2] = COLORS[rv.color%COLORS.length];
            return (
              <Link key={rv._id} href={`/watch?id=${rv._id}`} style={{ textDecoration:"none" }}>
                <div style={{ display:"flex",gap:10,padding:"8px 4px",borderRadius:10,marginBottom:4,cursor:"pointer" }}>
                  <div style={{ width:160,height:90,flexShrink:0,borderRadius:8,background:`linear-gradient(135deg,${rc1},${rc2})`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",color:"rgba(255,255,255,0.25)" }}>
                    <PlayIcon />
                    <div style={{ position:"absolute",bottom:4,right:4,background:"rgba(0,0,0,0.85)",color:"#fff",fontSize:11,fontWeight:700,padding:"1px 5px",borderRadius:3 }}>{rv.duration}</div>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:500,color:"#F1F1F1",lineHeight:1.35,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{rv.title}</div>
                    <div style={{ fontSize:12,color:"#AAAAAA" }}>{rv.uploaderName}</div>
                    <div style={{ fontSize:11,color:"#717171",marginTop:1 }}>{fmtViews(rv.views)} views</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
