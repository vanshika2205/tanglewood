"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { HomeIcon, VideoIcon, PlayIcon, CheckIcon, ShieldIcon } from "@/components/Icons";

const CATS = ["All","Education","Gaming","Cooking","Science","Kids","Music","Sports","DIY","Tech","Comedy","News"];
const COLORS = [["#1a3a2a","#0d2318"],["#1a1a3a","#0d0d23"],["#3a1a1a","#230d0d"],["#1a2a3a","#0d1823"],["#2a1a3a","#180d23"],["#3a2a1a","#23180d"],["#1a3a3a","#0d2323"],["#2a3a1a","#18230d"]];

// Static demo videos for when DB is empty
const DEMO_VIDEOS = [
  { _id:"1", title:"Python Seekhein — Bilkul Shuruaat se", uploaderName:"CodeWithPriya", views:234891, likes:18000, category:"Education", duration:"18:42", color:0, verified:true },
  { _id:"2", title:"Ghar pe Pizza Banao — Easy Recipe",   uploaderName:"KitchenKing",   views:510000, likes:41000, category:"Cooking",   duration:"12:15", color:1, verified:true },
  { _id:"3", title:"Space aur Planets ki Duniya",         uploaderName:"ScienceWala",   views:870000, likes:62000, category:"Science",   duration:"24:00", color:2, verified:true },
  { _id:"4", title:"Bacchon ke liye Fun Drawing",         uploaderName:"ArtForKids",    views:120000, likes:9800,  category:"Kids",      duration:"9:30",  color:3, verified:false },
  { _id:"5", title:"Guitar Basics — Pehla Lesson",        uploaderName:"MusicMaestro",  views:340000, likes:27000, category:"Music",     duration:"15:20", color:4, verified:true },
  { _id:"6", title:"Minecraft Survival Guide S3",         uploaderName:"GamersAdda",    views:990000, likes:88000, category:"Gaming",    duration:"32:10", color:5, verified:true },
  { _id:"7", title:"Subah Ki Yoga — 10 Min Routine",      uploaderName:"FitFamily",     views:450000, likes:36000, category:"Sports",    duration:"10:05", color:6, verified:true },
  { _id:"8", title:"DIY Bookshelf — Wood Workshop",       uploaderName:"MakeItYourself",views:180000, likes:14000, category:"DIY",       duration:"22:44", color:7, verified:false },
  { _id:"9", title:"JavaScript Tips for Developers",      uploaderName:"DevDuniya",     views:620000, likes:49000, category:"Tech",      duration:"28:10", color:0, verified:true },
  { _id:"10",title:"Comedy Sketch — Wifi Band Ho Jaye",   uploaderName:"HaasiyaTV",     views:1200000,likes:96000, category:"Comedy",    duration:"7:22",  color:1, verified:true },
  { _id:"11",title:"Aaj Ki Khabar — News Digest",         uploaderName:"NewsNow",       views:310000, likes:22000, category:"News",      duration:"14:00", color:2, verified:true },
  { _id:"12",title:"Robotics for Kids — Build a Robot",   uploaderName:"TechTinkers",   views:89000,  likes:7200,  category:"Kids",      duration:"19:55", color:3, verified:true },
];

function fmtViews(n) {
  if (!n) return "0";
  if (n>=1e7) return (n/1e7).toFixed(1)+"Cr";
  if (n>=1e5) return (n/1e5).toFixed(1)+"L";
  if (n>=1e3) return (n/1e3).toFixed(1)+"K";
  return String(n);
}

