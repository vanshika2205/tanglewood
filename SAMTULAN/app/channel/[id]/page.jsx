"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CheckIcon, PlayIcon, ShieldIcon } from "@/components/Icons";
import { useUI } from "@/lib/UIContext";
import VideoCard from "@/components/VideoCard";

const COLORS = [["#1a3a2a","#0d2318"],["#1a1a3a","#0d0d23"],["#3a1a1a","#230d0d"],["#1a2a3a","#0d1823"],["#2a1a3a","#180d23"],["#3a2a1a","#23180d"],["#1a3a3a","#0d2323"],["#2a3a1a","#18230d"]];

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
    <div style={{ 
        width:size,height:size,borderRadius:"50%",flexShrink:0,
        background: `hsla(${hue},45%,25%,0.3)`,
        border: `2px solid var(--accent-color)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*0.35,fontWeight:700,color:"var(--text-color)",
        backdropFilter: "blur(4px)",
        boxShadow: "var(--shadow)"
    }}>
      {initials}
    </div>
  );
}



function ChannelContent({ channelId }) {
  const { data: session, status } = useSession();
  const { colorMode } = useUI();
  const [videos, setVideos] = useState([]);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState("Home"); // Home, Videos, About

  useEffect(() => {
    setLoading(true);
    fetch(`/api/user/profile?id=${channelId}`).then(r=>r.ok?r.json():null).then(d=>{
      if (d?.user) setCreator(d.user);
    });

    fetch(`/api/videos?uploaderId=${channelId}`).then(r=>r.ok?r.json():null).then(d=>{
      if(d?.videos) setVideos(d.videos);
    }).finally(()=>setLoading(false));
  }, [channelId]);

  useEffect(() => {
    if (session?.user && creator) {
      fetch("/api/user/me").then(r=>r.json()).then(data => {
        if(data.subscribedTo?.includes(channelId)) setSubscribed(true);
      });
    }
  }, [session, creator, channelId]);

  const handleSubscribe = async () => {
    if (status !== "authenticated") return alert("Login to subscribe!");
    if (session.user.id === channelId) return alert("Hah, you can't subscribe to yourself!");
    setSubscribed(!subscribed);
    setCreator(prev => ({...prev, subscribers: (prev.subscribers||0) + (subscribed ? -1 : 1)}));
    await fetch("/api/user/subscribe", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ creatorId: channelId })
    });
  };

  if (loading) return <div style={{ minHeight:"100vh",background:"var(--bg-color)", color:"var(--text-color)", display:"flex", alignItems:"center", justifyContent:"center" }}>Loading Studio...</div>;
  if (!creator) return <div style={{ minHeight:"100vh",background:"var(--bg-color)", color:"var(--text-color)", display:"flex", alignItems:"center", justifyContent:"center" }}>Studio not found ❌</div>;

  const TABS = ["Home", "Videos", "About"];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-color)", color:"var(--text-color)", fontFamily:"'Inter', sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin:"0 auto", paddingTop: 56 }}>
        {/* Banner */}
        <div style={{ 
          width:"100%", height: 180, 
          background: `linear-gradient(135deg, var(--accent-color), #071209)`, 
          borderRadius: "0 0 16px 16px",
          position: "relative", borderBottom: "1px solid var(--border-color)" 
        }}></div>

        {/* Channel Info */}
        <div style={{ padding:"24px 40px 0", display:"flex", gap: 24, alignItems: "flex-start" }}>
          <div style={{ position: "relative", marginTop: "-60px" }}>
            <div style={{ 
              width:128, height:128, borderRadius:"50%", background:"var(--card-bg)", 
              border:"4px solid var(--bg-color)", overflow:"hidden", boxShadow: "var(--shadow)" 
            }}>
              {creator.avatar ? <img src={creator.avatar} style={{width:"100%", height:"100%", objectFit:"cover"}} /> : (
                <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, fontWeight:800, color:"var(--accent-color)", background:"var(--glass-bg)" }}>
                  { (creator.channelName || creator.name || "?")[0].toUpperCase() }
                </div>
              )}
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4, display:"flex", alignItems:"center", gap: 8 }}>
              {creator.channelName || creator.name} {creator.isVerified && <span style={{ color:"var(--accent-color)", fontSize:20 }}><CheckIcon /></span>}
            </h1>
            <div style={{ color:"var(--text-color)", opacity: 0.6, fontSize: 14, marginBottom: 16 }}>
              <span>@{creator.name?.toLowerCase().replace(/\s/g, '')}</span>
              <span style={{margin:"0 8px"}}>•</span>
              <span style={{fontWeight:600}}>{fmtViews(creator.subscribers||0)} subscribers</span>
              <span style={{margin:"0 8px"}}>•</span>
              <span style={{fontWeight:600}}>{videos.length} videos</span>
            </div>
            
            <button onClick={handleSubscribe} style={{ 
                background:subscribed ? "var(--card-bg)" : "var(--text-color)",
                color:subscribed ? "var(--text-color)" : "var(--bg-color)",
                border:subscribed ? "1px solid var(--border-color)" : "none",
                borderRadius:24, padding:"10px 24px", fontSize:14, fontWeight:700, cursor:"pointer", transition: "all 0.2s"
            }}>
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 24, padding:"0 40px", borderBottom: "1px solid var(--border-color)", display:"flex", gap: 32 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{
              background: "none", border: "none", color: activeTab === tab ? "var(--text-color)" : "var(--text-color)",
              opacity: activeTab === tab ? 1 : 0.6,
              padding: "12px 4px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid var(--text-color)" : "2px solid transparent",
              transition: "all 0.2s"
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "32px 40px" }}>
          
          {activeTab === "Home" && (
            <div>
              {videos.length > 0 && (
                <div style={{ marginBottom: 40, display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ flex: 1.5, minWidth: 320 }}>
                    <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                      <Link href={`/watch?id=${videos[0]._id}`}>
                        {videos[0].thumbnailUrl ? <img src={videos[0].thumbnailUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : (
                          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-color)" }}>
                            <PlayIcon />
                          </div>
                        )}
                      </Link>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{videos[0].title}</h2>
                    <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 12 }}>{fmtViews(videos[0].views)} views • {new Date(videos[0].createdAt).toLocaleDateString()}</div>
                    <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {videos[0].description || "No description provided for this featured video."}
                    </p>
                    <Link href={`/watch?id=${videos[0]._id}`} style={{ display: "inline-block", marginTop: 16, color: "var(--accent-color)", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Watch Video →</Link>
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: 24, fontSize: 18, fontWeight: 800 }}>Latest Uploads</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px 16px" }}>
                {videos.slice(1, 9).map((v, i) => <VideoCard key={v._id} video={v} index={i} />)}
              </div>
            </div>
          )}

          {activeTab === "Videos" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px 16px" }}>
                {videos.map((v, i) => <VideoCard key={v._id} video={v} index={i} />)}
              </div>
              {videos.length === 0 && <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>No videos uploaded yet.</div>}
            </div>
          )}

          {activeTab === "About" && (
            <div style={{ maxWidth: 800 }}>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Description</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.8, whiteSpace: "pre-wrap" }}>
                  {creator.channelBio || creator.bio || "This creator is focus on quality safe content but hasn't updated their bio yet."}
                </p>
              </div>
              
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Stats</h3>
                <div style={{ padding: "16px 0", borderTop: "1px solid var(--border-color)", display: "flex", gap: 40 }}>
                   <div>
                     <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>Joined</div>
                     <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(creator.createdAt||Date.now()).toLocaleDateString("en-IN", { month:'short', day:'numeric', year:'numeric' })}</div>
                   </div>
                   <div>
                     <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>Total Views</div>
                     <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtViews(videos.reduce((acc, v)=>acc+(v.views||0), 0))} views</div>
                   </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      <style>{`
        .v-card:hover .v-thumb { transform: translateY(-6px); box-shadow: 0 10px 20px rgba(0,0,0,0.4); border-color: var(--accent-color); }
        .v-card:hover div:nth-child(2) { color: var(--accent-color) !important; }
      `}</style>
    </div>
  );
}

export default function ChannelPage({ params }) {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh",background:"var(--bg-color)",color:"var(--text-color)",padding:80,textAlign:"center" }}>Loading Content Pipeline...</div>}>
      <ChannelContent channelId={params.id} />
    </Suspense>
  );
}
