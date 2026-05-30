"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CheckIcon, PlayIcon, ShieldIcon } from "@/components/Icons";
import { useUI } from "@/lib/UIContext";

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

  if (loading) return <div style={{ minHeight:"100vh",background:"var(--bg-color)", color:"var(--text-color)", padding:"80px", textAlign:"center" }}>Loading Channel...</div>;
  if (!creator) return <div style={{ minHeight:"100vh",background:"var(--bg-color)", color:"var(--text-color)", padding:"80px", textAlign:"center" }}>Channel not found ❌</div>;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-color)", color:"var(--text-color)", fontFamily:"'Inter', sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin:"0 auto", paddingTop: 56 }}>
        {/* Banner */}
        <div style={{ width:"100%", height: 220, background:"linear-gradient(135deg, var(--accent-color), var(--bg-color))", opacity:0.8, borderBottom: "1px solid var(--border-color)" }}></div>

        {/* Channel Info */}
        <div className="glass-panel" style={{ marginTop: "-60px", marginInline: "40px", padding:"32px 40px", display:"flex", alignItems:"center", gap: 32, borderRadius: "24px", position: "relative", zIndex: 10 }}>
          <CreatorAvatar name={creator.channelName || creator.name} size={130} />
          <div style={{ flex: 1 }}>
            <h1 className="gnlow-text" style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, display:"flex", alignItems:"center", gap: 8 }}>
              {creator.channelName || creator.name} <span style={{ color:"var(--accent-color)", fontSize:20 }}><CheckIcon /></span>
            </h1>
            <div style={{ color:"var(--text-color)", opacity: 0.6, fontSize: 15, marginBottom: 12 }}>
              <span style={{color:"var(--accent-color)", fontWeight:700}}>{creator.subscribers||0}</span> subscribers 
              <span style={{margin:"0 10px", opacity:0.3}}>|</span> 
              <span style={{color:"var(--accent-color)", fontWeight:700}}>{videos.length}</span> videos
            </div>
            <div style={{ color:"var(--text-color)", opacity: 0.8, fontSize: 14, maxWidth: 650, lineHeight: 1.6, marginBottom:20 }}>
              {creator.channelBio || creator.bio || "This creator hasn't written a bio yet."}
            </div>
            <button onClick={handleSubscribe} style={{ 
                background:subscribed ? "var(--glass-bg)" : "var(--accent-color)",
                color:subscribed ? "var(--text-color)" : (colorMode === "dark" ? "#000" : "#FFF"),
                border:subscribed ? "1px solid var(--border-color)" : "none",
                borderRadius:12,padding:"10px 28px",fontSize:14,fontWeight:700,cursor:"pointer", transition: "all 0.2s",
                boxShadow: subscribed ? "none" : "var(--shadow)"
            }}>
              {subscribed ? "Subscribed" : "Subscribe Now"}
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div style={{ padding:"40px" }}>
          <h2 className="gnlow-text" style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, borderLeft: "4px solid var(--accent-color)", paddingLeft: 12 }}>Studio Uploads</h2>
          {videos.length === 0 ? (
            <div style={{ padding:"60px 0", textAlign:"center", color:"var(--text-color)", opacity:0.4 }}>No live videos yet in this studio.</div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"32px 20px" }}>
              {videos.map((video, index) => {
                const [c1,c2] = COLORS[(video.color||index) % COLORS.length];
                return (
                  <Link key={video._id} href={`/watch?id=${video._id}`} style={{ textDecoration:"none" }}>
                    <div className="v-card" style={{ cursor:"pointer" }}>
                      <div className="v-thumb" style={{ position:"relative",width:"100%",paddingTop:"56.25%",background:`linear-gradient(135deg,${c1},${c2})`,borderRadius:16,overflow:"hidden",marginBottom:12, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", border:"1px solid var(--border-color)" }}>
                        {video.thumbnailUrl && (
                          <img src={video.thumbnailUrl} alt={video.title} style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover" }} />
                        )}
                        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.25)",fontSize:40 }}>
                          <PlayIcon />
                        </div>
                        <div style={{ position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.85)",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:6 }}>
                          {video.duration||"--:--"}
                        </div>
                        <div style={{ position:"absolute",top:8,left:8,background:"var(--glass-bg)", border:"1px solid var(--accent-color)", color:"var(--accent-color)",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:6,display:"flex",alignItems:"center",gap:4, backdropFilter: "blur(4px)" }}>
                          <ShieldIcon /> SAFE
                        </div>
                      </div>
                      <div style={{ fontSize:15,fontWeight:700,color:"var(--text-color)",lineHeight:1.4,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
                        {video.title}
                      </div>
                      <div style={{ fontSize:12,color:"var(--text-color)",opacity:0.5 }}>{fmtViews(video.views)} views • {new Date(video.createdAt).toLocaleDateString()}</div>
                    </div>
                  </Link>
                );
              })}
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
