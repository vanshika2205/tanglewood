"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { PlayIcon, LikeIcon, DislikeIcon, SaveIcon, ShareIcon, BackIcon, CheckIcon, ShieldIcon, WarningIcon, CCIcon, SettingsIcon } from "@/components/Icons";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useUI } from "@/lib/UIContext";
import VideoInfo from "@/components/VideoInfo";
import VideoDescription from "@/components/VideoDescription";
import CommentSection from "@/components/CommentSection";

const COLORS = [["#1a3a2a","#0d2318"],["#1a1a3a","#0d0d23"],["#3a1a1a","#230d0d"],["#1a2a3a","#0d1823"],["#2a1a3a","#180d23"],["#3a2a1a","#23180d"]];

function fmtViews(n) {
  if (!n) return "0";
  if(n>=1e7) return (n/1e7).toFixed(1)+"Cr";
  if(n>=1e5) return (n/1e5).toFixed(1)+"L";
  if(n>=1e3) return (n/1e3).toFixed(1)+"K";
  return String(n);
}

function CreatorAvatar({ name, src, size=36 }) {
  if (src) {
    return <img src={src} alt={name} style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,objectFit:"cover",border:"1px solid #272727" }} />;
  }
  const i = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const h = (name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
  return <div style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,background:`hsl(${h},40%,22%)`,border:`1.5px solid hsl(${h},40%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:`hsl(${h},60%,75%)` }}>{i}</div>;
}



function WatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id");
  const { uiMode, colorMode, captionsEnabled, captionSize, autoPlay: globalAutoPlay } = useUI();
  const isModern = uiMode === "modern";
  const isCyber = uiMode === "cyber";

  const [video,    setVideo]    = useState(null);
  const [related,  setRelated]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [liked,    setLiked]    = useState(false);
  const [disliked, setDisliked]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [sharedToast, setSharedToast] = useState(false);
  const [theater, setTheater] = useState(false);

  const [showCC, setShowCC] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [captionText, setCaptionText] = useState("");

  const settingsRef = useRef(null);

  useEffect(() => {
    setShowCC(captionsEnabled);
  }, [captionsEnabled]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: session, status } = useSession();
  const userRole = session?.user?.role?.toLowerCase() || "";
  const isAdminOrMod = userRole === "admin" || userRole === "moderator";
  const viewTriggered = useRef(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Check if user preferred theater mode previously? (Optional)
    const saved = localStorage.getItem("theaterMode") === "true";
    if (saved) setTheater(true);
  }, []);

  const toggleTheater = () => {
    setTheater(p => {
      const next = !p;
      localStorage.setItem("theaterMode", String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    
    fetch(`/api/videos?id=${videoId}`)
      .then(r=>r.ok?r.json():null)
      .then(data => {
        if(data?.video) {
          setVideo(data.video);
          setLikesCount(data.video.likes || 0);
          setSubscribed(data.video.isSubscribed || false);
          setLiked(data.video.isLiked || false);
          setDisliked(data.video.isDisliked || false);
          setSaved(data.video.isSaved || false);
          setCaptionText(`Safe Audio Scan: ${data.video.title}. Community verified safe.`);
        }
        if(data?.related) setRelated(data.related);
      })
      .finally(()=>setLoading(false));

    // View increment
    if (!viewTriggered.current) {
        fetch(`/api/videos/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId, action: 'view' })
        });
        viewTriggered.current = true;
    }
  }, [videoId]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleLike = async () => {
    if (status !== "authenticated") return router.push("/login");
    const prev = liked;
    setLiked(!liked);
    if (!prev) setDisliked(false);
    setLikesCount(c => prev ? c - 1 : c + 1);
    await fetch("/api/videos/interact", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ videoId, action:"like" }) });
  };

  const handleDislike = async () => {
    if (status !== "authenticated") return router.push("/login");
    const prev = disliked;
    setDisliked(!prev);
    if (!prev) {
        if(liked) setLikesCount(c => c-1);
        setLiked(false);
    }
    await fetch("/api/videos/interact", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ videoId, action:"dislike" }) });
  };

  const handleSave = async () => {
    if (status !== "authenticated") return router.push("/login");
    setSaved(!saved);
    await fetch("/api/videos/interact", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ videoId, action:"save" }) });
  };

  const handleSubscribe = async () => {
    if (status !== "authenticated") return router.push("/login");
    setSubscribed(!subscribed);
    await fetch("/api/user/subscribe", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ creatorId: video.uploader }) });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setSharedToast(true);
    setTimeout(()=>setSharedToast(false), 2000);
  };

  const handleReport = () => {
    if (status !== "authenticated") return router.push("/login");
    const reason = prompt("Report reason:");
    if(reason) {
        fetch("/api/videos/report", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ videoId, reason }) });
    }
  };
  if (!video) return <div style={{ minHeight:"100vh",background:"var(--bg-color)", color:"var(--text-color)", padding:"80px", textAlign:"center" }}>Video not found ❌</div>;

  const [c1,c2] = COLORS[(video.color||0) % COLORS.length];

  const PlayerSection = (
    <div style={{ 
        width: "100%", 
        paddingTop: theater ? "0" : "56.25%", 
        height: theater ? "min(80vh, 800px)" : "0",
        position: "relative", 
        borderRadius: theater ? 0 : "12px", 
        overflow: "hidden", 
        background: "#000",
        marginBottom: theater ? 0 : "16px", 
        boxShadow: theater ? "none" : "var(--shadow)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    }}>
      {video.fileUrl ? (
        <>
          <video 
            ref={videoRef}
            src={video.fileUrl.startsWith("http") ? video.fileUrl : `/api/videos/stream?file=${encodeURIComponent(video.fileUrl)}`} 
            poster={video.thumbnailUrl} controls autoPlay={globalAutoPlay}
            style={{ 
                width:"100%", 
                height:"100%", 
                maxHeight: "100%",
                objectFit:"contain", 
                backgroundColor:"#000",
                position: theater ? "relative" : "absolute",
                top: 0, left: 0
            }} 
          />
          
          {/* Caption Overlay */}
          {showCC && (
            <div style={{ 
                position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%)", 
                background: "rgba(0,0,0,0.8)", color: "#fff", padding: "8px 20px", borderRadius: "8px", 
                fontSize: captionSize === "small" ? "13px" : captionSize === "large" ? "20px" : "16px", 
                fontWeight: "600", textAlign: "center", maxWidth: "80%", zIndex: 10, pointerEvents: "none", 
                border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" 
            }}>
                {captionText}
            </div>
          )}

          {/* Quick Controls Overlays (Custom buttons) */}
          <div style={{ position: "absolute", right: 12, bottom: 50, display: "flex", gap: "10px", zIndex: 20 }}>
              <button 
                onClick={() => setShowCC(!showCC)} 
                title={showCC ? "Turn off Captions" : "Turn on Captions"}
                style={{ background: showCC ? "var(--accent-color)" : "rgba(0,0,0,0.6)", border: "none", borderRadius: "8px", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: showCC ? "#000" : "#fff", cursor: "pointer", transition: "all 0.2s" }}
              >
                <CCIcon />
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                title="Settings"
                style={{ background: showSettings ? "var(--accent-color)" : "rgba(0,0,0,0.6)", border: "none", borderRadius: "8px", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: showSettings ? "#000" : "#fff", cursor: "pointer", transition: "all 0.2s" }}
              >
                <SettingsIcon />
              </button>
          </div>

          {/* Settings Menu */}
          {showSettings && (
            <div ref={settingsRef} className="glass-panel" style={{ position: "absolute", right: 12, bottom: 100, width: 180, borderRadius: 12, padding: "12px", zIndex: 30, border: "1px solid var(--border-color)", background: "var(--bg-color)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, opacity: 0.5, letterSpacing: "0.05em" }}>PLAYER SETTINGS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                        <div style={{ fontSize: 11, marginBottom: 6, fontWeight: 600 }}>Playback Speed</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                            {[0.5, 1, 1.5, 2].map(speed => (
                                <button key={speed} onClick={() => setPlaybackSpeed(speed)} style={{ background: playbackSpeed === speed ? "var(--accent-color)" : "var(--card-bg)", color: playbackSpeed === speed ? "#000" : "var(--text-color)", border: "none", borderRadius: 4, padding: "4px 0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{speed}x</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <PlayIcon />
        </div>
      )}
    </div>
  );

  const InfoSection = (
    <>
      <VideoInfo 
        video={video} 
        liked={liked} disliked={disliked} saved={saved} subscribed={subscribed} 
        likesCount={likesCount}
        onLike={handleLike} onDislike={handleDislike} onSave={handleSave} 
        onSubscribe={handleSubscribe} onShare={handleShare} onReport={handleReport}
        onTheaterToggle={toggleTheater} isTheater={theater}
      />
      <VideoDescription video={video} />
      <CommentSection 
        videoId={videoId} 
        initialComments={video.comments} 
        session={session} 
        status={status} 
        isAdminOrMod={isAdminOrMod}
      />
    </>
  );

  const SidebarSection = (
    <div style={{ width: theater ? "100%" : "380px", flexShrink: 0, paddingTop: theater ? "0" : "16px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px", color: "var(--text-color)" }}>Related Videos</h3>
      {related.map(rv => {
        const [rc1,rc2] = COLORS[(rv.color||0)%COLORS.length];
        return (
          <Link key={rv._id} href={`/watch?id=${rv._id}`} style={{ textDecoration:"none" }}>
            <div 
              className="interactive-element" 
              style={{ display:"flex", gap:"10px", marginBottom:"12px", cursor:"pointer" }}
            >
              <div style={{ 
                  width:"168px", height:"94px", flexShrink:0, borderRadius:"8px", 
                  background:`linear-gradient(135deg,${rc1},${rc2})`, position:"relative", overflow:"hidden" 
              }}>
                {rv.thumbnailUrl ? <img src={rv.thumbnailUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <div style={{height:"100%", display:"flex", alignItems:"center", justifyContent:"center", opacity:0.2}}><PlayIcon /></div>}
                <div style={{ position:"absolute",bottom:4,right:4,background:"rgba(0,0,0,0.8)",color:"#fff",fontSize:11,fontWeight:700,padding:"1px 4px",borderRadius:4 }}>{rv.duration||"10:00"}</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"14px", fontWeight:"600", color:"var(--text-color)", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", lineHeight:1.3 }}>{rv.title}</div>
                <div style={{ fontSize:"12px", color:"var(--text-color)", opacity:0.6, marginTop:4 }}>{rv.uploaderName} {rv.verified && <CheckIcon />}</div>
                <div style={{ fontSize:"12px", color:"var(--text-color)", opacity:0.5 }}>{rv.views || 0} views</div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background: "var(--bg-color)", color:"var(--text-color)", fontFamily:"'Inter', sans-serif" }}>
      <Navbar />

      {sharedToast && (
         <div className="glass-panel" style={{ position:"fixed",top:68,right:20,zIndex:999,padding:"12px 24px",borderRadius:10,color:"var(--accent-color)",fontSize:14,fontWeight:700, boxShadow:"var(--shadow)" }}>
           📋 Link Copied!
         </div>
      )}

      <div style={{ paddingTop: 56 }}>
        {theater ? (
          <>
            {PlayerSection}
            <div className="theater-bottom">
              <div style={{ flex: 1, minWidth: 0, paddingBottom: "60px" }}>{InfoSection}</div>
              {SidebarSection}
            </div>
          </>
        ) : (
          <div className="watch-container">
            <div style={{ flex: 1, minWidth: 0, paddingBottom: "60px" }}>
              {PlayerSection}
              {InfoSection}
            </div>
            {SidebarSection}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={null}>
      <WatchPageContent />
    </Suspense>
  );
}
