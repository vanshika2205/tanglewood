"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ShieldIcon, CheckIcon, WarningIcon, CrossIcon, EyeIcon, SearchIcon } from "@/components/Icons";

const SOURCE_STYLE = {
  "web_upload":     { color:"#4A9EDB", label:"Web Upload"     },
  "mobile_app":     { color:"#9B6BFF", label:"Mobile App"     },
  "api_partner":    { color:"#2ECC71", label:"API Partner"    },
  "creator_studio": { color:"#4ECDC4", label:"Creator Studio" },
  "youtube_import": { color:"#FF6B6B", label:"YouTube Import" },
};
const AI_STATUS = {
  approved:     { color:"#2ECC71", bg:"rgba(46,204,113,0.1)",  border:"#1A7A43", label:"Auto-Approved" },
  flagged:      { color:"#F0A500", bg:"rgba(240,165,0,0.1)",   border:"#7A5200", label:"Flagged"       },
  ai_scanning:  { color:"#4A9EDB", bg:"rgba(74,158,219,0.1)",  border:"#1A4A7A", label:"Scanning"      },
  human_review: { color:"#F0A500", bg:"rgba(240,165,0,0.1)",   border:"#7A5200", label:"Review"        },
  rejected:     { color:"#E55555", bg:"rgba(229,85,85,0.1)",   border:"#7A1F1F", label:"Rejected"      },
  pending:      { color:"#AAAAAA", bg:"rgba(170,170,170,0.1)", border:"#555",    label:"Pending"       },
};

const DEMO = [
  { _id:"1", title:"Advanced Productivity Hacks", uploaderName:"Ethan Bennett", createdAt:new Date(Date.now()-2*86400000), status:"human_review", ai:{verdict:"approved",confidence:94},  source:"creator_studio", category:"Education" },
  { _id:"2", title:"Beginner's Guide to Python",  uploaderName:"Liam Carter",   createdAt:new Date(Date.now()-3*86400000), status:"human_review", ai:{verdict:"approved",confidence:91},  source:"web_upload",     category:"Education" },
  { _id:"3", title:"Learn Public Speaking",        uploaderName:"Olivia Hayes",  createdAt:new Date(Date.now()-3*86400000), status:"flagged",      ai:{verdict:"flagged", confidence:62},  source:"mobile_app",     category:"Education" },
  { _id:"4", title:"Effective Study Techniques",  uploaderName:"Alex Turner",   createdAt:new Date(Date.now()-4*86400000), status:"ai_scanning",  ai:null,                                source:"api_partner",    category:"Education" },
  { _id:"5", title:"Morning Yoga Routine",         uploaderName:"Priya Sharma",  createdAt:new Date(Date.now()-4*86400000), status:"human_review", ai:{verdict:"approved",confidence:97},  source:"web_upload",     category:"Sports"    },
  { _id:"6", title:"DIY Home Decor Ideas",         uploaderName:"Neha Gupta",   createdAt:new Date(Date.now()-5*86400000), status:"flagged",      ai:{verdict:"flagged", confidence:55},  source:"mobile_app",     category:"DIY"       },
];

function daysAgo(d) { const diff=Math.floor((Date.now()-new Date(d))/86400000); return diff===0?"Today":diff===1?"Yesterday":`${diff} days ago`; }

