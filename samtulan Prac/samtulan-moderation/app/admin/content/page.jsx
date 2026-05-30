"use client";
import { useState } from "react";

const C = {
  bg: "#0A0F0D",
  surface: "#111714",
  surfaceHover: "#161D19",
  border: "#1E2B24",
  borderMid: "#2A3D30",
  accent: "#2ECC71",
  accentDim: "#1A7A43",
  accentGlow: "rgba(46,204,113,0.1)",
  text: "#E8F0EB",
  textMuted: "#6B8C76",
  textDim: "#3D5447",
  danger: "#E55555",
  dangerDim: "#7A1F1F",
  warn: "#F0A500",
  warnDim: "#7A5200",
  info: "#4A9EDB",
  infoDim: "#1A4A7A",
};

// Source options
const SOURCES = ["YouTube Import", "Direct Upload", "Mobile App", "API Partner", "Web Upload", "Creator Studio"];

const SOURCE_STYLE = {
  "YouTube Import":  { bg: "#1a0a0a", border: "#8B0000", color: "#FF6B6B", icon: "▶" },
  "Direct Upload":   { bg: "#0a0f1a", border: "#1A4A7A", color: "#4A9EDB", icon: "⬆" },
  "Mobile App":      { bg: "#0f0a1a", border: "#4A1A7A", color: "#9B6BFF", icon: "📱" },
  "API Partner":     { bg: "#0a1a14", border: "#1A5A3A", color: "#2ECC71", icon: "⚙" },
  "Web Upload":      { bg: "#1a140a", border: "#7A4A1A", color: "#F0A500", icon: "🌐" },
  "Creator Studio":  { bg: "#0a1518", border: "#1A5060", color: "#4ECDC4", icon: "🎬" },
};

const AI_STATUS = {
  "Auto-Approved": { bg: "rgba(46,204,113,0.1)", border: "#1A7A43", color: "#2ECC71", dot: "#2ECC71" },
  "Flagged":       { bg: "rgba(240,165,0,0.1)",  border: "#7A5200", color: "#F0A500", dot: "#F0A500" },
  "Scanning":      { bg: "rgba(74,158,219,0.1)", border: "#1A4A7A", color: "#4A9EDB", dot: "#4A9EDB" },
  "Rejected":      { bg: "rgba(229,85,85,0.1)",  border: "#7A1F1F", color: "#E55555", dot: "#E55555" },
};

const PRIORITY = {
  High:   { bg: "rgba(229,85,85,0.12)",  color: "#E55555" },
  Medium: { bg: "rgba(240,165,0,0.12)",  color: "#F0A500" },
  Low:    { bg: "rgba(46,204,113,0.12)", color: "#2ECC71" },
};

const INITIAL_VIDEOS = [
  { id: 1, title: "Advanced Productivity Hacks",  uploader: "Ethan Bennett", date: "2024-07-26", priority: "High",   aiStatus: "Auto-Approved", source: "Creator Studio",  thumb: "🎯", selected: false },
  { id: 2, title: "Beginner's Guide to Python",   uploader: "Liam Carter",   date: "2024-07-25", priority: "Medium", aiStatus: "Auto-Approved", source: "Web Upload",      thumb: "🐍", selected: false },
  { id: 3, title: "Learn Public Speaking",        uploader: "Olivia Hayes",  date: "2024-07-25", priority: "Medium", aiStatus: "Flagged",       source: "Mobile App",      thumb: "🎤", selected: false },
  { id: 4, title: "Effective Study Techniques",   uploader: "Alex Turner",   date: "2024-07-24", priority: "Low",    aiStatus: "Scanning",      source: "Direct Upload",   thumb: "📚", selected: false },
  { id: 5, title: "Morning Yoga for Beginners",   uploader: "Priya Sharma",  date: "2024-07-24", priority: "Low",    aiStatus: "Auto-Approved", source: "YouTube Import",  thumb: "🧘", selected: false },
  { id: 6, title: "DIY Home Decor Ideas",         uploader: "Neha Gupta",    date: "2024-07-23", priority: "Medium", aiStatus: "Flagged",       source: "API Partner",     thumb: "🏠", selected: false },
];

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: "20px 22px", flex: 1, minWidth: 160,
    }}>
      <div style={{ color: C.textMuted, fontSize: 12, letterSpacing: "0.08em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: color || C.accent, letterSpacing: "-0.03em" }}>{value}</div>
      <div style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function SourceBadge({ source }) {
  const s = SOURCE_STYLE[source] || SOURCE_STYLE["Direct Upload"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 6,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color, fontSize: 11, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 10 }}>{s.icon}</span>
      {source}
    </span>
  );
}

function AiStatusBadge({ status }) {
  const s = AI_STATUS[status] || AI_STATUS["Scanning"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 99,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color, fontSize: 12, fontWeight: 600,
    }}>
      {status === "Scanning"
        ? <span style={{ fontSize: 10, animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span>
        : <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0, display: "inline-block" }} />
      }
      {status}
    </span>
  );
}

