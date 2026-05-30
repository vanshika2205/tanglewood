import { useState } from "react";
import Link from "next/link";
import { PlayIcon, CheckIcon, ShieldIcon } from "./Icons";

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

export default function VideoCard({ video, index }) {
  const [hov, setHov] = useState(false);
  const colorIdx = video.color ?? (index % COLORS.length);
  const [c1,c2] = COLORS[colorIdx % COLORS.length];

  return (
    <Link href={`/watch?id=${video._id}`} style={{ textDecoration:"none" }}>
      <div 
        onMouseEnter={()=>setHov(true)} 
        onMouseLeave={()=>setHov(false)} 
        style={{ 
          cursor:"pointer",
          width: "100%",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        <div style={{ 
          position:"relative", width:"100%", paddingTop:"56.25%", 
          background:video.thumbnailUrl?"#000":`linear-gradient(135deg,${c1},${c2})`, 
          borderRadius: 12, overflow:"hidden", marginBottom:12, 
          transition:"all 0.3s", transform: hov ? "scale(1.03)" : "scale(1)",
          boxShadow: hov ? "0 10px 20px rgba(0,0,0,0.4)" : "none",
          border: hov ? "1px solid var(--accent-color)" : "1px solid var(--border-color)"
        }}>
          {video.thumbnailUrl && (
            <img src={video.thumbnailUrl} alt={video.title} style={{ position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover", opacity: hov ? 0.9 : 1 }} />
          )}
          
          <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",fontSize:40, transition:"opacity 0.2s", opacity: hov ? 1 : 0 }}>
            <PlayIcon />
          </div>

          <div style={{ position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.8)",color:"#fff",fontSize:12,fontWeight:700,padding:"2px 6px",borderRadius:4 }}>
            {video.duration||"10:00"}
          </div>

          <div style={{ position:"absolute",top:8,left:8,background:"var(--glass-bg)",border:"1px solid var(--accent-color)",color:"var(--accent-color)",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:6,display:"flex",alignItems:"center",gap:4, backdropFilter:"blur(8px)" }}>
            <ShieldIcon /> SAFE
          </div>
        </div>

        <div style={{ display:"flex",gap:12, padding: "0 4px" }}>
          <CreatorAvatar name={video.uploaderName||"Creator"} src={video.uploaderAvatar} size={36} />
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ 
              fontSize:15, fontWeight:600, color:"var(--text-color)", lineHeight:1.3, marginBottom:4, 
              display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" 
            }}>
              {video.title}
            </div>
            <div style={{ fontSize:13, color:"var(--text-color)", opacity:0.6, display:"flex", alignItems:"center", gap:4 }}>
              {video.uploaderName} {video.verified && <span style={{ color:"var(--accent-color)" }}><CheckIcon /></span>}
            </div>
            <div style={{ fontSize:13, color:"var(--text-color)", opacity:0.6, marginTop:2 }}>
              {fmtViews(video.views)} views • {daysAgo(video.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