export default function AdminDashboard() {
  const [videos,    setVideos]    = useState(DEMO);
  const [search,    setSearch]    = useState("");
  const [filterSrc, setFilterSrc] = useState("all");
  const [filterAI,  setFilterAI]  = useState("all");
  const [selected,  setSelected]  = useState(new Set());
  const [toast,     setToast]     = useState(null);

  useEffect(()=>{
    fetch("/api/videos?limit=50").then(r=>r.ok?r.json():null).then(d=>{
      if(d?.videos?.length>0) setVideos(d.videos);
    }).catch(()=>{});
  },[]);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),2500); };

  const handleAction = async (id, action) => {
    try {
      await fetch("/api/videos", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ videoId:id, action }) });
    } catch {}
    setVideos(v=>v.filter(x=>x._id!==id));
    showToast(action==="approve"?"✓ Video approved & published":"✕ Video rejected & creator notified", action==="approve"?"success":"danger");
  };

  const bulkAction = (action) => {
    selected.forEach(id => handleAction(id, action));
    setSelected(new Set());
  };

  const filtered = videos.filter(v=>{
    const ms = v.title.toLowerCase().includes(search.toLowerCase()) || (v.uploaderName||"").toLowerCase().includes(search.toLowerCase());
    const mSrc = filterSrc==="all" || v.source===filterSrc;
    const mAI  = filterAI==="all"  || v.status===filterAI;
    return ms && mSrc && mAI;
  });

  const flaggedCount   = videos.filter(v=>v.status==="flagged").length;
  const scanningCount  = videos.filter(v=>v.status==="ai_scanning").length;
  const reviewCount    = videos.filter(v=>v.status==="human_review").length;

  return (
    <div style={{ minHeight:"100vh",background:"#0F0F0F" }}>
      <Navbar />
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
          {["Dashboard","Content","Users","Analytics","Settings"].map(item=>(
            <div key={item} style={{ padding:"10px 12px",fontSize:13,color:item==="Content"?"#2ECC71":"#AAAAAA",background:item==="Content"?"rgba(46,204,113,0.07)":"transparent",borderLeft:item==="Content"?"2px solid #2ECC71":"2px solid transparent",cursor:"pointer",borderRadius:"0 8px 8px 0",marginBottom:2 }}>
              {item}
            </div>
          ))}
          <div style={{ margin:"16px 12px 0",padding:"12px",background:"rgba(46,204,113,0.07)",border:"1px solid #1A7A43",borderRadius:10 }}>
            <div style={{ fontSize:11,color:"#2ECC71",fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:5 }}><ShieldIcon /> Moderation Stats</div>
            <div style={{ fontSize:12,color:"#717171" }}>Flagged: <span style={{ color:"#F0A500" }}>{flaggedCount}</span></div>
            <div style={{ fontSize:12,color:"#717171" }}>Review: <span style={{ color:"#4A9EDB" }}>{reviewCount}</span></div>
            <div style={{ fontSize:12,color:"#717171" }}>Scanning: <span style={{ color:"#AAAAAA" }}>{scanningCount}</span></div>
          </div>
        </aside>

        <main style={{ flex:1,marginLeft:200,padding:"24px 28px 60px",minWidth:0 }}>
          <div style={{ marginBottom:20 }}>
            <h1 style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Content Moderation Dashboard</h1>
            <p style={{ color:"#717171",fontSize:13 }}>AI-checked content awaiting human review</p>
          </div>

          {/* Stats */}
          <div style={{ display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" }}>
            {[{l:"AI Accuracy",v:"98.5%",c:"#2ECC71"},{l:"In Review",v:reviewCount,c:"#F0A500"},{l:"Flagged",v:flaggedCount,c:"#E55555"},{l:"Queue Total",v:videos.length,c:"#AAAAAA"}].map(s=>(
              <div key={s.l} style={{ flex:1,minWidth:140,background:"#1a1a1a",border:"1px solid #272727",borderRadius:12,padding:"16px 18px" }}>
                <div style={{ fontSize:11,color:"#AAAAAA",marginBottom:8,letterSpacing:"0.06em" }}>{s.l.toUpperCase()}</div>
                <div style={{ fontSize:26,fontWeight:700,color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Queue */}
          <div style={{ background:"#1a1a1a",border:"1px solid #272727",borderRadius:14,overflow:"hidden" }}>
            {/* Header */}
            <div style={{ padding:"16px 20px",borderBottom:"1px solid #272727",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
              <div>
                <div style={{ fontSize:15,fontWeight:700 }}>Review Queue</div>
                <div style={{ fontSize:12,color:"#717171",marginTop:2 }}>{filtered.length} items</div>
              </div>
              {selected.size>0 && (
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>bulkAction("approve")} style={{ background:"rgba(46,204,113,0.1)",border:"1px solid #1A7A43",color:"#2ECC71",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>✓ Bulk Approve ({selected.size})</button>
                  <button onClick={()=>bulkAction("reject")}  style={{ background:"rgba(229,85,85,0.08)",border:"1px solid #7A1F1F",color:"#E55555",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>✕ Bulk Reject ({selected.size})</button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div style={{ padding:"12px 20px",borderBottom:"1px solid #272727",display:"flex",gap:10,flexWrap:"wrap" }}>
              <div style={{ position:"relative",flex:1,minWidth:200 }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title or uploader..."
                  style={{ width:"100%",background:"#0F0F0F",border:"1px solid #303030",borderRadius:8,padding:"8px 12px",color:"#F1F1F1",fontSize:13,fontFamily:"inherit",outline:"none" }} />
              </div>
              <select value={filterSrc} onChange={e=>setFilterSrc(e.target.value)} style={{ background:"#0F0F0F",border:"1px solid #303030",borderRadius:8,padding:"8px 12px",color:"#F1F1F1",fontSize:13,fontFamily:"inherit",outline:"none",cursor:"pointer" }}>
                <option value="all">All Sources</option>
                {Object.entries(SOURCE_STYLE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={filterAI} onChange={e=>setFilterAI(e.target.value)} style={{ background:"#0F0F0F",border:"1px solid #303030",borderRadius:8,padding:"8px 12px",color:"#F1F1F1",fontSize:13,fontFamily:"inherit",outline:"none",cursor:"pointer" }}>
                <option value="all">All Status</option>
                <option value="human_review">Human Review</option>
                <option value="flagged">Flagged</option>
                <option value="ai_scanning">Scanning</option>
              </select>
            </div>

            {/* Table header */}
            <div style={{ display:"grid",gridTemplateColumns:"36px 2fr 1.2fr 1fr 1fr 1.2fr 1fr 1.4fr",padding:"10px 20px",background:"#0F0F0F",borderBottom:"1px solid #272727" }}>
              <input type="checkbox" checked={filtered.length>0&&filtered.every(v=>selected.has(v._id))} onChange={()=>{const ids=new Set(filtered.map(v=>v._id));const allSel=filtered.every(v=>selected.has(v._id));if(allSel)setSelected(new Set());else setSelected(ids);}} style={{ cursor:"pointer",accentColor:"#2ECC71" }} />
              {["Video","Uploader","Date","Category","Source","AI Status","Actions"].map(h=>(
                <div key={h} style={{ fontSize:11,color:"#555",letterSpacing:"0.06em",fontWeight:600 }}>{h.toUpperCase()}</div>
              ))}
            </div>

            {/* Rows */}
            {filtered.length===0 ? (
              <div style={{ padding:"40px 0",textAlign:"center",color:"#555" }}>No videos matching filters</div>
            ) : filtered.map(v=>{
              const aiCfg = AI_STATUS[v.status]||AI_STATUS.pending;
              const srcCfg = SOURCE_STYLE[v.source]||{color:"#AAAAAA",label:v.source||"Unknown"};
              return (
                <div key={v._id} style={{ display:"grid",gridTemplateColumns:"36px 2fr 1.2fr 1fr 1fr 1.2fr 1fr 1.4fr",padding:"14px 20px",borderBottom:"1px solid #1a1a1a",alignItems:"center",background:selected.has(v._id)?"rgba(46,204,113,0.03)":"transparent" }}>
                  <input type="checkbox" checked={selected.has(v._id)} onChange={()=>{const s=new Set(selected);s.has(v._id)?s.delete(v._id):s.add(v._id);setSelected(s);}} style={{ cursor:"pointer",accentColor:"#2ECC71" }} />
                  <div style={{ fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:8 }}>{v.title}</div>
                  <div style={{ fontSize:12,color:"#AAAAAA" }}>{v.uploaderName||"Unknown"}</div>
                  <div style={{ fontSize:12,color:"#717171" }}>{daysAgo(v.createdAt)}</div>
                  <div style={{ fontSize:11,color:"#AAAAAA",background:"#272727",padding:"3px 8px",borderRadius:99,display:"inline-block",whiteSpace:"nowrap" }}>{v.category||"—"}</div>
                  <span style={{ fontSize:11,fontWeight:600,color:srcCfg.color,background:`${srcCfg.color}18`,border:`1px solid ${srcCfg.color}40`,padding:"3px 9px",borderRadius:6,whiteSpace:"nowrap" }}>{srcCfg.label}</span>
                  <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:99,background:aiCfg.bg,border:`1px solid ${aiCfg.border}`,color:aiCfg.color,fontSize:11,fontWeight:600,whiteSpace:"nowrap" }}>
                    {v.status==="ai_scanning"?<span style={{ display:"inline-block",animation:"spin 1s linear infinite" }}>◌</span>:<span style={{ width:6,height:6,borderRadius:"50%",background:aiCfg.color,display:"inline-block" }} />}
                    {aiCfg.label} {v.ai?.confidence?`${v.ai.confidence}%`:""}
                  </span>
                  <div style={{ display:"flex",gap:6 }}>
                    {v.status!=="ai_scanning" && (
                      <>
                        <button onClick={()=>handleAction(v._id,"approve")} style={{ background:"rgba(46,204,113,0.1)",border:"1px solid #1A7A43",color:"#2ECC71",borderRadius:7,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Approve</button>
                        <button onClick={()=>handleAction(v._id,"reject")}  style={{ background:"rgba(229,85,85,0.08)",border:"1px solid #7A1F1F",color:"#E55555",borderRadius:7,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Reject</button>
                      </>
                    )}
                    {v.status==="ai_scanning" && <span style={{ fontSize:11,color:"#555" }}>Scanning...</span>}
                  </div>
                </div>
              );
            })}

            <div style={{ padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:12,color:"#555" }}>Showing {filtered.length} of {videos.length}</span>
              <Link href="/" style={{ fontSize:12,color:"#2ECC71" }}>← Back to Home</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
