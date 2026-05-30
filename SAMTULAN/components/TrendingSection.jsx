import Link from "next/link";
import { PlayIcon, CheckIcon } from "./Icons";

const COLORS = [["#1a3a2a","#0d2318"],["#1a1a3a","#0d0d23"],["#3a1a1a","#230d0d"],["#1a2a3a","#0d1823"]];

export default function TrendingSection({ videos }) {
  if (!videos || videos.length === 0) return null;

  return (
    <div style={{ marginBottom: "40px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-color)" }}>Trending Now</h2>
        <span style={{ fontSize: "13px", color: "var(--accent-color)", fontWeight: "600" }}>#Popular</span>
      </div>
      
      <div style={{ 
        display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "10px", 
        scrollbarWidth: "none", msOverflowStyle: "none" 
      }}>
        {videos.map((v, i) => {
          const [c1, c2] = COLORS[i % COLORS.length];
          return (
            <Link key={v._id} href={`/watch?id=${v._id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
              <div style={{ width: "220px" }}>
                <div style={{ 
                  position: "relative", width: "100%", height: "124px", 
                  background: v.thumbnailUrl ? "#000" : `linear-gradient(135deg,${c1},${c2})`, 
                  borderRadius: "12px", overflow: "hidden", marginBottom: "8px",
                  border: "1px solid var(--border-color)"
                }}>
                  {v.thumbnailUrl && <img src={v.thumbnailUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.8)", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "1px 4px", borderRadius: "3px" }}>{v.duration || "10:00"}</div>
                </div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-color)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3" }}>
                  {v.title}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-color)", opacity: 0.6, marginTop: "4px" }}>
                  {v.uploaderName} {v.verified && <CheckIcon />}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
