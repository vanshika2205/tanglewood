import { useState } from "react";

function fmtViews(n) {
  if (!n) return "0";
  if(n>=1e7) return (n/1e7).toFixed(1)+"Cr";
  if(n>=1e5) return (n/1e5).toFixed(1)+"L";
  if(n>=1e3) return (n/1e3).toFixed(1)+"K";
  return String(n);
}

export default function VideoDescription({ video }) {
  const [showMore, setShowMore] = useState(false);
  const daysAgoNum = Math.floor((Date.now() - new Date(video.createdAt)) / 86400000);

  return (
    <div 
      className="glass-panel" 
      style={{ 
        borderRadius: "12px", padding: "12px 16px", marginBottom: "24px", 
        border: "1px solid var(--border-color)", background: "var(--card-bg)" 
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "var(--text-color)" }}>
        {fmtViews(video.views)} views • {daysAgoNum <= 0 ? "Today" : `${daysAgoNum} days ago`}
      </div>
      <div 
        style={{ 
          fontSize: "14px", color: "var(--text-color)", opacity: 0.9, lineHeight: "1.6", 
          whiteSpace: "pre-line", maxHeight: showMore ? "none" : "80px", overflow: "hidden" 
        }}
      >
        {video.description || "No description provided."}
      </div>
      <button 
        onClick={() => setShowMore(p => !p)} 
        style={{ 
          background: "none", border: "none", color: "var(--text-color)", opacity: 0.7, 
          fontSize: "14px", fontWeight: "700", cursor: "pointer", marginTop: "8px" 
        }}
      >
        {showMore ? "Show less" : "...more"}
      </button>
    </div>
  );
}
