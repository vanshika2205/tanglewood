import Link from "next/link";
import { LikeIcon, DislikeIcon, ShareIcon, SaveIcon, WarningIcon, CheckIcon, TheaterIcon } from "./Icons";
import { useUI } from "@/lib/UIContext";

function fmtViews(n) {
  if (!n) return "0";
  if(n>=1e7) return (n/1e7).toFixed(1)+"Cr";
  if(n>=1e5) return (n/1e5).toFixed(1)+"L";
  if(n>=1e3) return (n/1e3).toFixed(1)+"K";
  return String(n);
}

function CreatorAvatar({ name, src, size=36 }) {
  if (src) {
    return <img src={src} alt={name} style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,objectFit:"cover",border:"1px solid var(--border-color)" }} />;
  }
  const i = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const h = (name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
  return <div style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,background:`hsl(${h},40%,22%)`,border:`1.5px solid hsl(${h},40%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:`hsl(${h},60%,75%)` }}>{i}</div>;
}

export default function VideoInfo({ 
  video, liked, disliked, saved, subscribed, likesCount,
  onLike, onDislike, onSave, onSubscribe, onShare, onReport,
  onTheaterToggle, isTheater
}) {
  const { colorMode } = useUI();
  
  return (
    <div style={{ marginTop: "16px" }}>
      <h1 className="gnlow-text" style={{ fontSize: "20px", fontWeight: "700", lineHeight: "1.4", marginBottom: "12px", color: "var(--text-color)" }}>
        {video.title}
      </h1>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", paddingBottom: "14px" }}>
        {/* Left: Channel Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href={`/channel/${video.uploader?._id || video.uploader}`} style={{textDecoration:"none"}}>
            <CreatorAvatar name={video.uploaderName} src={video.uploaderAvatar} size={40} />
          </Link>
          <div style={{ marginRight: "8px" }}>
            <Link href={`/channel/${video.uploader?._id || video.uploader}`} style={{textDecoration:"none", color:"var(--text-color)"}}>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-color)" }}>
                {video.uploaderName} {video.verified && <span style={{ color: "var(--accent-color)" }}><CheckIcon /></span>}
              </div>
            </Link>
            <div style={{ fontSize: "12px", color: "var(--text-color)", opacity: 0.6 }}>Verified Creator</div>
          </div>
          <button 
            onClick={onSubscribe} 
            style={{ 
              background: subscribed ? "var(--card-bg)" : "var(--text-color)",
              color: subscribed ? "var(--text-color)" : "var(--bg-color)",
              border: subscribed ? "1px solid var(--border-color)" : "none",
              borderRadius: "20px", padding: "8px 18px", fontSize: "14px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" 
            }}
          >
            {subscribed ? "Subscribed" : "Subscribe"}
          </button>
        </div>
        
        {/* Right: Interaction Buttons (Pill shape) */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "var(--card-bg)", borderRadius: "20px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
            <button 
              onClick={onLike} 
              style={{ 
                background: "none", border: "none", borderRight: "1px solid var(--border-color)", 
                color: liked ? "var(--accent-color)" : "var(--text-color)", 
                padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600" 
              }}
            >
              <LikeIcon /> {fmtViews(likesCount)}
            </button>
            <button 
              onClick={onDislike} 
              style={{ 
                background: "none", border: "none", 
                color: disliked ? "var(--accent-color)" : "var(--text-color)", 
                padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "14px" 
              }}
            >
              <DislikeIcon />
            </button>
          </div>
          
          <button 
            onClick={onShare} 
            style={{ 
              background: "var(--card-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)", 
              borderRadius: "20px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" 
            }}
          >
            <ShareIcon /> Share
          </button>
          
          <button 
            onClick={onSave} 
            style={{ 
              background: "var(--card-bg)", border: "1px solid var(--border-color)", 
              color: saved ? "var(--accent-color)" : "var(--text-color)", 
              borderRadius: "20px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" 
            }}
          >
            <SaveIcon /> {saved ? "Saved" : "Save"}
          </button>
          
          <button 
            onClick={onReport} 
            style={{ 
              background: "rgba(229,85,85,0.1)", border: "1px solid rgba(229,85,85,0.2)", color: "#E55555", 
              borderRadius: "20px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" 
            }}
          >
            <WarningIcon /> Report
          </button>

          <button 
            onClick={onTheaterToggle} 
            title="Theater Mode"
            style={{ 
              background: isTheater ? "var(--accent-color)" : "var(--card-bg)", 
              border: "1px solid var(--border-color)", color: isTheater ? "#000" : "var(--text-color)",
              borderRadius: "20px", padding: "8px 14px", display: "flex", alignItems: "center", cursor: "pointer", transition: "all 0.2s" 
            }}
          >
            <TheaterIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
