"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ShieldIcon, WarningIcon, ChartIcon, HomeIcon, TrashIcon } from "@/components/Icons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useUI } from "@/lib/UIContext";

const STATUS_CFG = {
  approved:     { label:"Live",         color:"#2ECC71", bg:"rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.3)" },
  human_review: { label:"Human Review", color:"#F0A500", bg:"rgba(240,165,0,0.1)",  border: "rgba(240,165,0,0.3)" },
  flagged:      { label:"Flagged",      color:"#F0A500", bg:"rgba(240,165,0,0.1)",  border: "rgba(240,165,0,0.3)" },
  ai_scanning:  { label:"AI Scanning",  color:"#4A9EDB", bg:"rgba(74,158,219,0.1)", border: "rgba(74,158,219,0.3)" },
  rejected:     { label:"Rejected",     color:"#E55555", bg:"rgba(229,85,85,0.1)",  border: "rgba(229,85,85,0.3)" },
  pending:      { label:"Pending",      color:"#AAAAAA", bg:"rgba(170,170,170,0.1)",border: "rgba(170,170,170,0.3)" },
};

function daysAgo(d) {
  const diff = Math.floor((Date.now()-new Date(d))/86400000);
  return diff<=0?"Aaj":diff===1?"1 din pehle":`${diff} din pehle`;
}