function CreatorAvatar({ name, size=36 }) {
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const hue = (name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
  return (
    <div style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,background:`hsl(${hue},40%,22%)`,border:`1.5px solid hsl(${hue},40%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:`hsl(${hue},60%,75%)` }}>
      {initials}
    </div>
  );
}

function VideoCard({ video, index }) {
  const [hov, setHov] = useState(false);
  const colorIdx = video.color ?? (index % COLORS.length);
  const [c1,c2] = COLORS[colorIdx % COLORS.length];
  return (
    <Link href={`/watch?id=${video._id}`} style={{ textDecoration:"none" }}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ cursor:"pointer" }}>
        <div style={{ position:"relative",width:"100%",paddingTop:"56.25%",background:`linear-gradient(135deg,${c1},${c2})`,borderRadius:10,overflow:"hidden",marginBottom:10,transition:"transform 0.2s",transform:hov?"scale(1.02)":"scale(1)" }}>
          <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.25)",fontSize:40 }}>
            <PlayIcon />
          </div>
          <div style={{ position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,0.85)",color:"#fff",fontSize:12,fontWeight:700,padding:"2px 6px",borderRadius:4 }}>
            {video.duration||"--:--"}
          </div>
          <div style={{ position:"absolute",top:6,left:6,background:"rgba(46,204,113,0.2)",border:"1px solid rgba(46,204,113,0.5)",color:"#2ECC71",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4,display:"flex",alignItems:"center",gap:3 }}>
            <ShieldIcon /> SAFE
          </div>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <CreatorAvatar name={video.uploaderName||"Creator"} size={36} />
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:14,fontWeight:500,color:"#F1F1F1",lineHeight:1.35,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
              {video.title}
            </div>
            <div style={{ fontSize:12,color:"#AAAAAA",display:"flex",alignItems:"center",gap:4 }}>
              {video.uploaderName} {video.verified && <span style={{ color:"#2ECC71" }}><CheckIcon /></span>}
            </div>
            <div style={{ fontSize:12,color:"#717171",marginTop:1 }}>{fmtViews(video.views)} views</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

const SIDEBAR = [
  { id:"all",     label:"Home",      Icon:HomeIcon,  cat:"All"       },
  { id:"edu",     label:"Education", Icon:VideoIcon, cat:"Education" },
  { id:"gaming",  label:"Gaming",    Icon:VideoIcon, cat:"Gaming"    },
  { id:"kids",    label:"Kids",      Icon:VideoIcon, cat:"Kids"      },
  { id:"music",   label:"Music",     Icon:VideoIcon, cat:"Music"     },
  { id:"science", label:"Science",   Icon:VideoIcon, cat:"Science"   },
];

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videos,   setVideos]   = useState(DEMO_VIDEOS);
  const [loading,  setLoading]  = useState(false);
  const [category, setCategory] = useState("All");
  const [collapsed,setCollapsed]= useState(false);

  const searchQ = searchParams.get("search") || "";

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (searchQ) params.set("search", searchQ);
      const res = await fetch(`/api/videos?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.videos && data.videos.length > 0) setVideos(data.videos);
        else setVideos(DEMO_VIDEOS.filter(v => {
          const mc = category==="All" || v.category===category;
          const ms = !searchQ || v.title.toLowerCase().includes(searchQ.toLowerCase());
          return mc && ms;
        }));
      }
    } catch { /* use demo data */ } finally { setLoading(false); }
  }, [category, searchQ]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const W = collapsed ? 72 : 210;

  return (
    <div style={{ minHeight:"100vh", background:"#0F0F0F" }}>
      <Navbar onMenuToggle={()=>setCollapsed(p=>!p)} collapsed={collapsed} />
      <div style={{ display:"flex", paddingTop:56 }}>
        {/* Sidebar */}
        <aside style={{ position:"fixed",top:56,left:0,bottom:0,width:W,background:"#0F0F0F",borderRight:"1px solid #1a1a1a",padding:"10px 8px",transition:"width 0.2s",zIndex:50,overflowY:"auto" }}>
          {SIDEBAR.map(item => (
            <button key={item.id} onClick={()=>setCategory(item.cat)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:14,justifyContent:collapsed?"center":"flex-start",
              padding:collapsed?"12px 0":"10px 12px",marginBottom:2,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",
              background:category===item.cat?"#272727":"transparent",color:category===item.cat?"#F1F1F1":"#AAAAAA",transition:"background 0.15s",
            }}>
              <span style={{ flexShrink:0 }}><item.Icon /></span>
              {!collapsed && <span style={{ fontSize:13,fontWeight:category===item.cat?600:400 }}>{item.label}</span>}
            </button>
          ))}
          {!collapsed && (
            <div style={{ margin:"12px 4px 0",padding:"10px 12px",background:"rgba(46,204,113,0.07)",border:"1px solid #1A7A43",borderRadius:10 }}>
              <div style={{ fontSize:11,color:"#2ECC71",fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:5 }}><ShieldIcon /> Family Safe</div>
              <div style={{ fontSize:11,color:"#717171",lineHeight:1.5 }}>Har video AI + Human se verified</div>
            </div>
          )}
        </aside>

        {/* Main */}
        <main style={{ flex:1,marginLeft:W,padding:"0 20px 40px",minWidth:0,transition:"margin-left 0.2s" }}>
          {/* Category chips */}
          <div style={{ position:"sticky",top:56,zIndex:40,background:"#0F0F0F",paddingTop:14,paddingBottom:12,borderBottom:"1px solid #1a1a1a",marginBottom:20,display:"flex",gap:8,overflowX:"auto" }}>
            {CATS.map(cat => (
              <button key={cat} onClick={()=>setCategory(cat)} style={{
                background:category===cat?"#F1F1F1":"#272727",color:category===cat?"#0F0F0F":"#F1F1F1",
                border:"none",borderRadius:20,padding:"7px 14px",fontSize:13,fontWeight:category===cat?700:400,
                cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",transition:"all 0.15s",
              }}>{cat}</button>
            ))}
          </div>

          {searchQ && (
            <div style={{ marginBottom:16,fontSize:14,color:"#AAAAAA" }}>
              "{searchQ}" ke results — <button onClick={()=>router.push("/")} style={{ background:"none",border:"none",color:"#2ECC71",cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>clear ✕</button>
            </div>
          )}

          {loading ? (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"28px 16px" }}>
              {[...Array(8)].map((_,i)=>(
                <div key={i}>
                  <div style={{ width:"100%",paddingTop:"56.25%",background:"#1a1a1a",borderRadius:10,marginBottom:10,animation:"pulse 1.5s infinite" }} />
                  <div style={{ height:14,background:"#1a1a1a",borderRadius:4,marginBottom:6,width:"80%" }} />
                  <div style={{ height:12,background:"#1a1a1a",borderRadius:4,width:"50%" }} />
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign:"center",padding:"80px 0",color:"#717171" }}>
              <div style={{ fontSize:48,marginBottom:12,opacity:0.3 }}><PlayIcon /></div>
              <div style={{ fontSize:16 }}>Koi video nahi mila</div>
              <button onClick={()=>{setCategory("All");router.push("/");}} style={{ marginTop:12,background:"#272727",border:"none",color:"#F1F1F1",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontFamily:"inherit" }}>
                Sab Videos Dekho
              </button>
            </div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"28px 16px" }}>
              {videos.map((v,i)=><VideoCard key={v._id} video={v} index={i} />)}
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop:48,padding:"24px 28px",background:"#111",border:"1px solid #272727",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:15,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:8 }}><ShieldIcon /> Samtulan — India's Family-Safe Platform</div>
              <div style={{ fontSize:13,color:"#AAAAAA",lineHeight:1.6 }}>Har video AI + human review ke baad publish hota hai.</div>
            </div>
            <Link href="/upload" style={{ background:"#2ECC71",color:"#071209",borderRadius:10,padding:"12px 26px",fontSize:14,fontWeight:700,whiteSpace:"nowrap" }}>
              Upload Karein →
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
