"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { HomeIcon, VideoIcon, ChartIcon, BellIcon, SettingsIcon, UploadIcon, TrashIcon, EyeIcon, WarningIcon, CheckIcon, ShieldIcon } from "@/components/Icons";

const STATUS_CFG = {
  approved:    { label:"Live",          color:"#2ECC71", bg:"rgba(46,204,113,0.1)",  border:"#1A7A43" },
  ai_scanning: { label:"AI Scanning",   color:"#4A9EDB", bg:"rgba(74,158,219,0.1)",  border:"#1A4A7A" },
  human_review:{ label:"Human Review",  color:"#F0A500", bg:"rgba(240,165,0,0.1)",   border:"#7A5200" },
  flagged:     { label:"Flagged",       color:"#F0A500", bg:"rgba(240,165,0,0.1)",   border:"#7A5200" },
  rejected:    { label:"Rejected",      color:"#E55555", bg:"rgba(229,85,85,0.1)",   border:"#7A1F1F" },
  pending:     { label:"Pending",       color:"#AAAAAA", bg:"rgba(170,170,170,0.1)", border:"#555"    },
  draft:       { label:"Draft",         color:"#717171", bg:"rgba(113,113,113,0.1)", border:"#444"    },
};

const DEMO_VIDEOS = [
  { _id:"1", title:"Python Seekhein — Complete Beginners Guide", category:"Education", duration:"18:42", status:"approved",     views:234891, likes:18000, createdAt: new Date(Date.now()-3*86400000) },
  { _id:"2", title:"React Hooks Tutorial — useState aur useEffect", category:"Tech",  duration:"25:10", status:"approved",     views:98231,  likes:7200,  createdAt: new Date(Date.now()-7*86400000) },
  { _id:"3", title:"CSS Grid aur Flexbox — Complete Layout Guide",  category:"Tech",  duration:"20:15", status:"human_review", views:0,      likes:0,     createdAt: new Date(Date.now()-1*86400000) },
  { _id:"4", title:"JavaScript Advanced Concepts",                  category:"Tech",  duration:"32:00", status:"ai_scanning",  views:0,      likes:0,     createdAt: new Date(Date.now()-0.5*86400000) },
  { _id:"5", title:"Node.js Backend — REST API Banao",              category:"Tech",  duration:"45:30", status:"flagged",      views:0,      likes:0,     createdAt: new Date(Date.now()-5*86400000), ai:{ reasons:["Background mein inappropriate content detected"] } },
  { _id:"6", title:"Database Design — SQL vs NoSQL",                category:"Tech",  duration:"28:44", status:"rejected",     views:0,      likes:0,     createdAt: new Date(Date.now()-7*86400000), ai:{ reasons:["Misleading thumbnail detected"] } },
];