function AdminDashboardContent() {
  const { data:session, status } = useSession();
  const { colorMode } = useUI();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("content");
  const [videos,    setVideos]    = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reports,   setReports]   = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filterStatus, setFilter] = useState("all");
  const [toast,     setToast]     = useState(null);
  const [selected,  setSelected]  = useState(new Set());
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const userRole = session.user.role?.toLowerCase();
      if (userRole !== "admin" && userRole !== "moderator") {
        router.push("/"); return;
      }
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, uRes, rRes, lRes] = await Promise.all([
        fetch("/api/videos?all=true&limit=100").then(r=>r.ok?r.json():null),
        fetch("/api/admin/users").then(r=>r.ok?r.json():null),
        fetch("/api/admin/reports").then(r=>r.ok?r.json():null),
        fetch("/api/admin/logs?limit=50").then(r=>r.ok?r.json():null)
      ]);
      if(vRes?.videos) setVideos(vRes.videos);
      if(uRes?.users) setUsersList(uRes.users);
      if(rRes?.reports) setReports(rRes.reports);
      if(lRes?.logs) setSecurityLogs(lRes.logs);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const exportToCSV = (type) => {
    let csvData = "";
    if (type === "videos") {
      csvData = "ID,Title,Uploader,Category,Status,Views,Likes,AI_Verdict,AI_Confidence,Human_Verdict,Created_At\n" +
        videos.map(v => `${v._id},"${v.title}",${v.uploaderName},${v.category},${v.status},${v.views||0},${v.likes||0},${v.ai?.verdict||'N/A'},${v.ai?.confidence||'N/A'},${v.human?.verdict||'N/A'},${new Date(v.createdAt).toLocaleDateString()}`).join("\n");
    } else {
      csvData = "ID,Name,Email,Role,Created_At\n" +
        usersList.map(u => `${u._id},"${u.name}",${u.email},${u.role},${new Date(u.createdAt).toLocaleDateString()}`).join("\n");
    }
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samtulan_${type}_export.csv`;
    a.click();
    showToast(`✓ ${type} data exported to CSV`, "success");
  };

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2500); };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch("/api/videos", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ videoId:id, action, note: `Admin action: ${action}` }),
      });
      if (res.ok) {
        setVideos(v => v.map(x => x._id===id ? { ...x, status: action==="approve"?"approved":action==="flagged"?"flagged":"rejected" } : x));
        showToast(action==="approve"?"✓ Video approved!":action==="flagged"?"✓ Video flagged":"✕ Video rejected", action==="approve"?"success":action==="flagged"?"success":"danger");
      }
    } catch(e) { showToast("Error occurred","danger"); }
  };

  const [viewLogId, setViewLogId] = useState(null);
  const [viewSummaryId, setViewSummaryId] = useState(null);
  const [rescanLoading, setRescanLoading] = useState(null);

  const handleDeleteUser = async (id) => {
    if(!confirm("User aur unka saara data delete ho jayega. Sure?")) return;
    try {
        const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
        if(res.ok) {
            setUsersList(u=>u.filter(x=>x._id!==id));
            setVideos(v=>v.filter(x=>x.uploader!==id));
            showToast("✓ User permanently banned and wiped", "success");
        }
    } catch(e){ showToast("Failed to delete user", "danger"); }
  };

  const handleRoleChange = async (id, newRole) => {
    if(!confirm(`Kya aap is user ko '${newRole}' role Dena chahte hain?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ userId: id, role: newRole })
      });
      if (res.ok) {
        setUsersList(uList => uList.map(u => u._id === id ? { ...u, role: newRole } : u));
        showToast(`✓ User is now a ${newRole}`, "success");
      } else {
        showToast("Error updating role", "danger");
      }
    } catch (e) {
      showToast("Failed to update role", "danger");
    }
  };

  const handleRescan = async (id) => {
    setRescanLoading(id);
    try {
      const res = await fetch("/api/videos", {
        method: "PATCH", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ videoId: id, action: "rescan" })
      });
      const data = await res.json();
      if (res.ok) {
        setVideos(vList => vList.map(v => v._id === id ? data.video : v));
        showToast("✓ AI Re-scan complete with Summary!", "success");
      } else {
        showToast(data.error || "Rescan failed", "danger");
      }
    } catch (e) {
      showToast("Error during rescan", "danger");
    } finally {
      setRescanLoading(null);
    }
  };

  const filtered = videos.filter(v => {
    const ms = v.title?.toLowerCase().includes(search.toLowerCase()) || (v.uploaderName||"").toLowerCase().includes(search.toLowerCase());
    const mf = filterStatus==="all" || v.status===filterStatus;
    return ms && mf;
  });

  const counts = {
    total:    videos.length,
    review:   videos.filter(v=>v.status==="human_review"||v.status==="flagged").length,
    approved: videos.filter(v=>v.status==="approved").length,
    rejected: videos.filter(v=>v.status==="rejected").length,
  };

  const chartData = [
    { name: 'Live', Count: counts.approved },
    { name: 'Review', Count: counts.review },
    { name: 'Rejected', Count: counts.rejected },
  ];

  if (status === "loading") return <div style={{ minHeight:"100vh",background:"var(--bg-color)",color:"#AAAAAA" }}>Loading Dashboard...</div>;

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg-color)",fontFamily:"'Inter','Roboto',sans-serif",color:"var(--text-color)" }}>
      <Navbar />

      {toast && (
        <div className="glass-panel" style={{ position:"fixed",top:68,right:20,zIndex:999,padding:"12px 20px",borderRadius:10,color:toast.type==="success"?"var(--accent-color)":"#E55555",fontSize:13,fontWeight:600 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display:"flex",paddingTop:56 }}>
        <aside className="glass-panel" style={{ position:"fixed",top:56,left:0,bottom:0,width:200,background:"var(--bg-color)",borderRight:"1px solid var(--border-color)",padding:"16px 8px",zIndex:50 }}>
          <div style={{ padding:"0 12px",marginBottom:20 }}>
            <div className="gnlow-text" style={{ fontSize:16,fontWeight:700, color: "var(--text-color)" }}>सम<span style={{ color:"var(--accent-color)" }}>तुलन</span></div>
            <div style={{ fontSize:10,color:"var(--text-color)",opacity:0.6,letterSpacing:"0.1em",marginTop:2 }}>ADMIN PANEL</div>
          </div>

          {[
            { id:"content", label:"Moderation", icon:<ShieldIcon/> },
            { id:"users", label:"Users", icon:<span style={{fontSize:16}}>👥</span> },
            { id:"reports", label:"Reports", icon:<WarningIcon/> },
            { id:"logs", label:"Security Logs", icon:<span style={{fontSize:16}}>📜</span> },
            { id:"analytics", label:"Analytics", icon:<ChartIcon/> },
          ].map(f=>(
            <button key={f.id} onClick={()=>setActiveTab(f.id)} style={{ width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 12px",marginBottom:4,borderRadius:10,border:`1px solid ${activeTab===f.id?"var(--accent-color)":"transparent"}`,background:activeTab===f.id?"var(--glass-bg)":"transparent",color:activeTab===f.id?"var(--accent-color)":"var(--text-color)",opacity:activeTab===f.id?1:0.6,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:activeTab===f.id?600:400 }}>
              {f.icon} {f.label}
            </button>
          ))}
          <Link href="/" style={{ display:"flex",alignItems:"center",gap:8,marginTop:12,padding:"10px 12px",fontSize:13,color:"#717171",borderRadius:10,textDecoration:"none" }}><HomeIcon /> Back to Web</Link>
        </aside>

        <main style={{ flex:1,marginLeft:200,padding:"24px 28px 60px",minWidth:0 }}>
          
          {activeTab === "analytics" && (
              <>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <h1 className="gnlow-text" style={{ fontSize:22,fontWeight:700 }}>Admin Analytics</h1>
                    <button onClick={()=>exportToCSV('videos')} style={{ background:"var(--card-bg)", border:"1px solid var(--border-color)", color:"var(--text-color)", padding:"8px 16px", borderRadius:20, fontSize:12, cursor:"pointer", fontWeight:600 }}>Export Data (CSV)</button>
                  </div>
                  <p style={{ color:"#717171",fontSize:13,marginBottom:24 }}>Platform performance data overview</p>

                  <div style={{ display:"flex",gap:12,marginBottom:24,flexWrap:"wrap" }}>
                    {[{l:"Total Videos",v:counts.total,c:"var(--accent-color)"},{l:"In Review",v:counts.review,c:"#F0A500"},{l:"Active Users",v:usersList.length,c:"var(--accent-color)"}].map(s=>(
                      <div key={s.l} className="glass-panel" style={{ flex:1,minWidth:130,borderRadius:12,padding:"16px 18px" }}>
                        <div style={{ fontSize:11,color:"var(--text-color)",opacity:0.6,marginBottom:8 }}>{s.l.toUpperCase()}</div>
                        <div style={{ fontSize:26,fontWeight:700,color:s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="glass-panel" style={{ borderRadius:14,padding:"20px",height:400 }}>
                    <h3 style={{ fontSize:15,marginBottom:20 }}>Content Status Breakdown</h3>
                    {mounted ? (
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="name" stroke="var(--text-color)" fontSize={12} />
                            <YAxis stroke="var(--text-color)" fontSize={12} />
                            <Tooltip contentStyle={{background:"var(--bg-color)",border:"1px solid var(--accent-color)",borderRadius:8}} />
                            <Bar dataKey="Count" fill="var(--accent-color)" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    ) : <div style={{ height:"85%", background:"var(--card-bg)", borderRadius:8 }} />}
                  </div>
              </>
          )}

          {activeTab === "content" && (
              <>
                  <h1 className="gnlow-text" style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Moderation Central</h1>
                  <p style={{ color:"#717171",fontSize:13,marginBottom:24 }}>Review and moderate platform content</p>

                  <div className="glass-panel" style={{ borderRadius:14,overflow:"hidden" }}>
                    <div style={{ padding:"14px 20px",borderBottom:"1px solid var(--border-color)",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
                      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter by title or uploader..." style={{ flex:1,minWidth:200,background:"var(--bg-color)",border:"1px solid var(--border-color)",borderRadius:8,padding:"8px 12px",color:"var(--text-color)",fontSize:13,fontFamily:"inherit",outline:"none" }} />
                      <button onClick={fetchData} style={{ background:"var(--card-bg)",border:"1px solid var(--border-color)",color:"var(--accent-color)",borderRadius:8,padding:"8px 14px",fontSize:12,cursor:"pointer" }}>↻ Sync</button>
                    </div>

                    <div style={{ display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 1fr 2fr",padding:"12px 20px",background:"var(--bg-color)",borderBottom:"1px solid var(--border-color)",opacity:0.6 }}>
                      {["Video Content","Uploader","Created","Status","Management"].map(h=><div key={h} style={{ fontSize:10,color:"var(--text-color)",letterSpacing:"0.1em",fontWeight:700 }}>{h.toUpperCase()}</div>)}
                    </div>

                    {loading ? <div style={{ padding:"60px 0",textAlign:"center",color:"#555",fontSize:13 }}>Loading secure content logs...</div> : 
                     filtered.length===0 ? <div style={{ padding:"60px 0",textAlign:"center",color:"#555",fontSize:13 }}>No matching records found in this queue</div> :
                     filtered.map(v => {
                      const c = STATUS_CFG[v.status]||STATUS_CFG.pending;
                      const isOpen = viewLogId === v._id;
                      return (
                        <div key={v._id} style={{ transition:"all 0.2s" }}>
                        <div style={{ display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 1fr 2fr",padding:"16px 20px",borderBottom:"1px solid var(--border-color)",alignItems:"center", background:isOpen ? "var(--glass-bg)" : "transparent" }}>
                          <div style={{ paddingRight:12 }}>
                            <div style={{ fontSize:13,fontWeight:700,marginBottom:6, color:"var(--text-color)" }}>{v.title}</div>
                            <span style={{ fontSize:10,color:"var(--accent-color)",background:"var(--glass-bg)",padding:"3px 10px",borderRadius:6, fontWeight:700, border:"1px solid var(--border-color)" }}>{v.category||"UNCATEGORIZED"}</span>
                          </div>
                          <div style={{ fontSize:12,color:"var(--text-color)",opacity:0.8, fontWeight:500 }}>{v.uploaderName||"Unknown"}</div>
                          <div style={{ fontSize:12,color:"#717171" }}>{daysAgo(v.createdAt)}</div>
                          <div>
                            <span style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:99,background:c.bg,border:`1px solid ${c.border}`,color:c.color,fontSize:11,fontWeight:700, textTransform:"uppercase", letterSpacing:"0.02em" }}>
                               <div style={{width:6,height:6,borderRadius:"50%",background:c.color, boxShadow:`0 0 8px ${c.color}`}}/> {c.label}
                            </span>
                          </div>
                          <div style={{ display:"flex",gap:8, flexDirection:"column", alignItems:"flex-start" }}>
                            <div style={{ display:"flex",gap:6, flexWrap:"wrap" }}>
                              {v.status!=="approved" && <button onClick={()=>handleAction(v._id,"approve")} style={{ background:"rgba(46,204,113,0.1)",color:"#2ECC71",border:"1px solid rgba(46,204,113,0.3)",borderRadius:8,padding:"7px 14px",fontSize:11,cursor:"pointer", fontWeight:700 }}>APPROVE</button>}
                              {(v.status!=="flagged" && v.status!=="human_review") && <button onClick={()=>handleAction(v._id,"flagged")} style={{ background:"rgba(240,165,0,0.1)",color:"#F0A500",border:"1px solid rgba(240,165,0,0.3)",borderRadius:8,padding:"7px 14px",fontSize:11,cursor:"pointer", fontWeight:700 }}>FLAG</button>}
                              {v.status!=="rejected" && <button onClick={()=>handleAction(v._id,"reject")} style={{ background:"rgba(229,85,85,0.1)",color:"#E55555",border:"1px solid rgba(229,85,85,0.3)",borderRadius:8,padding:"7px 14px",fontSize:11,cursor:"pointer", fontWeight:700 }}>REJECT</button>}
                            </div>
                            <div style={{ display:"flex",gap:6 }}>
                              <button onClick={()=>{ setViewSummaryId(viewSummaryId === v._id ? null : v._id); setViewLogId(null); }} style={{ background:viewSummaryId === v._id?"rgba(74,158,219,0.1)":"transparent",color:viewSummaryId === v._id?"#4A9EDB":"var(--text-color)",opacity:viewSummaryId === v._id?1:0.8,border:viewSummaryId === v._id?"1px solid #4A9EDB":"1px solid var(--border-color)",borderRadius:8,padding:"6px 14px",fontSize:11,cursor:"pointer", fontWeight:700, display:"flex", alignItems:"center", gap:6, transition:"all 0.2s" }}>
                                  {viewSummaryId === v._id ? "CLOSE SUMMARY" : "VIEW SUMMARY"}
                              </button>
                              <button onClick={()=>{ setViewLogId(viewLogId === v._id ? null : v._id); setViewSummaryId(null); }} style={{ background:viewLogId === v._id?"rgba(240,165,0,0.1)":"transparent",color:viewLogId === v._id?"#F0A500":"var(--text-color)",opacity:viewLogId === v._id?1:0.8,border:viewLogId === v._id?"1px solid #F0A500":"1px solid var(--border-color)",borderRadius:8,padding:"6px 14px",fontSize:11,cursor:"pointer", fontWeight:700, display:"flex", alignItems:"center", gap:6, transition:"all 0.2s" }}>
                                  {viewLogId === v._id ? "CLOSE AUDIT" : "VIEW AUDIT"}
                              </button>
                            </div>
                          </div>
                        </div>
                        {viewSummaryId === v._id && (
                          <div style={{ padding:"20px 30px", background:"var(--bg-color)", borderBottom:"1px solid var(--border-color)" }}>
                            <div style={{ borderLeft:"4px solid #4A9EDB", paddingLeft:20 }}>
                                <div style={{ color:"#4A9EDB", fontWeight:800, fontSize:12, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>AI-MODERATOR NARRATIVE SUMMARY</div>
                                {v.ai?.summary ? (
                                  <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize:14, lineHeight:1.7, color:"var(--text-color)", fontStyle:"italic", marginBottom: 16 }}>"{v.ai.summary}"</div>
                                    
                                    {v.ai.violations?.length > 0 && (
                                      <div style={{ marginTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-color)", opacity: 0.8, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                          <span style={{ fontSize: 16 }}>⚠️</span> VIOLATION TIMELINE & REASONING
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                          {v.ai.violations.map((vi, idx) => (
                                            <div key={idx} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 12, borderLeft: `3px solid ${vi.severity === "High" ? "#ff4444" : vi.severity === "Medium" ? "#ffbb33" : "#00C851"}` }}>
                                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-color)" }}>{vi.timestamp} — {vi.category}</span>
                                                <span style={{ fontSize: 10, background: vi.severity === "High" ? "rgba(255,68,68,0.1)" : "rgba(255,187,51,0.1)", color: vi.severity === "High" ? "#ff4444" : "#ffbb33", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{vi.severity} RISK</span>
                                              </div>
                                              <div style={{ fontSize: 13, color: "var(--text-color)", opacity: 0.9 }}>{vi.reason}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ padding:"10px 0" }}>
                                    <div style={{ fontSize:14, color:"#777", marginBottom:12 }}>No detailed AI violation timeline available for this video metadata.</div>
                                    <button 
                                      onClick={() => handleRescan(v._id)} 
                                      disabled={rescanLoading === v._id}
                                      style={{ background:"var(--accent-color)", color:"#000", border:"none", borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", opacity:rescanLoading === v._id ? 0.5 : 1 }}
                                    >
                                      {rescanLoading === v._id ? "SCANNING TIMELINE..." : "GENERATE VIOLATION TIMELINE"}
                                    </button>
                                  </div>
                                )}
                                <div style={{marginTop:16, display:"flex", gap:10}}>
                                   <span style={{fontSize:10, opacity:0.5}}>SCAN ID: {v._id?.slice(-8).toUpperCase()}</span>
                                   <span style={{fontSize:10, opacity:0.5}}>CHECKED AT: {v.ai?.checkedAt ? new Date(v.ai?.checkedAt).toLocaleString() : "Unknown"}</span>
                                </div>
                            </div>
                          </div>
                        )}
                        {viewLogId === v._id && (
                          <div style={{ padding:"24px 30px", background:"var(--bg-color)", borderBottom:"1px solid var(--border-color)", fontSize:12, color:"var(--text-color)", display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:30 }}>
                            <div style={{ borderLeft:"2px solid #F0A500", paddingLeft:16 }}>
                                <div style={{ color:"#F0A500", fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>TECHNICAL AUDIT</div>
                                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                    <div><span style={{opacity:0.6}}>AI Verdict:</span> <span style={{color:"var(--text-color)", fontWeight:600}}>{v.ai?.verdict?.toUpperCase() || "N/A"}</span></div>
                                    <div><span style={{opacity:0.6}}>Confidence Score:</span> <span style={{color:"var(--text-color)", fontWeight:600}}>{Math.round((v.ai?.confidence||0))}%</span></div>
                                    <div><span style={{opacity:0.6}}>Primary Flags:</span> <span style={{color:"var(--accent-color)"}}>{v.ai?.reasons?.join(", ") || "No specific flags"}</span></div>
                                </div>
                            </div>
                            <div style={{ borderLeft:`2px solid var(--accent-color)`, paddingLeft:16 }}>
                                <div style={{ color:"var(--accent-color)", fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>HUMAN DECISION LOG</div>
                                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                    <div><span style={{opacity:0.6}}>Current Status:</span> <span style={{color:"var(--text-color)", fontWeight:600}}>{v.human?.verdict?.toUpperCase() || "WAITING FOR REVIEW"}</span></div>
                                    <div><span style={{opacity:0.6}}>Internal Note:</span> <span style={{color:"var(--text-color)", fontWeight:500, fontStyle:"italic"}}>{v.human?.note || "Awaiting moderation note"}</span></div>
                                    <div><span style={{opacity:0.6}}>Last Active:</span> <span style={{color:"var(--text-color)"}}>{v.human?.checkedAt ? new Date(v.human?.checkedAt).toLocaleString() : "Never"}</span></div>
                                </div>
                            </div>
                            <div style={{ borderLeft:"2px solid var(--border-color)", paddingLeft:16 }}>
                                <div style={{ color:"var(--text-color)", fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>CONTENT ENGAGEMENT</div>
                                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                    <div><span style={{opacity:0.6}}>Live Views:</span> <span style={{color:"var(--text-color)", fontWeight:600}}>{v.views?.toLocaleString() || 0}</span></div>
                                    <div><span style={{opacity:0.6}}>Community Likes:</span> <span style={{color:"var(--text-color)", fontWeight:600}}>{v.likes?.toLocaleString() || 0}</span></div>
                                    <div><span style={{opacity:0.6}}>Category:</span> <span style={{color:"var(--accent-color)"}}>{v.category || "General"}</span></div>
                                </div>
                            </div>
                          </div>
                        )}
                        </div>
                      );
                    })}
                  </div>
              </>
          )}

          {activeTab === "users" && (
              <>
                  <h1 className="gnlow-text" style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>User Directory</h1>
                  <p style={{ color:"var(--text-color)",opacity:0.6,fontSize:13,marginBottom:24 }}>Oversee user access levels and policy enforcement</p>
                  
                  <div className="glass-panel" style={{ borderRadius:14,overflow:"hidden" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"2.5fr 2fr 1.2fr 1fr",padding:"10px 20px",background:"var(--bg-color)",borderBottom:"1px solid var(--border-color)",opacity:0.6 }}>
                      {["User Info","Email Address","Level","Actions"].map(h=><div key={h} style={{ fontSize:11,color:"var(--text-color)",letterSpacing:"0.06em",fontWeight:600 }}>{h.toUpperCase()}</div>)}
                    </div>
                    {usersList.length===0 ? <div style={{ padding:"40px 0",textAlign:"center",color:"#555" }}>No registered users found</div> :
                     usersList.map(u => (
                        <div key={u._id} style={{ display:"grid",gridTemplateColumns:"2.5fr 2fr 1.2fr 1fr",padding:"14px 20px",borderBottom:"1px solid var(--border-color)",alignItems:"center" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                             <div style={{ width:32,height:32,borderRadius:"50%",background:"var(--glass-bg)",border:"1px solid var(--border-color)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--accent-color)" }}>
                                {u.avatar ? <img src={u.avatar} style={{width:"100%",height:"100%",borderRadius:"50%"}} /> : u.name[0].toUpperCase()}
                             </div>
                             <div style={{ fontSize:13,fontWeight:600, color:"var(--text-color)" }}>{u.name}</div>
                          </div>
                          <div style={{ fontSize:12,color:"var(--text-color)",opacity:0.7 }}>{u.email}</div>
                          <div><span style={{ fontSize:10,background:"var(--glass-bg)",color:"var(--accent-color)",padding:"3px 10px",borderRadius:99, border: "1px solid var(--border-color)", fontWeight:700 }}>{u.role.toUpperCase()}</span></div>
                          <div style={{ display:"flex", gap:6 }}>
                            {u.role !== "admin" && (
                                <button onClick={()=>handleDeleteUser(u._id)} style={{ background:"rgba(229,85,85,0.05)",color:"#E55555",border:"1px solid #E55555",borderRadius:7,padding:"6px 12px",fontSize:11,cursor:"pointer", fontWeight:600 }}>BANNED</button>
                            )}
                            {u.role !== "admin" && session?.user?.role?.toLowerCase() === "admin" && (
                                <button onClick={()=>handleRoleChange(u._id, u.role === "moderator" ? "creator" : "moderator")} style={{ background:"rgba(0,255,136,0.05)",color:"var(--accent-color)",border:`1px solid var(--accent-color)`,borderRadius:7,padding:"6px 12px",fontSize:11,cursor:"pointer", fontWeight:600 }}>
                                  {u.role === "moderator" ? "DEMOTE" : "GRANT MOD"}
                                </button>
                            )}
                          </div>
                        </div>
                    ))}
                  </div>
              </>
          )}

          {activeTab === "logs" && (
              <>
                  <h1 className="gnlow-text" style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Technical Audit Logs</h1>
                  <p style={{ color:"var(--text-color)",opacity:0.6,fontSize:13,marginBottom:24 }}>Real-time backend security heartbeat and admin activity trail</p>
                  
                  <div className="glass-panel" style={{ borderRadius:14,overflow:"hidden" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"1.5fr 2fr 1fr 2fr",padding:"10px 20px",background:"var(--bg-color)",borderBottom:"1px solid var(--border-color)",opacity:0.6 }}>
                      {["Timestamp","Actor","Action","Details"].map(h=><div key={h} style={{ fontSize:11,color:"var(--text-color)",letterSpacing:"0.06em",fontWeight:600 }}>{h.toUpperCase()}</div>)}
                    </div>
                    {securityLogs.length===0 ? <div style={{ padding:"40px 0",textAlign:"center",color:"#555" }}>Queuing system is empty or initializing...</div> :
                     securityLogs.map(log => (
                        <div key={log._id} style={{ display:"grid",gridTemplateColumns:"1.5fr 2fr 1fr 2fr",padding:"12px 20px",borderBottom:"1px solid var(--border-color)",alignItems:"center" }}>
                          <div style={{ fontSize:12, color:"var(--text-color)", opacity:0.8 }}>{new Date(log.createdAt).toLocaleString()}</div>
                          <div style={{ fontSize:12, color:"var(--text-color)", fontWeight:600 }}>{log.actorEmail || "System"}</div>
                          <div>
                            <span style={{ fontSize:10,background:log.action.includes("DELETE")?"rgba(229,85,85,0.1)":"rgba(0,255,136,0.1)",color:log.action.includes("DELETE")?"#E55555":"var(--accent-color)",padding:"3px 8px",borderRadius:6, fontWeight:800, border:"1px solid var(--border-color)" }}>{log.action}</span>
                          </div>
                          <div style={{ fontSize:11, color:"var(--text-color)", opacity:0.6, fontStyle:"italic" }}>{JSON.stringify(log.details || {})}</div>
                        </div>
                     ))}
                  </div>
              </>
          )}

          {activeTab === "reports" && (
              <>
                  <h1 className="gnlow-text" style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Incident Reports</h1>
                  <p style={{ color:"var(--text-color)",opacity:0.6,fontSize:13,marginBottom:24 }}>Review community-flagged content for violations</p>
                  
                  <div className="glass-panel" style={{ background:"transparent",border:"none",borderRadius:14,overflow:"hidden" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"2fr 2fr 1.5fr 1fr 1fr",padding:"10px 20px",background:"var(--bg-color)",borderBottom:"1px solid var(--border-color)" }}>
                      {["Target Video","Incident Reason","Reportee","Workflow","Actions"].map(h=><div key={h} style={{ fontSize:11,color:"#555",letterSpacing:"0.06em",fontWeight:600 }}>{h.toUpperCase()}</div>)}
                    </div>
                    {reports.length===0 ? <div style={{ padding:"40px 0",textAlign:"center",color:"#555" }}>No active incident reports</div> :
                     reports.map(r => (
                        <div key={r._id} style={{ display:"grid",gridTemplateColumns:"2fr 2fr 1.5fr 1fr 1fr",padding:"14px 20px",borderBottom:"1px solid var(--border-color)",alignItems:"start", gap:8 }}>
                          <div>
                            <Link href={`/watch?id=${r.videoId?._id}`} style={{ fontSize:13,fontWeight:700,color:"var(--accent-color)",textDecoration:"none" }}>{r.videoId?.title || "Unknown"}</Link>
                            <div style={{ fontSize:11,color:"var(--text-color)",opacity:0.6,marginTop:4, display:"flex", alignItems:"center", gap:4 }}><div style={{width:6,height:6,borderRadius:"50%",background:"var(--border-color)"}}/> {r.videoId?.uploaderName}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:13,fontWeight:700,color:"var(--text-color)", display:"flex", alignItems:"center", gap:6 }}><WarningIcon/> {r.reason}</div>
                            {r.details && <div style={{ fontSize:12,color:"var(--text-color)",opacity:0.5,marginTop:4, fontStyle:"italic" }}>"{r.details}"</div>}
                          </div>
                          <div>
                             <div style={{ fontSize:12, color:"var(--text-color)", fontWeight:600 }}>{r.reporterId?.name || "Anonymous"}</div>
                             <div style={{ fontSize:11,color:"var(--text-color)",opacity:0.4 }}>{r.reporterId?.email}</div>
                          </div>
                          <div>
                            <span style={{ fontSize:10,background:r.status==="resolved"?"rgba(46,204,113,0.1)":r.status==="dismissed"?"rgba(170,170,170,0.1)":"rgba(240,165,0,0.1)",color:r.status==="resolved"?"#2ECC71":r.status==="dismissed"?"var(--text-color)":"#F0A500",padding:"4px 12px",borderRadius:99, border: `1px solid var(--border-color)`, fontWeight:700 }}>{r.status.toUpperCase()}</span>
                          </div>
                          <div style={{ display:"flex", gap:6, flexDirection:"column" }}>
                            {r.status === "pending" && (
                                <>
                                  <button onClick={async () => {
                                      await handleAction(r.videoId?._id, "reject");
                                      await fetch('/api/admin/reports', {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({reportId:r._id, status:'resolved'})});
                                      fetchData();
                                  }} style={{ background:"rgba(229,85,85,0.1)",color:"#E55555",border:"1px solid #7A1F1F",borderRadius:7,padding:"7px 14px",fontSize:11,cursor:"pointer", fontWeight:700 }}>TAKE DOWN</button>
                                  
                                  <button onClick={async () => {
                                      await fetch('/api/admin/reports', {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({reportId:r._id, status:'dismissed'})});
                                      fetchData();
                                  }} style={{ background:"transparent",color:"#717171",border:"1px solid var(--border-color)",borderRadius:7,padding:"7px 14px",fontSize:11,cursor:"pointer", fontWeight:700 }}>DISMISS</button>
                                </>
                            )}
                          </div>
                        </div>
                    ))}
                  </div>
              </>
          )}

        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh",background:"var(--bg-color)",color:"var(--text-color)",padding:20 }}>Loading Moderation...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
