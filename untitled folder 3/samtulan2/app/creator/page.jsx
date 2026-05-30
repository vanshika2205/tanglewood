"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useUI } from "@/lib/UIContext";
import { ShieldIcon, VideoIcon, ChartIcon, HomeIcon, TrashIcon, BellIcon, UploadIcon, EyeIcon } from "@/components/Icons";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STATUS_CFG = {
  approved:    { label:"Live",          color:"#2ECC71", bg:"rgba(46,204,113,0.1)",  border: "rgba(46,204,113,0.3)" },
  ai_scanning: { label:"AI Scanning",   color:"#4A9EDB", bg:"rgba(74,158,219,0.1)",  border: "rgba(74,158,219,0.3)" },
  human_review:{ label:"Human Review",  color:"#F0A500", bg:"rgba(240,165,0,0.1)",   border: "rgba(240,165,0,0.3)" },
  flagged:     { label:"Flagged",       color:"#F0A500", bg:"rgba(240,165,0,0.1)",   border: "rgba(240,165,0,0.3)" },
  rejected:    { label:"Rejected",      color:"#E55555", bg:"rgba(229,85,85,0.1)",   border: "rgba(229,85,85,0.3)" },
  pending:     { label:"Pending",       color:"#AAAAAA", bg:"rgba(170,170,170,0.1)", border: "rgba(170,170,170,0.3)" },
  draft:       { label:"Draft",         color:"#717171", bg:"rgba(113,113,113,0.1)", border: "rgba(113,113,113,0.3)" },
};

function fmtViews(n) {
  if(!n)return "0"; if(n>=1e5)return (n/1e5).toFixed(1)+"L"; if(n>=1e3)return (n/1e3).toFixed(1)+"K"; return String(n);
}
function daysAgo(d) {
  const diff = Math.floor((Date.now()-new Date(d))/864000000);
  return diff<=0?"Today":diff===1?"Yesterday":diff+" days ago";
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status]||STATUS_CFG.pending;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:99,background:c.bg,border:`1px solid ${c.border}`,color:c.color,fontSize:11,fontWeight:600,whiteSpace:"nowrap" }}>{c.label}</span>;
}

