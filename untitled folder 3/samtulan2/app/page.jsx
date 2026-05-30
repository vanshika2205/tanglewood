"use client";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { HomeIcon, VideoIcon, PlayIcon, CheckIcon, ShieldIcon, SaveIcon, LikeIcon, DislikeIcon } from "@/components/Icons";
import { useUI } from "@/lib/UIContext";

const CATS = ["All","Education","Gaming","Cooking","Science","Kids","Music","Sports","DIY","Tech","Comedy","News"];
const COLORS = [["#1a3a2a","#0d2318"],["#1a1a3a","#0d0d23"],["#3a1a1a","#230d0d"],["#1a2a3a","#0d1823"],["#2a1a3a","#180d23"],["#3a2a1a","#23180d"],["#1a3a3a","#0d2323"],["#2a3a1a","#18230d"]];

function fmtViews(n) {
  if (!n) return "0";
  if (n>=1e7) return (n/1e7).toFixed(1)+"Cr";
  if (n>=1e5) return (n/1e5).toFixed(1)+"L";
  if (n>=1e3) return (n/1e3).toFixed(1)+"K";
  return String(n);
}
function daysAgo(d) {
  const diff = Math.floor((Date.now()-new Date(d))/86400000);
  return diff<=0?"Today":diff===1?"Yesterday":diff+" days ago";
}

