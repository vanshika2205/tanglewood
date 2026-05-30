"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useUI } from "@/lib/UIContext";
import { ShieldIcon, SearchIcon, UploadIcon, UserIcon, MenuIcon } from "./Icons";

export default function Navbar({ onMenuToggle, collapsed }) {
  const pathname = usePathname();
  const router   = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { uiMode, colorMode, setUiMode, toggleColorMode } = useUI();
  const [q,        setQ]        = useState(searchParams?.get("search") || "");
  const [dropdown, setDropdown] = useState(false);

  useEffect(() => {
    setQ(searchParams?.get("search") || "");
  }, [searchParams]);

  const isAdmin   = pathname?.startsWith("/admin");
  const isCreator = pathname?.startsWith("/creator");
  const isUpload  = pathname?.startsWith("/upload");
  const isLogin   = pathname?.startsWith("/login");

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQ(val);
    if (val.trim()) {
      router.push(`/?search=${encodeURIComponent(val.trim())}`);
    } else {
      router.push(`/`);
    }
  };

  const isAdminUser = session?.user?.role === "admin" || session?.user?.role === "moderator";
  const isModern = uiMode === "modern";

  const themes = [
    { id: "classic", label: "Classic", icon: "📺" },
    { id: "modern", label: "Modern", icon: "✨" },
    { id: "cyber", label: "Cyberpunk", icon: "🌌" },
    { id: "minimalist", label: "Minimalist", icon: "🌑" },
  ];

  return (
    <header className={isModern ? "glass-panel" : ""} style={{ 
      position:"fixed",top:0,left:0,right:0,zIndex:100,height:56,
      background:isModern ? "transparent" : "var(--bg-color)",
      borderBottom:"1px solid var(--border-color)",
      display:"flex",alignItems:"center",padding:"0 16px",gap:8,
      boxShadow: "var(--shadow)"
    }}>

      {/* Logo */}
      <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:collapsed?56:200,transition:"min-width 0.2s" }}>
        {onMenuToggle && (
          <button onClick={onMenuToggle} style={{ background:"none",border:"none",color:"var(--text-color)",cursor:"pointer",padding:8,borderRadius:"50%",display:"flex" }}>
            <MenuIcon />
          </button>
        )}
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:7 }}>
          <div className="glass-panel" style={{ width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent-color)" }}>
            <ShieldIcon />
          </div>
          {!collapsed && <span className="gnlow-text" style={{ fontSize:17,fontWeight:700,letterSpacing:"-0.02em", color:"var(--text-color)" }}>सम<span style={{ color:"var(--accent-color)" }}>तुलन</span></span>}
        </Link>
      </div>

      {/* Search bar */}
      {!isAdmin && !isCreator && !isUpload && !isLogin && (
        <form onSubmit={e=>e.preventDefault()} style={{ flex:1,maxWidth:560,display:"flex",margin:"0 auto" }}>
          <input value={q} onChange={handleSearchChange} placeholder="Search videos..."
            style={{ 
              flex:1,background:"var(--card-bg)",
              border:"1px solid var(--border-color)",
              borderRight:"none",borderRadius:"40px 0 0 40px",padding:"9px 18px",color:"var(--text-color)",fontSize:14,fontFamily:"inherit",outline:"none" 
            }} />
          <button type="submit" style={{ 
            background:"var(--glass-bg)",
            border:"1px solid var(--border-color)",
            borderRadius:"0 40px 40px 0",padding:"0 16px",color:"var(--text-color)",cursor:"pointer",display:"flex",alignItems:"center" 
          }}>
            <SearchIcon />
          </button>
        </form>
      )}

      {/* Right side */}
      <div style={{ display:"flex",alignItems:"center",gap:12,marginLeft:"auto" }}>

        {session ? (
          <>
            {isAdminUser && !isAdmin && (
              <Link href="/admin/content" style={{ color:"var(--accent-color)",fontSize:12,padding:"6px 14px",border:"1px solid var(--accent-color)",borderRadius:20,background:"var(--glass-bg)", fontWeight:600 }}>
                Admin
              </Link>
            )}

            {!isAdminUser && !isCreator && (
              <Link href="/creator" style={{ color:"var(--text-color)",opacity:0.7,fontSize:12,padding:"6px 14px",border:"1px solid var(--border-color)",borderRadius:20, fontWeight:600 }}>
                Studio
              </Link>
            )}

            {!isAdminUser && (
              <Link href="/upload" style={{ display:"flex",alignItems:"center",gap:5,background:"var(--accent-color)",color:colorMode === "dark" ? "#000" : "#FFF",borderRadius:20,padding:"7px 18px",fontSize:13,fontWeight:700, boxShadow:"var(--shadow)" }}>
                <UploadIcon /> Upload
              </Link>
            )}
          </>
        ) : (
          <>
            <Link href="/login" className="interactive-card" style={{ display:"flex",alignItems:"center",gap:5,borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:600, border:"1px solid var(--border-color)" }}>
              Login
            </Link>
            <Link href="/login?callbackUrl=/upload" style={{ display:"flex",alignItems:"center",gap:5,background:"var(--accent-color)",color:colorMode === "dark" ? "#000" : "#FFF",borderRadius:20,padding:"7px 18px",fontSize:13,fontWeight:700, boxShadow:"var(--shadow)" }}>
              <UploadIcon /> Upload
            </Link>
          </>
        )}

        {/* Avatar dropdown */}
        <div style={{ position:"relative" }}>
          <div onClick={()=>setDropdown(p=>!p)} style={{ width:36,height:36,borderRadius:"50%",background:"var(--glass-bg)",border:"2px solid var(--border-color)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--accent-color)",fontSize:13,fontWeight:700, overflow:"hidden", transition:"border-color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent-color)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border-color)"}>
            {session ? (session.user.image ? <img src={session.user.image} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : session.user.name?.charAt(0).toUpperCase()) : <UserIcon />}
          </div>

          {dropdown && (
            <div onClick={()=>setDropdown(false)} style={{ position:"fixed",inset:0,zIndex:199 }} />
          )}
          {dropdown && (
            <div className="glass-panel" style={{ position:"absolute",top:46,right:0,background:"var(--card-bg)",borderRadius:14,padding:8,minWidth:230,zIndex:200,boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
              
              {/* UI Customizer Section */}
              <div style={{ padding:"12px 8px", borderBottom:"1px solid var(--border-color)", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <span style={{ fontSize:10, color:"var(--text-color)", opacity:0.5, fontWeight:800, letterSpacing:"0.08em" }}>THEME ENGINE</span>
                  <button onClick={toggleColorMode} style={{ 
                    background:"var(--glass-bg)", border:"1px solid var(--border-color)", borderRadius:12, padding:"3px 10px", color:"var(--text-color)", fontSize:10, fontWeight:700, cursor:"pointer"
                  }}>
                    {colorMode === "dark" ? "🌙 DARK" : "☀️ LIGHT"}
                  </button>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:6 }}>
                  {themes.map(theme => (
                    <button 
                      key={theme.id}
                      onClick={() => setUiMode(theme.id)}
                      style={{
                        padding:"10px 4px", fontSize:11, fontWeight:700, borderRadius:10, cursor:"pointer",
                        background: uiMode === theme.id ? "var(--accent-color)" : "var(--glass-bg)",
                        color: uiMode === theme.id ? (colorMode === "dark" ? "#000" : "#FFF") : "var(--text-color)",
                        border: "1px solid var(--border-color)",
                        display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                        transition:"all 0.2s"
                      }}
                    >
                      <span style={{fontSize:16}}>{theme.icon}</span>
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {session ? (
                <>
                  <div style={{ padding:"12px",borderBottom:"1px solid var(--border-color)",marginBottom:6 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:"var(--text-color)" }}>{session.user.name}</div>
                    <div style={{ fontSize:11,color:"var(--text-color)",opacity:0.5,marginTop:2 }}>{session.user.email}</div>
                  </div>

                  <Link href="/profile" style={{ display:"block",padding:"10px 12px",fontSize:13,color:"var(--text-color)",opacity:0.8,borderRadius:8, fontWeight:500 }} onMouseEnter={e=>e.currentTarget.style.background="var(--glass-bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                     Profile Settings
                  </Link>
                  <Link href={`/channel/${session.user.id}`} style={{ display:"block",padding:"10px 12px",fontSize:13,color:"var(--text-color)",opacity:0.8,borderRadius:8, fontWeight:500 }} onMouseEnter={e=>e.currentTarget.style.background="var(--glass-bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                     Your Channel
                  </Link>

                  <div style={{ height:1,background:"var(--border-color)",margin:"8px 4px" }} />
                  <button onClick={()=>signOut({ callbackUrl:"/" })} style={{ width:"100%",textAlign:"left",padding:"10px 12px",fontSize:13,color:"#E55555",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",borderRadius:8, fontWeight:600 }} onMouseEnter={e=>e.currentTarget.style.background="rgba(229,85,85,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" style={{ display:"block",padding:"10px 12px",fontSize:13,color:"var(--accent-color)",borderRadius:8, fontWeight:700 }} onMouseEnter={e=>e.currentTarget.style.background="var(--glass-bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Login / Register</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