function CreatorDashboardContent() {
  const { data: session, status } = useSession();
  const { uiMode, colorMode } = useUI();
  const isCyber = uiMode === "cyber";
  const isMinimal = uiMode === "minimalist";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [videos,    setVideos]    = useState([]);
  const [notifs,    setNotifs]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [collapsed, setCollapsed] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [mounted,   setMounted]   = useState(false);
  
  const W = collapsed ? 70 : 220;

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vData, nData, meData] = await Promise.all([
        fetch("/api/videos?mine=true&limit=100").then(r=>r.ok?r.json():null),
        fetch("/api/user/notifications").then(r=>r.ok?r.json():null),
        fetch("/api/user/me").then(r=>r.ok?r.json():null)
      ]);
      if (meData && !meData.hasChannel) { router.replace("/create-channel"); return; }
      if(vData?.videos) setVideos(vData.videos);
      if(nData?.notifications) setNotifs(nData.notifications);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2500); };
  
  const deleteVideo = async (id) => { 
    if(!confirm("Are you sure you want to delete this video?")) return;
    try {
      const res = await fetch(`/api/videos?id=${id}`, { method: "DELETE" });
      if(res.ok) {
        setVideos(v=>v.filter(x=>x._id!==id)); 
        showToast("✓ Video deleted","success"); 
      } else throw new Error();
    } catch(e) {
      showToast("❌ Failed to delete", "danger");
    }
  };

  const filtered = videos.filter(v => filter==="all" || v.status===filter);
  const liveCount = videos.filter(v=>v.status==="approved").length;
  const reviewCount = videos.filter(v=>["ai_scanning","human_review","flagged"].includes(v.status)).length;
  const rejectedCount = videos.filter(v=>v.status==="rejected").length;

  const NAV = [
    { id:"dashboard", label:"Dashboard", Icon:HomeIcon },
    { id:"videos",    label:"My Studio", Icon:VideoIcon },
    { id:"analytics", label:"Analytics", Icon:ChartIcon },
    { id:"notifications", label:"Notifs", Icon:BellIcon }
  ];

  const totalViews = videos.reduce((a,v)=>a+(v.views||0),0);
  const totalLikes = videos.reduce((a,v)=>a+(v.likes||0),0);

  const chartData = [...videos].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0, 8).map((v, i) => ({
    name: v.title.length > 10 ? v.title.substring(0, 10) + ".." : v.title || `V${i+1}`,
    Views: v.views || 0,
    Likes: v.likes || 0
  }));

  if (loading || status === "loading") return <div style={{ minHeight:"100vh",background:"var(--bg-color)", color:"var(--text-color)", padding:"80px" }}>Loading Creator Studio...</div>;

  const initials = session?.user?.name ? session.user.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "C";

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg-color)", color:"var(--text-color)", fontFamily:"'Inter', sans-serif" }}>
      <Navbar onMenuToggle={()=>setCollapsed(p=>!p)} collapsed={collapsed} />

      {toast && (
        <div className="glass-panel" style={{ position:"fixed",top:68,right:20,zIndex:999,padding:"12px 20px",borderRadius:10,color:toast.type==="success"?"var(--accent-color)":"#E55555",fontSize:13,fontWeight:600 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display:"flex",paddingTop:56 }}>
        {/* Sidebar */}
        <aside className="glass-panel" style={{ position:"fixed",top:56,left:0,bottom:0,width:W,background:"var(--bg-color)",borderRight:"1px solid var(--border-color)",padding:"10px 8px",transition:"width 0.25s",zIndex:50,overflowY:"auto" }}>
          {!collapsed && (
            <div className="glass-panel" style={{ margin:"0 4px 16px",padding:"14px",borderRadius:12 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                <div style={{ width:38,height:38,borderRadius:"50%",background:"var(--glass-bg)",border:"1px solid var(--border-color)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"var(--accent-color)" }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize:13,fontWeight:700 }}>{session?.user?.name}</div>
                  <div style={{ fontSize:11,color:"var(--text-color)", opacity: 0.6 }}>Creator</div>
                </div>
              </div>
              <div style={{ display:"flex",gap:6 }}>
                {[{v:liveCount,l:"Live",c:"var(--accent-color)"},{v:reviewCount,l:"Rev.",c:"#F0A500"},{v:rejectedCount,l:"Rej.",c:"#E55555"}].map(s=>(
                  <div key={s.l} style={{ flex:1,textAlign:"center",padding:"6px 4px",background:"var(--card-bg)",borderRadius:8 }}>
                    <div style={{ fontSize:14,fontWeight:700,color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:9,color:"var(--text-color)",opacity:0.6 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{ width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:14,justifyContent:collapsed?"center":"flex-start",padding:collapsed?"13px 0":"11px 14px",marginBottom:2,borderRadius:10,border:`1px solid ${activeTab===item.id?"var(--accent-color)":"transparent"}`,background:activeTab===item.id?"var(--glass-bg)":"transparent",color:activeTab===item.id?"var(--accent-color)":"var(--text-color)",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}>
              <span style={{ flexShrink:0 }}><item.Icon /></span>
              {!collapsed && <span style={{ fontSize:13,fontWeight:activeTab===item.id?600:400 }}>{item.label}</span>}
            </button>
          ))}
          <Link href="/" style={{ display:"flex",alignItems:"center",gap:8,marginTop:12,padding:"10px 12px",fontSize:13,color:"var(--text-color)",opacity:0.5,borderRadius:10,textDecoration:"none" }}><HomeIcon /> Back to Web</Link>
        </aside>

        <main style={{ flex:1,marginLeft:W,padding:"24px 28px 60px",transition:"margin-left 0.25s",minWidth:0 }}>

          {activeTab==="dashboard" && (
            <>
              <h1 className="gnlow-text" style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Creator Dashboard</h1>
              <p style={{ color:"var(--text-color)", opacity: 0.6, fontSize:13,marginBottom:24 }}>Welcome back, {session?.user?.name}</p>
              <div style={{ display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" }}>
                {[{label:"Total Views",val:fmtViews(totalViews),color:"var(--accent-color)"},{label:"Total Likes",val:fmtViews(totalLikes),color:"#2ECC71"},{label:"Live Videos",val:liveCount,color:"#2ECC71"},{label:"In Review",val:reviewCount,color:"#F0A500"}].map(s=>(
                  <div key={s.label} className="glass-panel" style={{ flex:1,minWidth:150,borderRadius:14,padding:"20px 22px" }}>
                    <div style={{ fontSize:12,color:"var(--text-color)", opacity:0.6, marginBottom:10 }}>{s.label}</div>
                    <div style={{ fontSize:28,fontWeight:700,color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div className="glass-panel" style={{ borderRadius:14,padding:"20px 22px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                  <div style={{ fontSize:15,fontWeight:700 }}>Recent Activity</div>
                  <button onClick={()=>setActiveTab("videos")} style={{ background:"none",border:"none",color:"var(--accent-color)",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>View All →</button>
                </div>
                {videos.length===0 && <div style={{ fontSize:13,color:"var(--text-color)", opacity:0.5 }}>No videos uploaded yet.</div>}
                {videos.slice(0,3).map(v=>(
                  <div key={v._id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--border-color)" }}>
                    <div style={{ flex:1,minWidth:0,marginRight:12 }}>
                      <div style={{ fontSize:13,fontWeight:600,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{v.title}</div>
                      <div style={{ display:"flex",gap:8,alignItems:"center" }}><StatusBadge status={v.status} /><span style={{ fontSize:12,color:"#717171" }}>{daysAgo(v.createdAt)}</span></div>
                    </div>
                    {v.status==="approved" && <span style={{ fontSize:13,color:"var(--text-color)",opacity:0.6,flexShrink:0 }}>{fmtViews(v.views)} views</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab==="videos" && (
            <>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12 }}>
                <div>
                  <h1 className="gnlow-text" style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Video Management</h1>
                  <p style={{ color:"var(--text-color)", opacity: 0.6, fontSize:13 }}>{videos.length} videos uploaded</p>
                </div>
                <Link href="/upload" style={{ display:"flex",alignItems:"center",gap:6,background:"var(--accent-color)",color:colorMode === "dark" ? "#000" : "#FFF",borderRadius:10,padding:"10px 20px",fontSize:14,fontWeight:700,textDecoration:"none", boxShadow:"var(--shadow)" }}><UploadIcon /> Start Upload</Link>
              </div>

              {/* Filters */}
              <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
                {[{key:"all",label:"All"},{key:"approved",label:"Live"},{key:"human_review",label:"Review"},{key:"ai_scanning",label:"Scanning"},{key:"flagged",label:"Flagged"},{key:"rejected",label:"Rejected"}].map(f=>(
                  <button key={f.key} onClick={()=>setFilter(f.key)} style={{ background:filter===f.key?"var(--accent-color)":"var(--card-bg)",color:filter===f.key?(colorMode === "dark" ? "#000" : "#FFF"):"var(--text-color)",border:"1px solid var(--border-color)",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:filter===f.key?700:400,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}>{f.label}</button>
                ))}
              </div>

              <div className="glass-panel" style={{ borderRadius:14,padding:"4px 20px",overflow:"hidden" }}>
                {filtered.length===0 ? (
                  <div style={{ padding:"40px 0",textAlign:"center",color:"var(--text-color)",opacity:0.5 }}>Nothing to show in this view</div>
                ) : filtered.map(v=>(
                  <div key={v._id} style={{ display:"flex",gap:14,padding:"16px 0",borderBottom:"1px solid var(--border-color)",alignItems:"flex-start" }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:14,fontWeight:600,marginBottom:6,lineHeight:1.4 }}>{v.title}</div>
                      <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6 }}>
                        <StatusBadge status={v.status} />
                        <span style={{ background:"var(--card-bg)",color:"var(--accent-color)",fontSize:11,padding:"3px 9px",borderRadius:99, border: "1px solid var(--border-color)" }}>{v.category}</span>
                        <span style={{ fontSize:12,color:"var(--text-color)",opacity:0.5 }}>{daysAgo(v.createdAt)}</span>
                      </div>
                      {v.status==="approved" && <div style={{ fontSize:13,color:"var(--text-color)",opacity:0.6 }}>{fmtViews(v.views)} views • {fmtViews(v.likes)} likes</div>}
                      
                      {(v.status==="rejected"||v.status==="flagged") && v.ai?.reasons?.length>0 && (
                        <div style={{ marginTop:8,padding:"10px 14px",borderRadius:8,background:"rgba(229,85,85,0.05)",border:"1px solid #7A1F1F",fontSize:13,color:"#E55555" }}>
                          <strong style={{ display:"block", marginBottom:4 }}><ShieldIcon /> AI Moderation Note:</strong>
                          <ul style={{ margin:0, paddingLeft:20, opacity:0.9 }}>
                            {v.ai.reasons.map((r,i) => <li key={i}>{r}</li>)}
                          </ul>
                          {v.ai.suggestion && <div style={{ marginTop:6, color:"#F0A500", fontSize:12 }}>💡 {v.ai.suggestion}</div>}
                        </div>
                      )}
                    </div>
                    <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                      {v.status==="approved" && (
                        <Link href={`/watch?id=${v._id}`} style={{ background:"var(--card-bg)",border:"1px solid var(--border-color)",color:"var(--text-color)",borderRadius:8,padding:"7px 12px",fontSize:12,display:"flex",alignItems:"center",gap:5, textDecoration:"none" }}>
                          <EyeIcon /> View
                        </Link>
                      )}
                      {(v.status==="rejected"||v.status==="draft") && (
                        <Link href="/upload" style={{ background:"rgba(46,204,113,0.1)",color:"var(--accent-color)",border:"1px solid var(--accent-color)",borderRadius:8,padding:"7px 12px",fontSize:12,display:"flex",alignItems:"center",gap:5, textDecoration:"none" }}>
                          <UploadIcon /> Fix
                        </Link>
                      )}
                      <button onClick={()=>deleteVideo(v._id)} style={{ background:"rgba(229,85,85,0.05)",border:"1px solid #7A1F1F",color:"#E55555",borderRadius:8,padding:"7px 10px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center" }}>
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab==="analytics" && (
            <>
              <h1 className="gnlow-text" style={{ fontSize:22,fontWeight:700,marginBottom:20 }}>Creator Performance</h1>
              <div style={{ display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" }}>
                {[{label:"Total Views",val:fmtViews(totalViews),color:"var(--accent-color)"},{label:"Total Likes",val:fmtViews(totalLikes),color:"#2ECC71"}].map(s=>(
                  <div key={s.label} className="glass-panel" style={{ flex:1,minWidth:150,borderRadius:14,padding:"20px 22px" }}>
                    <div style={{ fontSize:12,color:"var(--text-color)", opacity:0.6, marginBottom:10 }}>{s.label}</div>
                    <div style={{ fontSize:28,fontWeight:700,color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              <div className="glass-panel" style={{ borderRadius:14,padding:"24px",height:450,marginTop:24 }}>
                 <h3 style={{ fontSize:15,marginBottom:24 }}>Top Videos Performance</h3>
                 {chartData.length === 0 ? (
                    <div style={{color:"var(--text-color)", opacity:0.5, textAlign:"center", marginTop: 120}}>No activity to report yet. Start uploading safe content!</div>
                 ) : mounted ? (
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-color)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--text-color)" fontSize={11} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{background:"var(--bg-color)",border:"1px solid var(--accent-color)",borderRadius:8}} itemStyle={{fontSize:13}} labelStyle={{fontSize:12, color:"var(--text-color)", opacity:0.6, marginBottom:4}} cursor={{fill:"var(--glass-bg)"}} />
                            <Legend wrapperStyle={{paddingTop:20, fontSize:12}} />
                            <Bar dataKey="Views" fill="var(--accent-color)" radius={[4,4,0,0]} maxBarSize={50} />
                            <Bar dataKey="Likes" fill="#2ECC71" radius={[4,4,0,0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                 ) : <div style={{ height:"85%", background:"var(--card-bg)", borderRadius:8 }} />}
              </div>
            </>
          )}

          {activeTab==="notifications" && (
            <>
              <h1 className="gnlow-text" style={{ fontSize:22,fontWeight:700,marginBottom:20 }}>Notifications Center</h1>
              <div className="glass-panel" style={{ borderRadius:14,padding:"10px 20px", overflow:"hidden" }}>
                {notifs.length===0 ? (
                   <div style={{ padding:"40px 0",textAlign:"center",color:"var(--text-color)",opacity:0.5 }}>Nothing new to report. Your platform status is healthy.</div>
                ) : notifs.map(n=>(
                  <div key={n._id} style={{ display:"flex",gap:14,padding:"16px 0",borderBottom:"1px solid var(--border-color)",alignItems:"flex-start", opacity: n.read ? 0.7 : 1 }}>
                    <div style={{ width:40,height:40,borderRadius:"50%",background:"var(--glass-bg)",color:"var(--accent-color)",display:"flex",alignItems:"center",justifyContent:"center", border: "1px solid var(--border-color)" }}>
                      <BellIcon />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14,fontWeight:600,marginBottom:4,color:"var(--text-color)" }}>{n.title}</div>
                      <div style={{ fontSize:13,color:"var(--text-color)",opacity:0.6,marginBottom:6 }}>{n.desc}</div>
                      <div style={{ fontSize:11,color:"var(--text-color)",opacity:0.4 }}>{daysAgo(n.createdAt)}</div>
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

export default function CreatorDashboard() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh",background:"var(--bg-color)",color:"var(--text-color)",padding:40 }}>Loading Studio...</div>}>
      <CreatorDashboardContent />
    </Suspense>
  );
}
