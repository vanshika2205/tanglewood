"use client";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { HomeIcon, VideoIcon, PlayIcon, CheckIcon, ShieldIcon, SaveIcon, LikeIcon, DislikeIcon } from "@/components/Icons";
import { useUI } from "@/lib/UIContext";
import VideoCard from "@/components/VideoCard";
import TrendingSection from "@/components/TrendingSection";

const CATS = ["All","Education","Gaming","Cooking","Science","Kids","Music","Sports","DIY","Tech","Comedy","News"];
const COLORS = [["#1a3a2a","#0d2318"],["#1a1a3a","#0d0d23"],["#3a1a1a","#230d0d"],["#1a2a3a","#0d1823"],["#2a1a3a","#180d23"],["#3a2a1a","#23180d"],["#1a3a3a","#0d2323"],["#2a3a1a","#18230d"]];

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
  const [trending, setTrending] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("All");
  const [feed,     setFeed]     = useState("home"); 
  const [collapsed,setCollapsed]= useState(false);

  const isModern = uiMode === "modern";
  const isCyber = uiMode === "cyber";

  const searchQ = searchParams.get("search") || "";
  const queryFeed = searchParams.get("feed");

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", 24);
      if (feed === "home" && category !== "All") params.set("category", category);
      if (feed !== "home") params.set("feed", feed);
      if (searchQ) params.set("search", searchQ);
      
      const res = await fetch(`/api/videos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      } else {
        if (res.status === 401 && feed !== "home") {
          alert("Log in to view " + feed);
          router.push("/login");
        }
        setVideos([]);
      }
    } catch { 
      setVideos([]); 
    } finally { 
      setLoading(false); 
    }
  }, [category, searchQ, feed, status]);

  useEffect(() => { 
    if (status !== "loading") {
      fetchVideos();
    }

    if (feed === "home" && !searchQ && category === "All") {
      fetch("/api/videos?limit=10").then(r=>r.json()).then(data => {
         const sorted = (data.videos || []).sort((a,b) => (b.views||0) - (a.views||0));
         setTrending(sorted);
      }).catch(console.error);
    } else {
      setTrending([]);
    }
  }, [category, searchQ, feed, status]);

  const handleFeedChange = (targetFeed) => {
    if (targetFeed !== "home" && status !== "authenticated") {
      router.push("/login");
      return;
    }
    setFeed(targetFeed);
    if (targetFeed !== "home") setCategory("All");
    
    const params = new URLSearchParams(searchParams.toString());
    if (targetFeed === "home") params.delete("feed");
    else params.set("feed", targetFeed);
    if (params.toString() !== searchParams.toString()) {
       router.push(`/?${params.toString()}`);
    }
  };

  const W = collapsed ? 72 : 240;

  return (
    <div style={{ minHeight:"100vh", background: "var(--bg-color)", fontFamily:"'Inter', sans-serif", color: "var(--text-color)" }}>
      <Navbar onMenuToggle={()=>setCollapsed(p=>!p)} collapsed={collapsed} />
      <style>{`
        *{box-sizing:border-box;}
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton { background: linear-gradient(90deg, var(--border-color) 25%, var(--card-bg) 50%, var(--border-color) 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite linear; border-radius: 8px; }
        .cat-chip:hover { border-color: var(--accent-color); background: var(--glass-bg); }
      `}</style>
      
      <div style={{ display:"flex", paddingTop:56 }}>
        <aside style={{ 
          position:"fixed", top:56, left:0, bottom:0, width:W,
          background: "var(--bg-color)", borderRight: "1px solid var(--border-color)",
          padding:"12px 8px", transition:"width 0.2s", zIndex:50, overflowY:"auto" 
        }}>
          {SIDEBAR.map(item => (
            <button key={item.id} onClick={()=>handleFeedChange(item.feed)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:collapsed?0:12, justifyContent:collapsed?"center":"flex-start",
              padding:collapsed?"14px 0":"10px 12px", marginBottom:4, borderRadius:12, border:"none", cursor:"pointer", fontFamily:"inherit",
              background:feed===item.feed ? "var(--card-bg)" : "transparent",
              color:feed===item.feed ? "var(--accent-color)" : "var(--text-color)",
              border: feed===item.feed ? "1px solid var(--border-color)" : "1px solid transparent",
              transition:"all 0.2s",
            }}>
              <span style={{ opacity: feed===item.feed?1:0.7 }}><item.Icon /></span>
              {!collapsed && <span style={{ fontSize:14, fontWeight:feed===item.feed?700:500 }}>{item.label}</span>}
            </button>
          ))}

          {!collapsed && (
            <div className="glass-panel" style={{ margin:"20px 8px", padding:"16px", borderRadius:14, border: "1px solid var(--accent-color)" }}>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--accent-color)", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}><ShieldIcon /> SAFE ZONE</div>
              <div style={{ fontSize:12, color:"var(--text-color)", opacity: 0.6, lineHeight:1.5 }}>Every video is AI-scanned for family safety.</div>
            </div>
          )}
        </aside>

        <main style={{ flex:1, marginLeft:W, padding:"0 24px 60px", minWidth:0, transition:"margin-left 0.2s" }}>
          {feed === "home" && !searchQ && (
            <div style={{ 
              position:"sticky", top:56, zIndex:40, background: "var(--bg-color)", 
              padding:"12px 0", borderBottom: "1px solid var(--border-color)", marginBottom:24, 
              display:"flex", gap:10, overflowX:"auto", scrollbarWidth:"none" 
            }}>
              {CATS.map(cat => (
                <button key={cat} onClick={()=>setCategory(cat)} className="cat-chip" style={{
                  background:category===cat ? "var(--text-color)" : "var(--card-bg)",
                  color:category===cat ? "var(--bg-color)" : "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius:8, padding:"6px 14px", fontSize:14, fontWeight:category===cat?700:500,
                  cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", flexShrink:0
                }}>{cat}</button>
              ))}
            </div>
          )}

          {feed === "home" && trending.length > 0 && <TrendingSection videos={trending} />}

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", textTransform:"capitalize" }}>
              {searchQ ? `Search: "${searchQ}"` : feed === "home" ? (category === "All" ? "Recommended" : category) : feed}
            </h2>
            {searchQ && <button onClick={()=>router.push("/")} style={{ background:"none", border:"none", color:"var(--accent-color)", cursor:"pointer", fontSize:14 }}>Clear ✕</button>}
          </div>

          {loading ? (
             <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"32px 18px" }}>
              {[...Array(8)].map((_,i)=>(
                <div key={i}>
                  <div className="skeleton" style={{ width:"100%", paddingTop:"56.25%", marginBottom:12 }} />
                  <div style={{ display:"flex", gap:12 }}>
                    <div className="skeleton" style={{ width:36, height:36, borderRadius:"50%", flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div className="skeleton" style={{ height:16, marginBottom:8, width:"90%" }} />
                      <div className="skeleton" style={{ height:14, width:"60%" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign:"center", padding:"100px 0", opacity:0.5 }}>
              <div style={{ fontSize:50, marginBottom:16 }}><PlayIcon /></div>
              <div style={{ fontSize:18 }}>No videos found in this section.</div>
            </div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"32px 18px" }}>
                {videos.map((v,i)=><VideoCard key={`${v._id}_${i}`} video={v} index={i} />)}
              </div>
            </>
          )}

          <div className="glass-panel" style={{ 
            marginTop:60, padding:"32px", borderRadius:20, border:"1px solid var(--border-color)", 
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:24, flexWrap:"wrap"
          }}>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:"var(--accent-color)", marginBottom:8 }}>Become a Creator on Samtulan</div>
              <p style={{ fontSize:14, opacity: 0.7, maxWidth:500 }}>India's safest video platform. Join thousands of creators making safe, quality content for everyone.</p>
            </div>
            <Link href="/upload" style={{ 
              background:"var(--accent-color)", color:"#000", borderRadius:12, padding:"14px 32px", 
              fontSize:15, fontWeight:800, textDecoration:"none", transition:"transform 0.2s" 
            }} className="interactive-element">
              Get Started →
            </Link>
          </div>
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
