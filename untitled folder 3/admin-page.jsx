"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ShieldIcon, CheckIcon, WarningIcon, CrossIcon, EyeIcon } from "@/components/Icons";

const STATUS_CFG = {
  approved:     { label:"Live",         color:"#2ECC71", bg:"rgba(46,204,113,0.1)", border:"#1A7A43" },
  human_review: { label:"Human Review", color:"#F0A500", bg:"rgba(240,165,0,0.1)",  border:"#7A5200" },
  flagged:      { label:"Flagged",      color:"#F0A500", bg:"rgba(240,165,0,0.1)",  border:"#7A5200" },
  ai_scanning:  { label:"AI Scanning",  color:"#4A9EDB", bg:"rgba(74,158,219,0.1)", border:"#1A4A7A" },
  rejected:     { label:"Rejected",     color:"#E55555", bg:"rgba(229,85,85,0.1)",  border:"#7A1F1F" },
  pending:      { label:"Pending",      color:"#AAAAAA", bg:"rgba(170,170,170,0.1)",border:"#555"    },
};

const SOURCE_LABELS = {
  web_upload:"Web Upload", mobile_app:"Mobile App",
  api_partner:"API Partner", creator_studio:"Creator Studio",
};

function daysAgo(d) {
  const diff = Math.floor((Date.now()-new Date(d))/86400000);
  return diff===0?"Aaj":diff===1?"1 din pehle":`${diff} din pehle`;
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status]||STATUS_CFG.pending;
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:99,background:c.bg,border:`1px solid ${c.border}`,color:c.color,fontSize:12,fontWeight:600,whiteSpace:"nowrap" }}>
      {c.label}
    </span>
  );
}