function CreatorAvatar({ name, src, size=36 }) {
  if (src) {
    return <img src={src} alt={name} style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,objectFit:"cover",border:"1px solid var(--border-color)" }} />;
  }
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const hue = (name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
  return (
    <div style={{ 
        width:size,height:size,borderRadius:"50%",flexShrink:0,
        background: `hsla(${hue},45%,20%,0.2)`,
        border: `1.5px solid var(--accent-color)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*0.35,fontWeight:700,color:"var(--text-color)",
        backdropFilter: "blur(4px)"
    }}>
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
      <div 
        className="interactive-card"
        onMouseEnter={()=>setHov(true)} 
        onMouseLeave={()=>setHov(false)} 
        style={{ 
          cursor:"pointer",
          padding: "10px",
          borderRadius: 16,
          background: hov ? "rgba(255,255,255,0.06)" : "transparent",
          transition: "all 0.2s"
        }}
      >
        <div style={{ position:"relative",width:"100%",paddingTop:"56.25%",background:video.thumbnailUrl?"var(--border-color)":`linear-gradient(135deg,${c1},${c2})`,borderRadius:10,overflow:"hidden",marginBottom:10,transition:"transform 0.2s",transform:hov ?"scale(1.02)":"scale(1)", border: "1px solid var(--border-color)" }}>
          {video.thumbnailUrl && (
            <img src={video.thumbnailUrl} alt={video.title} style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover" }} />
          )}
          <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.25)",fontSize:40 }}>
            <PlayIcon />
          </div>
          <div style={{ position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,0.85)",color:"#fff",fontSize:12,fontWeight:700,padding:"2px 6px",borderRadius:4 }}>
            {video.duration||"--:--"}
          </div>
          <div style={{ position:"absolute",top:6,left:6,background:"var(--glass-bg)",border:"1px solid var(--accent-color)",color:"var(--accent-color)",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4,display:"flex",alignItems:"center",gap:3 }}>
            <ShieldIcon /> SAFE
          </div>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <CreatorAvatar name={video.uploaderName||"Creator"} src={video.uploaderAvatar} size={36} />
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:14,fontWeight:600,color:"var(--text-color)",lineHeight:1.35,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
              {video.title}
            </div>
            <div style={{ fontSize:12,color:"var(--text-color)", opacity:0.7, display:"flex",alignItems:"center",gap:4 }}>
              {video.uploaderName} {video.verified && <span style={{ color:"var(--accent-color)" }}><CheckIcon /></span>}
            </div>
            <div style={{ fontSize:12,color:"var(--text-color)", opacity:0.5, marginTop:1 }}>{fmtViews(video.views)} views • {daysAgo(video.createdAt)}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

const SIDEBAR = [
  { id:"home",          label:"Home",          Icon:HomeIcon,  feed:"home" },
  { id:"subscriptions", label:"Subscriptions", Icon:VideoIcon, feed:"subscriptions" },
  { id:"saved",         label:"Saved Videos",  Icon:SaveIcon,  feed:"saved" },
  { id:"liked",         label:"Liked Videos",  Icon:LikeIcon,  feed:"liked" },
  { id:"disliked",      label:"Disliked Videos",Icon:DislikeIcon,feed:"disliked" },
];

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { uiMode, colorMode } = useUI();
  const [videos,   setVideos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("All");
  const [feed,     setFeed]     = useState("home"); // home, subscriptions, saved
  const [collapsed,setCollapsed]= useState(false);

  const isModern = uiMode === "modern";
  const isCyber = uiMode === "cyber";
  const isMinimal = uiMode === "minimalist";

  const searchQ = searchParams.get("search") || "";
  const queryFeed = searchParams.get("feed");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (queryFeed && queryFeed !== feed) {
      setFeed(queryFeed);
    }
  }, [queryFeed]);

  const fetchVideos = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    loadingRef.current = true;
    try {
      const params = new URLSearchParams();
      params.set("page", pageNum);
      if (feed === "home" && category !== "All") params.set("category", category);
      if (feed !== "home") params.set("feed", feed);
      if (searchQ) params.set("search", searchQ);
      
      const res = await fetch(`/api/videos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(p => pageNum === 1 ? (data.videos || []) : [...p, ...(data.videos || [])]);
        setHasMore(pageNum < data.totalPages);
      } else {
        if (res.status === 401 && feed !== "home") {
          alert("Log in to view " + feed);
          router.push("/login"); // redirect if unauth feed
        }
        if (pageNum === 1) setVideos([]);
      }
    } catch { 
      if (pageNum === 1) setVideos([]); 
    } finally { 
      setLoading(false); 
      loadingRef.current = false;
    }
  }, [category, searchQ, feed, status]);

  useEffect(() => { 
    if (status !== "loading") {
      setPage(1);
      fetchVideos(1);
    }
  }, [category, searchQ, feed, status]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        setPage(p => {
          const next = p + 1;
          fetchVideos(next);
          return next;
        });
      }
    }, { threshold: 0.1 });
    
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [hasMore, fetchVideos]);

  const handleFeedChange = (targetFeed) => {
    if (targetFeed !== "home" && status !== "authenticated") {
      router.push("/login");
      return;
    }
    setFeed(targetFeed);
    if (targetFeed !== "home") setCategory("All"); // Reset category if jumping to a specific feed route
    
    // Sync to URL silently so that links can be shared/bookmarked
    const params = new URLSearchParams(searchParams.toString());
    if (targetFeed === "home") params.delete("feed");
    else params.set("feed", targetFeed);
    if (params.toString() !== searchParams.toString()) {
       router.push(`/?${params.toString()}`);
    }
  };

  const W = collapsed ? 72 : 210;

  return (
    <div style={{ minHeight:"100vh", background: "var(--bg-color)", fontFamily:"'Inter','Roboto', sans-serif", color: "var(--text-color)" }}>
      <Navbar onMenuToggle={()=>setCollapsed(p=>!p)} collapsed={collapsed} />
      <style>{`
        *{box-sizing:border-box;}
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, var(--border-color) 25%, var(--card-bg) 50%, var(--border-color) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
      `}</style>
      <div style={{ display:"flex", paddingTop:56 }}>
        {/* Sidebar */}
        <aside className="glass-panel" style={{ 
          position:"fixed",top:56,left:0,bottom:0,width:W,
          background: "var(--bg-color)",
          borderRight: "1px solid var(--border-color)",
          padding:"10px 8px",transition:"width 0.2s",zIndex:50,overflowY:"auto" 
        }}>
          <div style={{ borderBottom:"1px solid var(--border-color)", paddingBottom:10, marginBottom:10 }}>
            {SIDEBAR.map(item => (
              <button key={item.id} onClick={()=>handleFeedChange(item.feed)} style={{
                width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:14,justifyContent:collapsed?"center":"flex-start",
                padding:collapsed?"12px 0":"10px 12px",marginBottom:2,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",
                background:feed===item.feed ? "var(--glass-bg)" : "transparent",
                color:feed===item.feed ? "var(--accent-color)" : "var(--text-color)",
                border: feed===item.feed ? "1px solid var(--accent-color)" : "1px solid transparent",
                opacity: feed === item.feed ? 1 : 0.6,
                transition:"all 0.15s",
              }}>
                <span style={{ flexShrink:0 }}><item.Icon /></span>
                {!collapsed && <span style={{ fontSize:13,fontWeight:feed===item.feed?600:400 }}>{item.label}</span>}
              </button>
            ))}
          </div>

          {!collapsed && (
            <div className="glass-panel" style={{ margin:"12px 4px 0",padding:"10px 12px",border: "1px solid var(--accent-color)",borderRadius:10 }}>
              <div style={{ fontSize:11,color:"var(--accent-color)",fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:5 }}><ShieldIcon /> Family Safe</div>
              <div style={{ fontSize:11,color:"var(--text-color)", opacity: 0.6,lineHeight:1.5 }}>Har video AI + Human se verified hai.</div>
            </div>
          )}
        </aside>

        {/* Main */}
        <main style={{ flex:1,marginLeft:W,padding:"0 20px 40px",minWidth:0,transition:"margin-left 0.2s", color:"var(--text-color)" }}>
          
          {/* Feed Header */}
          {feed !== "home" && (
            <div style={{ padding:"20px 0", borderBottom:"1px solid var(--border-color)", marginBottom:20 }}>
              <h1 className="gnlow-text" style={{ fontSize:24, fontWeight:700, textTransform:"capitalize", color:"var(--text-color)" }}>{feed}</h1>
            </div>
          )}

          {/* Category chips only on Home feed */}
          {feed === "home" && (
            <div style={{ position:"sticky",top:56,zIndex:40,background: "var(--bg-color)",paddingTop:14,paddingBottom:12,borderBottom: "1px solid var(--border-color)",marginBottom:20,display:"flex",gap:8,overflowX:"auto", whiteSpace:"nowrap" }}>
              {CATS.map(cat => (
                <button key={cat} onClick={()=>setCategory(cat)} style={{
                  background:category===cat ? "var(--accent-color)" : "var(--card-bg)",
                  color:category===cat ? (colorMode === "dark" ? "#000" : "#FFF") : "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius:20,padding:"7px 14px",fontSize:13,fontWeight:category===cat?700:400,
                  cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s", flexShrink:0
                }}>{cat}</button>
              ))}
            </div>
          )}

          {searchQ && (
            <div style={{ marginBottom:16,fontSize:14,color:"var(--text-color)", opacity: 0.6 }}>
              "{searchQ}" ke results — <button onClick={()=>router.push("/")} style={{ background:"none",border:"none",color:"var(--accent-color)",cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>clear ✕</button>
            </div>
          )}

          {loading ? (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"28px 16px" }}>
              {[...Array(8)].map((_,i)=>(
                <div key={i}>
                  <div className="skeleton" style={{ width:"100%",paddingTop:"56.25%",borderRadius:10,marginBottom:10 }} />
                  <div style={{ display:"flex", gap:10 }}>
                    <div className="skeleton" style={{ width:36,height:36,borderRadius:"50%",flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div className="skeleton" style={{ height:14,marginBottom:8,width:"85%" }} />
                      <div className="skeleton" style={{ height:12,width:"55%" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign:"center",padding:"80px 0",color:"var(--text-color)", opacity:0.5 }}>
              <div style={{ fontSize:48,marginBottom:12,opacity:0.3 }}><PlayIcon /></div>
              <div style={{ fontSize:16, marginBottom:16 }}>Koi video nahi mila</div>
              {feed !== "home" && (
                <button onClick={()=>{setFeed("home");}} style={{ background:"var(--card-bg)",border:"1px solid var(--border-color)",color:"var(--text-color)",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontFamily:"inherit" }}>
                   Home par wapas jayein
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"28px 16px" }}>
                {videos.map((v,i)=><VideoCard key={`${v._id}_${i}`} video={v} index={i} />)}
              </div>
              <div ref={observerTarget} style={{ height:40, marginTop:20, display:"flex", alignItems:"center", justifyContent:"center" }}>
                 {page > 1 && loadingRef.current && <div style={{ color:"var(--text-color)", opacity: 0.5, fontSize:14 }}>Load ho raha hai...</div>}
              </div>
            </>
          )}

          {/* CTA Banner */}
          {feed === "home" && (
            <div className={isModern || isCyber ? "glass-panel" : ""} style={{ 
              marginTop:48,padding:"24px 28px",
              background: isModern || isCyber ? "transparent" : "var(--card-bg)",
              border: isModern || isCyber ? "none" : "1px solid var(--border-color)",
              borderRadius:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap",
              boxShadow: "var(--shadow)"
            }}>
              <div>
                <div style={{ fontSize:15,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:8, color:"var(--accent-color)" }}><ShieldIcon /> Samtulan — India's Family-Safe Platform</div>
                <div style={{ fontSize:13,color:"var(--text-color)", opacity: 0.7,lineHeight:1.6 }}>Har video AI + human review ke baad publish hota hai.</div>
              </div>
              <Link href="/upload" style={{ background:"var(--accent-color)",color:colorMode === "light" && !isCyber ? "#FFF" : "#071209",borderRadius:10,padding:"12px 26px",fontSize:14,fontWeight:700,whiteSpace:"nowrap", textDecoration:"none", boxShadow: "var(--shadow)" }}>
                Upload Karein →
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
