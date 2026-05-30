"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useUI } from "@/lib/UIContext";
import { ShieldIcon, SearchIcon, UploadIcon, UserIcon, MenuIcon, BellIcon, MicIcon } from "./Icons";

export default function Navbar({ onMenuToggle, collapsed }) {
  const pathname = usePathname();
  const router   = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { uiMode, colorMode, setUiMode, toggleColorMode } = useUI();
  const [q,        setQ]        = useState(searchParams?.get("search") || "");
  const [dropdown, setDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    setQ(searchParams?.get("search") || "");
  }, [searchParams]);

  const isAdminPath   = pathname?.startsWith("/admin");
  const isCreatorPath = pathname?.startsWith("/creator");
  const isUploadPath  = pathname?.startsWith("/upload");
  const isLoginPath   = pathname?.startsWith("/login");

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQ(val);
    if (val.trim()) {
      router.push(`/?search=${encodeURIComponent(val.trim())}`);
    } else {
      router.push(`/`);
    }
  };

  const userRole = session?.user?.role?.toLowerCase() || "";
  const isAdminUser = userRole === "admin" || userRole === "moderator";
  const isCreatorUser = userRole === "creator";
  const isModern = uiMode === "modern";

  const themes = [
    { id: "classic", label: "Classic", icon: "📺" },
    { id: "modern", label: "Modern", icon: "✨" },
    { id: "cyber", label: "Cyberpunk", icon: "🌌" },
    { id: "minimalist", label: "Minimalist", icon: "🌑" },
  ];

  const notifications = [
    { id: 1, title: "Naya Bharat uploaded a new video", time: "2h ago", read: false },
    { id: 2, title: "Aapke video par 100 likes complete hue!", time: "5h ago", read: true },
    { id: 3, title: "System: Content moderation pass successfully", time: "Yesterday", read: true },
  ];

  return (
    <header className={isModern ? "glass-panel" : ""} style={{ 
      position:"fixed",top:0,left:0,right:0,zIndex:100,height:56,
      background:isModern ? "transparent" : "var(--bg-color)",
      borderBottom:"1px solid var(--border-color)",
      display:"flex",alignItems:"center",padding:"0 16px",gap:16,
      boxShadow: "var(--shadow)"
    }}>

      {/* Logo */}
      <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:collapsed?56:200,transition:"min-width 0.2s" }}>
        {onMenuToggle && (
          <button onClick={onMenuToggle} style={{ background:"none",border:"none",color:"var(--text-color)",cursor:"pointer",padding:8,borderRadius:"50%",display:"flex" }}>
            <MenuIcon />
          </button>
        )}
        <Link href="/" className="logo-underline" style={{ display:"flex",alignItems:"center",gap:7 }}>
          <div className="glass-panel" style={{ width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent-color)", transition:"transform 0.3s ease" }}>
            <ShieldIcon />
          </div>
          {!collapsed && <span className="gnlow-text" style={{ fontSize:18,fontWeight:800,letterSpacing:"-0.03em", color:"var(--text-color)" }}>सम<span style={{ color:"var(--accent-color)" }}>तुलन</span></span>}
        </Link>
      </div>

      {/* Search Bar Segment */}
      {!isAdminPath && !isCreatorPath && !isUploadPath && !isLoginPath && (
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:12, maxWidth:720, margin:"0 auto" }}>
          <form onSubmit={e=>e.preventDefault()} style={{ flex:1, display:"flex", position:"relative" }}>
            <input className="interactive-element" value={q} onChange={handleSearchChange} placeholder="Search videos..."
              style={{ 
                flex:1, background:"var(--card-bg)",
                border:"1px solid var(--border-color)",
                borderRight:"none", borderRadius:"40px 0 0 40px", padding:"10px 24px", color:"var(--text-color)", fontSize:14, fontFamily:"inherit", outline:"none" 
              }} />
            <button type="submit" className="interactive-element" style={{ 
              background:"var(--glass-bg)",
              border:"1px solid var(--border-color)",
              borderRadius:"0 40px 40px 0", padding:"0 20px", color:"var(--text-color)", cursor:"pointer", display:"flex", alignItems:"center" 
            }}>
              <SearchIcon />
            </button>
          </form>
          <button style={{ width:40, height:40, borderRadius:"50%", background:"var(--card-bg)", border:"1px solid var(--border-color)", color:"var(--text-color)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <MicIcon />
          </button>
        </div>
      )}

      {/* Right side Actions */}
      <div style={{ display:"flex",alignItems:"center",gap:16,marginLeft:"auto" }}>

        {session ? (
          <>
            <Link href="/upload" style={{ color:"var(--text-color)", opacity:0.8, cursor:"pointer" }} title="Create"><UploadIcon /></Link>
            
            {/* Notifications */}
            <div style={{ position:"relative" }}>
              <button 
                onClick={()=>setNotifOpen(!notifOpen)}
                style={{ background:"none", border:"none", color:"var(--text-color)", opacity:0.8, cursor:"pointer", position:"relative" }}
              >
                <BellIcon />
                <span style={{ position:"absolute", top:-2, right:-2, background:"var(--accent-color)", color:"#000", fontSize:9, fontWeight:800, borderRadius:"50%", minWidth:14, height:14, display:"flex", alignItems:"center", justifyContent:"center" }}>3</span>
              </button>
              
              {notifOpen && (
                <>
                  <div onClick={()=>setNotifOpen(false)} style={{ position:"fixed", inset:0, zIndex:199 }} />
                  <div className="glass-panel" style={{ position:"absolute", top:36, right:-50, background:"var(--card-bg)", borderRadius:14, minWidth:320, zIndex:200, padding:8 }}>
                    <div style={{ padding:"12px", borderBottom:"1px solid var(--border-color)", fontWeight:700, fontSize:14 }}>Notifications</div>
                    <div style={{ maxHeight:400, overflowY:"auto" }}>
                      {notifications.map(n => (
                        <div key={n.id} style={{ padding:"12px", borderBottom:"1px solid var(--border-color)", opacity: n.read ? 0.6 : 1, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="var(--glass-bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{ fontSize:13, fontWeight: n.read?400:600, color:"var(--text-color)", marginBottom:4 }}>{n.title}</div>
                          <div style={{ fontSize:11, opacity:0.5 }}>{n.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ position:"relative" }}>
              <div onClick={()=>setDropdown(p=>!p)} style={{ width:34,height:34,borderRadius:"50%",background:"var(--glass-bg)",border:"2px solid var(--border-color)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--accent-color)",fontSize:13,fontWeight:700, overflow:"hidden" }}>
                {session.user.image ? <img src={session.user.image} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : session.user.name?.charAt(0).toUpperCase()}
              </div>

              {dropdown && (
                <>
                  <div onClick={()=>setDropdown(false)} style={{ position:"fixed",inset:0,zIndex:199 }} />
                  <div className="glass-panel" style={{ position:"absolute",top:42,right:0,background:"var(--card-bg)",borderRadius:14,padding:8,minWidth:240,zIndex:200 }}>
                    <div style={{ padding:"12px", borderBottom:"1px solid var(--border-color)", marginBottom:6 }}>
                      <div style={{ fontSize:13, fontWeight:700 }}>{session.user.name}</div>
                      <div style={{ fontSize:11, color:"var(--text-color)", opacity:0.5 }}>{session.user.email}</div>
                    </div>

                    {/* UI Engine */}
                    <div style={{ padding:"8px", borderBottom:"1px solid var(--border-color)", marginBottom:6 }}>
                       <div style={{ fontSize:10, fontWeight:800, opacity:0.5, marginBottom:8 }}>THEME ENGINE</div>
                       <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                          {themes.map(t => (
                            <button key={t.id} onClick={()=>setUiMode(t.id)} style={{ padding:6, fontSize:11, borderRadius:8, border:"1px solid var(--border-color)", background: uiMode===t.id?"var(--accent-color)":"var(--glass-bg)", color:uiMode===t.id? (colorMode==="dark"?"#000":"#FFF") : "var(--text-color)", cursor:"pointer" }}>{t.label}</button>
                          ))}
                       </div>
                    </div>

                    <Link href={`/channel/${session.user.id}`} style={{ display:"block", padding:"10px 12px", fontSize:13, color:"var(--text-color)", borderRadius:8 }} onMouseEnter={e=>e.currentTarget.style.background="var(--glass-bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Your Channel</Link>
                    <Link href="/creator" style={{ display:"block", padding:"10px 12px", fontSize:13, color:"var(--text-color)", borderRadius:8 }} onMouseEnter={e=>e.currentTarget.style.background="var(--glass-bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Samtulan Studio</Link>
                    {isAdminUser && (
                      <Link href="/admin/content" style={{ display:"block", padding:"10px 12px", fontSize:13, color:"var(--accent-color)", borderRadius:8, fontWeight:700 }} onMouseEnter={e=>e.currentTarget.style.background="var(--glass-bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Admin Dashboard</Link>
                    )}
                    <Link href="/settings" style={{ display:"block", padding:"10px 12px", fontSize:13, color:"var(--text-color)", borderRadius:8 }} onMouseEnter={e=>e.currentTarget.style.background="var(--glass-bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Settings</Link>
                    <button onClick={()=>toggleColorMode()} style={{ width:"100%", textAlign:"left", padding:"10px 12px", fontSize:13, color:"var(--text-color)", background:"none", border:"none", cursor:"pointer" }}>Appearance: {colorMode==="dark"?"Dark":"Light"}</button>
                    
                    <div style={{ height:1, background:"var(--border-color)", margin:"6px 0" }} />
                    <button onClick={()=>signOut({ callbackUrl:"/" })} style={{ width:"100%", textAlign:"left", padding:"10px 12px", fontSize:13, color:"#E55555", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Sign out</button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <Link href="/login" style={{ display:"flex",alignItems:"center",gap:6,border:"1px solid var(--border-color)",borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:600, color:"var(--accent-color)" }}>
            <UserIcon /> Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