export default function SamtulanAdminDashboard() {
  const [videos, setVideos] = useState(INITIAL_VIDEOS);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("All");
  const [filterAI, setFilterAI] = useState("All");
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleApprove = (id) => {
    setVideos(v => v.filter(x => x.id !== id));
    showToast("✓ Video approved & published to platform", "success");
  };

  const handleReject = (id) => {
    setVideos(v => v.filter(x => x.id !== id));
    showToast("✕ Video rejected & creator notified", "danger");
  };

  const toggleSelect = (id) => setVideos(v => v.map(x => x.id === id ? { ...x, selected: !x.selected } : x));
  const toggleAll = () => {
    const allSel = filtered.every(x => x.selected);
    const ids = new Set(filtered.map(x => x.id));
    setVideos(v => v.map(x => ids.has(x.id) ? { ...x, selected: !allSel } : x));
  };

  const bulkApprove = () => {
    const ids = new Set(videos.filter(x => x.selected).map(x => x.id));
    setVideos(v => v.filter(x => !ids.has(x.id)));
    showToast(`✓ ${ids.size} videos approved`, "success");
  };

  const bulkReject = () => {
    const ids = new Set(videos.filter(x => x.selected).map(x => x.id));
    setVideos(v => v.filter(x => !ids.has(x.id)));
    showToast(`✕ ${ids.size} videos rejected`, "danger");
  };

  const filtered = videos.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.uploader.toLowerCase().includes(search.toLowerCase());
    const matchSource = filterSource === "All" || v.source === filterSource;
    const matchAI = filterAI === "All" || v.aiStatus === filterAI;
    return matchSearch && matchSource && matchAI;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const selectedCount = videos.filter(x => x.selected).length;
  const flaggedCount = videos.filter(x => x.aiStatus === "Flagged").length;

  const inp = {
    background: C.bg, border: `1px solid ${C.borderMid}`,
    borderRadius: 8, padding: "8px 12px",
    color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'DM Mono', monospace", color: C.text,
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 999,
          padding: "12px 20px", borderRadius: 10,
          background: toast.type === "success" ? "#0D2318" : "#1A0A0A",
          border: `1px solid ${toast.type === "success" ? C.accentDim : C.dangerDim}`,
          color: toast.type === "success" ? C.accent : C.danger,
          fontSize: 13, fontWeight: 600,
          animation: "slideIn 0.3s ease",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>{toast.msg}</div>
      )}

      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Sidebar */}
        <div style={{
          width: 200, background: C.surface, borderRight: `1px solid ${C.border}`,
          padding: "24px 0", flexShrink: 0, display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "0 20px", marginBottom: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              सम<span style={{ color: C.accent }}>तुलन</span>
            </div>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: "0.1em", marginTop: 2 }}>ADMIN PANEL</div>
          </div>
          {["Dashboard", "Content", "Users", "Analytics", "Monetization", "Settings"].map((item) => (
            <div key={item} style={{
              padding: "10px 20px", fontSize: 13,
              color: item === "Content" ? C.accent : C.textMuted,
              background: item === "Content" ? C.accentGlow : "transparent",
              borderLeft: item === "Content" ? `2px solid ${C.accent}` : "2px solid transparent",
              cursor: "pointer",
            }}>{item}</div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: "32px 28px", overflowY: "auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
              Content Moderation Dashboard
            </h1>
            <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>
              AI-checked content awaiting human review
            </p>
          </div>

          {/* Stat cards */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="AI ACCURACY" value="98.5%" sub="AI vs human match rate" color={C.accent} />
            <StatCard label="REVIEW EFFICIENCY" value="+25%" sub="Reviews per hour" color={C.info} />
            <StatCard label="FLAGGED CONTENT" value={flaggedCount} sub="Needs manual review" color={C.warn} />
            <StatCard label="QUEUE TOTAL" value={videos.length} sub="Pending approval" color={C.textMuted} />
          </div>

          {/* Queue card */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, overflow: "hidden",
          }}>
            {/* Queue header */}
            <div style={{
              padding: "18px 22px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Review Queue</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  {filtered.length} items remaining
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedCount > 0 && (
                  <>
                    <button onClick={bulkApprove} style={{
                      background: C.accentGlow, border: `1px solid ${C.accentDim}`,
                      color: C.accent, borderRadius: 8, padding: "7px 14px",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>✓ Bulk Approve ({selectedCount})</button>
                    <button onClick={bulkReject} style={{
                      background: "rgba(229,85,85,0.08)", border: `1px solid ${C.dangerDim}`,
                      color: C.danger, borderRadius: 8, padding: "7px 14px",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>✕ Bulk Reject ({selectedCount})</button>
                  </>
                )}
                {flaggedCount > 0 && (
                  <button onClick={() => setFilterAI("Flagged")} style={{
                    background: "rgba(240,165,0,0.08)", border: `1px solid ${C.warnDim}`,
                    color: C.warn, borderRadius: 8, padding: "7px 14px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>⚑ Flagged ({flaggedCount})</button>
                )}
              </div>
            </div>

            {/* Filters row */}
            <div style={{
              padding: "14px 22px", borderBottom: `1px solid ${C.border}`,
              display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
            }}>
              <input
                style={{ ...inp, flex: 1, minWidth: 180 }}
                placeholder="🔍  Search by title or uploader…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
              {/* Source filter — the new addition */}
              <select style={{ ...inp, cursor: "pointer" }}
                value={filterSource}
                onChange={e => { setFilterSource(e.target.value); setPage(1); }}>
                <option value="All">All Sources</option>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
              {/* AI status filter */}
              <select style={{ ...inp, cursor: "pointer" }}
                value={filterAI}
                onChange={e => { setFilterAI(e.target.value); setPage(1); }}>
                <option value="All">All AI Status</option>
                <option>Auto-Approved</option>
                <option>Flagged</option>
                <option>Scanning</option>
                <option>Rejected</option>
              </select>
            </div>

            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "40px 2fr 1.2fr 1fr 1fr 1.3fr 0.8fr 1.4fr",
              padding: "10px 22px",
              borderBottom: `1px solid ${C.border}`,
              background: C.bg,
            }}>
              <div>
                <input type="checkbox"
                  checked={filtered.length > 0 && filtered.every(x => x.selected)}
                  onChange={toggleAll}
                  style={{ cursor: "pointer", accentColor: C.accent }}
                />
              </div>
              {["Video", "Uploader", "Date", "Priority", "Source", "AI Status", "Actions"].map(h => (
                <div key={h} style={{ fontSize: 11, color: C.textDim, letterSpacing: "0.08em", fontWeight: 600 }}>
                  {h.toUpperCase()}
                </div>
              ))}
            </div>

            {/* Rows */}
            {paginated.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.textDim, fontSize: 14 }}>
                No videos matching filters
              </div>
            ) : paginated.map((v, i) => (
              <div key={v.id} style={{
                display: "grid",
                gridTemplateColumns: "40px 2fr 1.2fr 1fr 1fr 1.3fr 0.8fr 1.4fr",
                padding: "14px 22px",
                borderBottom: i < paginated.length - 1 ? `1px solid ${C.border}` : "none",
                alignItems: "center",
                background: v.selected ? "rgba(46,204,113,0.04)" : "transparent",
                transition: "background 0.15s",
              }}>
                {/* Checkbox */}
                <div>
                  <input type="checkbox" checked={v.selected} onChange={() => toggleSelect(v.id)}
                    style={{ cursor: "pointer", accentColor: C.accent }} />
                </div>

                {/* Video */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 32, borderRadius: 6,
                    background: C.border, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>{v.thumb}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v.title}</span>
                </div>

                {/* Uploader */}
                <div style={{ fontSize: 12, color: C.textMuted }}>{v.uploader}</div>

                {/* Date */}
                <div style={{ fontSize: 12, color: C.textDim }}>{v.date}</div>

                {/* Priority */}
                <div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: PRIORITY[v.priority]?.bg,
                    color: PRIORITY[v.priority]?.color,
                  }}>{v.priority}</span>
                </div>

                {/* Source — NEW COLUMN */}
                <div><SourceBadge source={v.source} /></div>

                {/* AI Status */}
                <div><AiStatusBadge status={v.aiStatus} /></div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  {v.aiStatus !== "Scanning" && (
                    <>
                      <button onClick={() => handleApprove(v.id)} style={{
                        background: C.accentGlow, border: `1px solid ${C.accentDim}`,
                        color: C.accent, borderRadius: 7, padding: "5px 12px",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "opacity 0.15s",
                      }}>Approve</button>
                      <button onClick={() => handleReject(v.id)} style={{
                        background: "rgba(229,85,85,0.08)", border: `1px solid ${C.dangerDim}`,
                        color: C.danger, borderRadius: 7, padding: "5px 12px",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}>Reject</button>
                    </>
                  )}
                  {v.aiStatus === "Scanning" && (
                    <span style={{ fontSize: 11, color: C.textDim }}>Awaiting AI…</span>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div style={{
              padding: "14px 22px", borderTop: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: C.textDim }}>
                Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: C.border, border: "none",
                  color: C.textMuted, cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.4 : 1, fontSize: 14,
                }}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 30, height: 30, borderRadius: 7,
                    background: p === page ? C.accent : C.border,
                    border: "none", color: p === page ? "#071209" : C.textMuted,
                    cursor: "pointer", fontWeight: p === page ? 700 : 400, fontSize: 13,
                  }}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: C.border, border: "none",
                  color: C.textMuted, cursor: page === totalPages ? "not-allowed" : "pointer",
                  opacity: page === totalPages ? 0.4 : 1, fontSize: 14,
                }}>›</button>
              </div>
            </div>
          </div>

          {/* Source breakdown strip */}
          <div style={{
            marginTop: 16,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "14px 22px",
            display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center",
          }}>
            <span style={{ fontSize: 11, color: C.textDim, letterSpacing: "0.1em" }}>SOURCE BREAKDOWN</span>
            {SOURCES.map(src => {
              const count = videos.filter(v => v.source === src).length;
              if (!count) return null;
              return (
                <div key={src} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                  onClick={() => setFilterSource(src)}>
                  <SourceBadge source={src} />
                  <span style={{ fontSize: 12, color: C.textMuted }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}