function fmtViews(n) {
  if(!n)return "0"; if(n>=1e5)return (n/1e5).toFixed(1)+"L"; if(n>=1e3)return (n/1e3).toFixed(1)+"K"; return String(n);
}
function daysAgo(d) {
  const diff = Math.floor((Date.now()-new Date(d))/86400000);
  return diff===0?"Aaj":diff===1?"Kal":diff+" din pehle";
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status]||STATUS_CFG.pending;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:99,background:c.bg,border:`1px solid ${c.border}`,color:c.color,fontSize:12,fontWeight:600,whiteSpace:"nowrap" }}>{c.label}</span>;
}

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [videos,    setVideos]    = useState(DEMO_VIDEOS);
  const [filter,    setFilter]    = useState("all");
  const [collapsed, setCollapsed] = useState(false);
  const [toast,     setToast]     = useState(null);
  const W = collapsed ? 70 : 220;

  useEffect(() => {
    fetch("/api/videos?limit=20").then(r=>r.ok?r.json():null).then(data=>{
      if(data?.videos?.length>0) setVideos(data.videos);
    }).catch(()=>{});
  },[]);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2500); };
  const deleteVideo = (id) => { setVideos(v=>v.filter(x=>x._id!==id)); showToast("Video delete ho gaya","danger"); };

  const filtered = videos.filter(v => filter==="all" || v.status===filter);
  const liveCount = videos.filter(v=>v.status==="approved").length;
  const reviewCount = videos.filter(v=>["ai_scanning","human_review","flagged"].includes(v.status)).length;
  const rejectedCount = videos.filter(v=>v.status==="rejected").length;

  const NAV = [
    { id:"dashboard", label:"Dashboard", Icon:HomeIcon },
    { id:"videos",    label:"My Videos", Icon:VideoIcon },
    { id:"analytics", label:"Analytics", Icon:ChartIcon },
    { id:"notifs",    label:"Notifications", Icon:BellIcon },
    { id:"settings",  label:"Settings",  Icon:SettingsIcon },
  ];

  const totalViews = videos.reduce((a,v)=>a+(v.views||0),0);
  const totalLikes = videos.reduce((a,v)=>a+(v.likes||0),0);

  return (
    <div style={{ minHeight:"100vh",background:"#0F0F0F" }}>
      <Navbar onMenuToggle={()=>setCollapsed(p=>!p)} collapsed={collapsed} />

      {toast && (
        <div style={{ position:"fixed",top:68,right:20,zIndex:999,padding:"12px 20px",borderRadius:10,background:toast.type==="success"?"#0D2318":"#1A0A0A",border:`1px solid ${toast.type==="success"?"#1A7A43":"#7A1F1F"}`,color:toast.type==="success"?"#2ECC71":"#E55555",fontSize:13,fontWeight:600,animation:"slideIn 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display:"flex",paddingTop:56 }}>
        {/* Sidebar */}
        <aside style={{ position:"fixed",top:56,left:0,bottom:0,width:W,background:"#0F0F0F",borderRight:"1px solid #1a1a1a",padding:"10px 8px",transition:"width 0.25s",zIndex:50,overflowY:"auto" }}>
          {!collapsed && (
            <div style={{ margin:"0 4px 16px",padding:"14px",background:"#1a1a1a",border:"1px solid #272727",borderRadius:12 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                <div style={{ width:38,height:38,borderRadius:"50%",background:"rgba(46,204,113,0.2)",border:"1px solid #1A7A43",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#2ECC71" }}>CP</div>
                <div>
                  <div style={{ fontSize:13,fontWeight:700 }}>CodeWithPriya</div>
                  <div style={{ fontSize:11,color:"#717171" }}>Verified Creator</div>
                </div>
              </div>
              <div style={{ display:"flex",gap:6 }}>
                {[{v:liveCount,l:"Live",c:"#2ECC71"},{v:reviewCount,l:"Review",c:"#F0A500"},{v:rejectedCount,l:"Rejected",c:"#E55555"}].map(s=>(
                  <div key={s.l} style={{ flex:1,textAlign:"center",padding:"6px 4px",background:"#272727",borderRadius:8 }}>
                    <div style={{ fontSize:15,fontWeight:700,color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:10,color:"#717171" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{ width:"100%",display:"flex",alignItems:"center",gap:collapsed?0:14,justifyContent:collapsed?"center":"flex-start",padding:collapsed?"13px 0":"11px 14px",marginBottom:2,borderRadius:10,border:`1px solid ${activeTab===item.id?"#272727":"transparent"}`,background:activeTab===item.id?"#1a1a1a":"transparent",color:activeTab===item.id?"#F1F1F1":"#AAAAAA",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}>
              <span style={{ flexShrink:0 }}><item.Icon /></span>
              {!collapsed && <span style={{ fontSize:13,fontWeight:activeTab===item.id?600:400 }}>{item.label}</span>}
            </button>
          ))}
        </aside>

        <main style={{ flex:1,marginLeft:W,padding:"24px 28px 60px",transition:"margin-left 0.25s",minWidth:0 }}>

          {activeTab==="dashboard" && (
            <>
              <h1 style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Creator Dashboard</h1>
              <p style={{ color:"#717171",fontSize:13,marginBottom:24 }}>Apne channel ka overview</p>
              <div style={{ display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" }}>
                {[{label:"Total Views",val:fmtViews(totalViews),color:"#4A9EDB"},{label:"Total Likes",val:fmtViews(totalLikes),color:"#2ECC71"},{label:"Live Videos",val:liveCount,color:"#2ECC71"},{label:"In Review",val:reviewCount,color:"#F0A500"}].map(s=>(
                  <div key={s.label} style={{ flex:1,minWidth:150,background:"#1a1a1a",border:"1px solid #272727",borderRadius:14,padding:"20px 22px" }}>
                    <div style={{ fontSize:12,color:"#AAAAAA",marginBottom:10 }}>{s.label}</div>
                    <div style={{ fontSize:28,fontWeight:700,color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"#1a1a1a",border:"1px solid #272727",borderRadius:14,padding:"20px 22px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                  <div style={{ fontSize:15,fontWeight:700 }}>Recent Videos</div>
                  <button onClick={()=>setActiveTab("videos")} style={{ background:"none",border:"none",color:"#2ECC71",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>Sab dekhein →</button>
                </div>
                {videos.slice(0,3).map(v=>(
                  <div key={v._id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #272727" }}>
                    <div style={{ flex:1,minWidth:0,marginRight:12 }}>
                      <div style={{ fontSize:13,fontWeight:600,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{v.title}</div>
                      <div style={{ display:"flex",gap:8,alignItems:"center" }}><StatusBadge status={v.status} /><span style={{ fontSize:12,color:"#717171" }}>{daysAgo(v.createdAt)}</span></div>
                    </div>
                    {v.status==="approved" && <span style={{ fontSize:13,color:"#AAAAAA",flexShrink:0 }}>{fmtViews(v.views)} views</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab==="videos" && (
            <>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12 }}>
                <div>
                  <h1 style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>My Videos</h1>
                  <p style={{ color:"#717171",fontSize:13 }}>{videos.length} videos total</p>
                </div>
                <Link href="/upload" style={{ display:"flex",alignItems:"center",gap:6,background:"#2ECC71",color:"#071209",borderRadius:10,padding:"10px 20px",fontSize:14,fontWeight:700 }}><UploadIcon /> Naya Upload</Link>
              </div>

              {/* Filters */}
              <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
                {[{key:"all",label:"Sabhi"},{key:"approved",label:"Live"},{key:"human_review",label:"Human Review"},{key:"ai_scanning",label:"AI Scanning"},{key:"flagged",label:"Flagged"},{key:"rejected",label:"Rejected"}].map(f=>(
                  <button key={f.key} onClick={()=>setFilter(f.key)} style={{ background:filter===f.key?"#F1F1F1":"#272727",color:filter===f.key?"#0F0F0F":"#AAAAAA",border:"none",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:filter===f.key?700:400,cursor:"pointer",fontFamily:"inherit" }}>{f.label}</button>
                ))}
              </div>

              <div style={{ background:"#1a1a1a",border:"1px solid #272727",borderRadius:14,padding:"4px 20px" }}>
                {filtered.length===0 ? (
                  <div style={{ padding:"40px 0",textAlign:"center",color:"#555" }}>Koi video nahi</div>
                ) : filtered.map(v=>(
                  <div key={v._id} style={{ display:"flex",gap:14,padding:"16px 0",borderBottom:"1px solid #1a1a1a",alignItems:"flex-start" }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:14,fontWeight:600,marginBottom:6,lineHeight:1.4 }}>{v.title}</div>
                      <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6 }}>
                        <StatusBadge status={v.status} />
                        <span style={{ background:"#272727",color:"#717171",fontSize:11,padding:"3px 9px",borderRadius:99 }}>{v.category}</span>
                        <span style={{ fontSize:12,color:"#717171" }}>{daysAgo(v.createdAt)}</span>
                      </div>
                      {v.status==="approved" && <div style={{ fontSize:13,color:"#AAAAAA" }}>{fmtViews(v.views)} views • {fmtViews(v.likes)} likes</div>}
                      {(v.status==="rejected"||v.status==="flagged") && v.ai?.reasons?.length>0 && (
                        <div style={{ marginTop:6,padding:"8px 12px",borderRadius:8,background:"rgba(229,85,85,0.08)",border:"1px solid #7A1F1F",fontSize:12,color:"#E55555" }}>
                          {v.ai.reasons[0]}
                        </div>
                      )}
                    </div>
                    <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                      {v.status==="approved" && (
                        <Link href={`/watch?id=${v._id}`} style={{ background:"#272727",border:"none",color:"#AAAAAA",borderRadius:8,padding:"7px 12px",fontSize:12,display:"flex",alignItems:"center",gap:5 }}>
                          <EyeIcon /> View
                        </Link>
                      )}
                      {(v.status==="rejected"||v.status==="draft") && (
                        <Link href="/upload" style={{ background:"rgba(46,204,113,0.1)",border:"1px solid #1A7A43",color:"#2ECC71",borderRadius:8,padding:"7px 12px",fontSize:12,display:"flex",alignItems:"center",gap:5 }}>
                          <UploadIcon /> Re-upload
                        </Link>
                      )}
                      <button onClick={()=>deleteVideo(v._id)} style={{ background:"rgba(229,85,85,0.08)",border:"1px solid #7A1F1F",color:"#E55555",borderRadius:8,padding:"7px 10px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center" }}>
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
              <h1 style={{ fontSize:22,fontWeight:700,marginBottom:20 }}>Analytics</h1>
              <div style={{ display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" }}>
                {[{label:"Total Views",val:fmtViews(totalViews),color:"#4A9EDB"},{label:"Total Likes",val:fmtViews(totalLikes),color:"#2ECC71"},{label:"Live Videos",val:liveCount,color:"#2ECC71"},{label:"In Review",val:reviewCount,color:"#F0A500"}].map(s=>(
                  <div key={s.label} style={{ flex:1,minWidth:150,background:"#1a1a1a",border:"1px solid #272727",borderRadius:14,padding:"20px 22px" }}>
                    <div style={{ fontSize:12,color:"#AAAAAA",marginBottom:10 }}>{s.label}</div>
                    <div style={{ fontSize:28,fontWeight:700,color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"#1a1a1a",border:"1px solid #272727",borderRadius:14,padding:"20px 22px" }}>
                <div style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>Top Videos</div>
                {videos.filter(v=>v.status==="approved").map(v=>(
                  <div key={v._id} style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #272727" }}>
                    <div style={{ fontSize:13,flex:1,minWidth:0,marginRight:16,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{v.title}</div>
                    <span style={{ fontSize:13,color:"#2ECC71",flexShrink:0 }}>{fmtViews(v.views)} views</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab==="notifs" && (
            <>
              <h1 style={{ fontSize:22,fontWeight:700,marginBottom:20 }}>Notifications</h1>
              {[
                { icon:"✓",color:"#2ECC71",bg:"rgba(46,204,113,0.1)",border:"#1A7A43",title:"Video Live Ho Gaya!",desc:"'Python Seekhein' ab platform pe available hai.",time:"3 din pehle" },
                { icon:"⚑",color:"#F0A500",bg:"rgba(240,165,0,0.1)", border:"#7A5200",title:"Video Flagged",      desc:"'Node.js Backend' mein issues hain.",time:"5 din pehle" },
                { icon:"✕",color:"#E55555",bg:"rgba(229,85,85,0.1)", border:"#7A1F1F",title:"Video Reject Hua",   desc:"'Database Design' guidelines ke against tha.",time:"1 hafte pehle" },
              ].map((n,i)=>(
                <div key={i} style={{ display:"flex",gap:14,padding:"16px",background:"#1a1a1a",border:"1px solid #272727",borderRadius:12,marginBottom:10 }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",flexShrink:0,background:n.bg,border:`1px solid ${n.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:n.color,fontWeight:700 }}>{n.icon}</div>
                  <div>
                    <div style={{ fontSize:14,fontWeight:600,marginBottom:4 }}>{n.title}</div>
                    <div style={{ fontSize:13,color:"#AAAAAA" }}>{n.desc}</div>
                    <div style={{ fontSize:12,color:"#555",marginTop:4 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab==="settings" && (
            <>
              <h1 style={{ fontSize:22,fontWeight:700,marginBottom:20 }}>Settings</h1>
              <div style={{ background:"#1a1a1a",border:"1px solid #272727",borderRadius:14,padding:"20px 22px",marginBottom:14 }}>
                <div style={{ fontSize:15,fontWeight:700,marginBottom:16 }}>Channel Info</div>
                {[{l:"Channel Name",v:"CodeWithPriya"},{l:"Email",v:"creator@example.com"},{l:"Category",v:"Education & Tech"}].map(f=>(
                  <div key={f.l} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #272727" }}>
                    <span style={{ fontSize:13,color:"#AAAAAA" }}>{f.l}</span>
                    <span style={{ fontSize:13 }}>{f.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(46,204,113,0.07)",border:"1px solid #1A7A43",borderRadius:12,padding:"16px 18px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                  <span style={{ color:"#2ECC71" }}><ShieldIcon /></span>
                  <span style={{ fontSize:14,fontWeight:600,color:"#2ECC71" }}>Samtulan Verified Creator</span>
                </div>
                <div style={{ fontSize:13,color:"#AAAAAA",lineHeight:1.6 }}>Aapke videos AI + Human moderation se guzarte hain aur sirf tab live hote hain jab dono approve karein.</div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