export default function AdminDashboard() {
  const { data:session, status } = useSession();
  const router = useRouter();
  const [videos,    setVideos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filterStatus, setFilter] = useState("all");
  const [toast,     setToast]     = useState(null);
  const [selected,  setSelected]  = useState(new Set());

  // Auth check — sirf admin/moderator access kar sake
  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      if (session.user.role !== "admin" && session.user.role !== "moderator") {
        router.push("/"); return;
      }
      fetchVideos();
    }
  }, [status, session]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/videos?all=true&limit=50");
      const data = await res.json();
      setVideos(data.videos || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2500); };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch("/api/videos", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ videoId:id, action }),
      });
      if (res.ok) {
        setVideos(v => v.map(x => x._id===id ? { ...x, status: action==="approve"?"approved":"rejected" } : x));
        showToast(action==="approve"?"✓ Video approved — platform pe live ho gaya!":"✕ Video reject kar diya", action==="approve"?"success":"danger");
      }
    } catch(e) { showToast("Kuch gadbad ho gayi","danger"); }
  };

  const bulkAction = async (action) => {
    for (const id of selected) await handleAction(id, action);
    setSelected(new Set());
  };

  const filtered = videos.filter(v => {
    const ms = v.title?.toLowerCase().includes(search.toLowerCase()) || (v.uploaderName||"").toLowerCase().includes(search.toLowerCase());
    const mf = filterStatus==="all" || v.status===filterStatus;
    return ms && mf;
  });

  const counts = {
    total:    videos.length,
    review:   videos.filter(v=>v.status==="human_review").length,
    flagged:  videos.filter(v=>v.status==="flagged").length,
    approved: videos.filter(v=>v.status==="approved").length,
    rejected: videos.filter(v=>v.status==="rejected").length,
  };

  if (status === "loading") return <div style={{ minHeight:"100vh",background:"#0F0F0F",display:"flex",alignItems:"center",justifyContent:"center",color:"#AAAAAA" }}>Loading...</div>;

  return (
    <div style={{ minHeight:"100vh",background:"#0F0F0F",fontFamily:"'Roboto','Segoe UI',sans-serif",color:"#F1F1F1" }}>
      <Navbar />
      <style>{`*{box-sizing:border-box;margin:0;padding:0} @keyframes slideIn{from{transform:translateY(-12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {toast && (
        <div style={{ position:"fixed",top:68,right:20,zIndex:999,padding:"12px 20px",borderRadius:10,background:toast.type==="success"?"#0D2318":"#1A0A0A",border:`1px solid ${toast.type==="success"?"#1A7A43":"#7A1F1F"}`,color:toast.type==="success"?"#2ECC71":"#E55555",fontSize:13,fontWeight:600,animation:"slideIn 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display:"flex",paddingTop:56 }}>
        {/* Sidebar */}
        <aside style={{ position:"fixed",top:56,left:0,bottom:0,width:200,background:"#0F0F0F",borderRight:"1px solid #1a1a1a",padding:"16px 8px",zIndex:50 }}>
          <div style={{ padding:"0 12px",marginBottom:20 }}>
            <div style={{ fontSize:16,fontWeight:700 }}>सम<span style={{ color:"#2ECC71" }}>तुलन</span></div>
            <div style={{ fontSize:10,color:"#717171",letterSpacing:"0.1em",marginTop:2 }}>ADMIN PANEL</div>
          </div>

          {[
            {key:"all",      label:"Sabhi Videos",  count:counts.total},
            {key:"human_review",label:"Review Queue",count:counts.review},
            {key:"flagged",  label:"Flagged",       count:counts.flagged},
            {key:"approved", label:"Live Videos",   count:counts.approved},
            {key:"rejected", label:"Rejected",      count:counts.rejected},
          ].map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",marginBottom:2,borderRadius:10,border:"none",background:filterStatus===f.key?"#1a1a1a":"transparent",color:filterStatus===f.key?"#F1F1F1":"#AAAAAA",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:filterStatus===f.key?600:400 }}>
              {f.label}
              {f.count>0 && <span style={{ background:filterStatus===f.key?"#2ECC71":"#272727",color:filterStatus===f.key?"#071209":"#AAAAAA",borderRadius:99,padding:"1px 7px",fontSize:11,fontWeight:700 }}>{f.count}</span>}
            </button>
          ))}

          <div style={{ margin:"16px 8px 0",padding:"12px",background:"rgba(46,204,113,0.07)",border:"1px solid #1A7A43",borderRadius:10 }}>
            <div style={{ fontSize:11,color:"#2ECC71",fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:5 }}><ShieldIcon /> Moderation</div>
            <div style={{ fontSize:12,color:"#717171" }}>Review queue: <strong style={{ color:"#F0A500" }}>{counts.review + counts.flagged}</strong></div>
          </div>

          <Link href="/" style={{ display:"block",marginTop:12,padding:"10px 12px",fontSize:13,color:"#717171",borderRadius:10 }}>← Home pe jao</Link>
        </aside>

        {/* Main */}
        <main style={{ flex:1,marginLeft:200,padding:"24px 28px 60px",minWidth:0 }}>
          <div style={{ marginBottom:20 }}>
            <h1 style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Content Moderation</h1>
            <p style={{ color:"#717171",fontSize:13 }}>Videos approve karo taaki platform pe dikhe</p>
          </div>

          {/* Stats */}
          <div style={{ display:"flex",gap:12,marginBottom:24,flexWrap:"wrap" }}>
            {[
              {l:"Kul Videos",   v:counts.total,    c:"#AAAAAA"},
              {l:"Review Queue", v:counts.review+counts.flagged, c:"#F0A500"},
              {l:"Live Videos",  v:counts.approved, c:"#2ECC71"},
              {l:"Rejected",     v:counts.rejected, c:"#E55555"},
            ].map(s=>(
              <div key={s.l} style={{ flex:1,minWidth:130,background:"#1a1a1a",border:"1px solid #272727",borderRadius:12,padding:"16px 18px" }}>
                <div style={{ fontSize:11,color:"#AAAAAA",marginBottom:8 }}>{s.l.toUpperCase()}</div>
                <div style={{ fontSize:26,fontWeight:700,color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background:"#1a1a1a",border:"1px solid #272727",borderRadius:14,overflow:"hidden" }}>
            <div style={{ padding:"14px 20px",borderBottom:"1px solid #272727",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Title ya uploader search karo..."
                style={{ flex:1,minWidth:200,background:"#0F0F0F",border:"1px solid #303030",borderRadius:8,padding:"8px 12px",color:"#F1F1F1",fontSize:13,fontFamily:"inherit",outline:"none" }} />
              {selected.size>0 && (
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>bulkAction("approve")} style={{ background:"rgba(46,204,113,0.1)",border:"1px solid #1A7A43",color:"#2ECC71",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>✓ Approve ({selected.size})</button>
                  <button onClick={()=>bulkAction("reject")}  style={{ background:"rgba(229,85,85,0.08)",border:"1px solid #7A1F1F",color:"#E55555",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>✕ Reject ({selected.size})</button>
                </div>
              )}
              <button onClick={fetchVideos} style={{ background:"#272727",border:"none",color:"#AAAAAA",borderRadius:8,padding:"8px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>↻ Refresh</button>
            </div>

            {/* Table header */}
            <div style={{ display:"grid",gridTemplateColumns:"36px 2.5fr 1fr 1fr 1fr 1.4fr",padding:"10px 20px",background:"#0F0F0F",borderBottom:"1px solid #272727" }}>
              <input type="checkbox" checked={filtered.length>0&&filtered.every(v=>selected.has(v._id))} onChange={()=>{const ids=new Set(filtered.map(v=>v._id));const allSel=filtered.every(v=>selected.has(v._id));setSelected(allSel?new Set():ids);}} style={{ cursor:"pointer",accentColor:"#2ECC71" }} />
              {["Video","Uploader","Date","AI Result","Actions"].map(h=>(
                <div key={h} style={{ fontSize:11,color:"#555",letterSpacing:"0.06em",fontWeight:600 }}>{h.toUpperCase()}</div>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              <div style={{ padding:"40px 0",textAlign:"center",color:"#555" }}>Loading...</div>
            ) : filtered.length===0 ? (
              <div style={{ padding:"40px 0",textAlign:"center",color:"#555" }}>Koi video nahi mili</div>
            ) : filtered.map(v => {
              const aiCfg = STATUS_CFG[v.status]||STATUS_CFG.pending;
              return (
                <div key={v._id} style={{ display:"grid",gridTemplateColumns:"36px 2.5fr 1fr 1fr 1fr 1.4fr",padding:"14px 20px",borderBottom:"1px solid #1a1a1a",alignItems:"center",background:selected.has(v._id)?"rgba(46,204,113,0.03)":"transparent" }}>
                  <input type="checkbox" checked={selected.has(v._id)} onChange={()=>{const s=new Set(selected);s.has(v._id)?s.delete(v._id):s.add(v._id);setSelected(s);}} style={{ cursor:"pointer",accentColor:"#2ECC71" }} />

                  <div style={{ paddingRight:12 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:"#F1F1F1",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{v.title}</div>
                    <span style={{ fontSize:11,color:"#AAAAAA",background:"#272727",padding:"2px 8px",borderRadius:99 }}>{v.category||"—"}</span>
                  </div>

                  <div style={{ fontSize:12,color:"#AAAAAA" }}>{v.uploaderName||"Unknown"}</div>
                  <div style={{ fontSize:12,color:"#717171" }}>{daysAgo(v.createdAt)}</div>

                  <div>
                    <StatusBadge status={v.status} />
                    {v.ai?.confidence && <div style={{ fontSize:11,color:"#555",marginTop:4 }}>{v.ai.confidence}% confidence</div>}
                    {v.ai?.reasons?.length>0 && v.status==="flagged" && (
                      <div style={{ fontSize:11,color:"#F0A500",marginTop:4 }}>{v.ai.reasons[0]?.slice(0,40)}...</div>
                    )}
                  </div>

                  <div style={{ display:"flex",gap:6 }}>
                    {v.status!=="approved" && v.status!=="ai_scanning" && (
                      <button onClick={()=>handleAction(v._id,"approve")} style={{ background:"rgba(46,204,113,0.1)",border:"1px solid #1A7A43",color:"#2ECC71",borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                        ✓ Approve
                      </button>
                    )}
                    {v.status!=="rejected" && v.status!=="ai_scanning" && (
                      <button onClick={()=>handleAction(v._id,"reject")} style={{ background:"rgba(229,85,85,0.08)",border:"1px solid #7A1F1F",color:"#E55555",borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                        ✕ Reject
                      </button>
                    )}
                    {v.status==="approved" && (
                      <Link href={`/watch?id=${v._id}`} style={{ background:"#272727",border:"none",color:"#AAAAAA",borderRadius:7,padding:"6px 12px",fontSize:12,display:"flex",alignItems:"center",gap:4 }}>
                        <EyeIcon /> View
                      </Link>
                    )}
                    {v.status==="ai_scanning" && <span style={{ fontSize:11,color:"#555" }}>Scanning...</span>}
                  </div>
                </div>
              );
            })}

            <div style={{ padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:12,color:"#555" }}>{filtered.length} videos dikh rahe hain</span>
              <span style={{ fontSize:12,color:"#717171" }}>Approve karne ke baad homepage pe dikhenge</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
