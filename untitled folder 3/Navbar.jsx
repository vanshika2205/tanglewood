"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ShieldIcon, SearchIcon, UploadIcon, UserIcon, MenuIcon } from "./Icons";

export default function Navbar({ onMenuToggle, collapsed }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const [q,        setQ]        = useState("");
  const [dropdown, setDropdown] = useState(false);

  const isAdmin   = pathname?.startsWith("/admin");
  const isCreator = pathname?.startsWith("/creator");
  const isUpload  = pathname?.startsWith("/upload");
  const isLogin   = pathname?.startsWith("/login");

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) router.push(`/?search=${encodeURIComponent(q.trim())}`);
  };

  const isAdminUser = session?.user?.role === "admin" || session?.user?.role === "moderator";

  return (
    <header style={{ position:"fixed",top:0,left:0,right:0,zIndex:100,height:56,background:"#0F0F0F",borderBottom:"1px solid #272727",display:"flex",alignItems:"center",padding:"0 16px",gap:8 }}>

      {/* Logo */}
      <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:collapsed?56:200,transition:"min-width 0.2s" }}>
        {onMenuToggle && (
          <button onClick={onMenuToggle} style={{ background:"none",border:"none",color:"#F1F1F1",cursor:"pointer",padding:8,borderRadius:"50%",display:"flex" }}>
            <MenuIcon />
          </button>
        )}
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:7 }}>
          <div style={{ width:26,height:26,borderRadius:6,background:"rgba(46,204,113,0.15)",border:"1px solid #1A7A43",display:"flex",alignItems:"center",justifyContent:"center",color:"#2ECC71" }}>
            <ShieldIcon />
          </div>
          {!collapsed && <span style={{ fontSize:17,fontWeight:700,letterSpacing:"-0.02em" }}>सम<span style={{ color:"#2ECC71" }}>तुलन</span></span>}
        </Link>
      </div>

      {/* Search bar */}
      {!isAdmin && !isCreator && !isUpload && !isLogin && (
        <form onSubmit={handleSearch} style={{ flex:1,maxWidth:560,display:"flex",margin:"0 auto" }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search videos..."
            style={{ flex:1,background:"#121212",border:"1px solid #303030",borderRight:"none",borderRadius:"40px 0 0 40px",padding:"9px 18px",color:"#F1F1F1",fontSize:14,fontFamily:"inherit",outline:"none" }} />
          <button type="submit" style={{ background:"#272727",border:"1px solid #303030",borderRadius:"0 40px 40px 0",padding:"0 16px",color:"#F1F1F1",cursor:"pointer",display:"flex",alignItems:"center" }}>
            <SearchIcon />
          </button>
        </form>
      )}

      {/* Right side */}
      <div style={{ display:"flex",alignItems:"center",gap:8,marginLeft:"auto" }}>

        {session ? (
          <>
            {/* Admin panel — only for admin/moderator */}
            {isAdminUser && !isAdmin && (
              <Link href="/admin/content" style={{ color:"#F0A500",fontSize:12,padding:"6px 12px",border:"1px solid #7A5200",borderRadius:20,background:"rgba(240,165,0,0.08)" }}>
                Admin
              </Link>
            )}

            {/* Creator studio — only for creators */}
            {!isAdminUser && !isCreator && (
              <Link href="/creator" style={{ color:"#AAAAAA",fontSize:12,padding:"6px 12px",border:"1px solid #272727",borderRadius:20 }}>
                Studio
              </Link>
            )}

            {/* Upload — for creators only */}
            {!isAdminUser && (
              <Link href="/upload" style={{ display:"flex",alignItems:"center",gap:5,background:"#2ECC71",color:"#071209",borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:700 }}>
                <UploadIcon /> Upload
              </Link>
            )}
          </>
        ) : (
          /* Not logged in */
          <Link href="/login" style={{ display:"flex",alignItems:"center",gap:5,background:"#2ECC71",color:"#071209",borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:700 }}>
            Login / Register
          </Link>
        )}

        {/* Avatar dropdown */}
        <div style={{ position:"relative" }}>
          <div onClick={()=>setDropdown(p=>!p)} style={{ width:34,height:34,borderRadius:"50%",background:session?"rgba(46,204,113,0.2)":"#272727",border:`1px solid ${session?"#1A7A43":"#333"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:session?"#2ECC71":"#AAAAAA",fontSize:13,fontWeight:700 }}>
            {session ? session.user.name?.charAt(0).toUpperCase() : <UserIcon />}
          </div>

          {dropdown && (
            <div onClick={()=>setDropdown(false)} style={{ position:"fixed",inset:0,zIndex:199 }} />
          )}
          {dropdown && (
            <div style={{ position:"absolute",top:42,right:0,background:"#1a1a1a",border:"1px solid #272727",borderRadius:12,padding:8,minWidth:200,zIndex:200,boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
              {session ? (
                <>
                  <div style={{ padding:"10px 12px",borderBottom:"1px solid #272727",marginBottom:6 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:"#F1F1F1" }}>{session.user.name}</div>
                    <div style={{ fontSize:11,color:"#717171",marginTop:2 }}>{session.user.email}</div>
                    <span style={{ fontSize:10,color:"#2ECC71",marginTop:6,background:"rgba(46,204,113,0.1)",border:"1px solid #1A7A43",borderRadius:4,padding:"2px 8px",display:"inline-block" }}>
                      {session.user.role}
                    </span>
                  </div>

                  {!isAdminUser && (
                    <Link href="/creator" style={{ display:"block",padding:"9px 12px",fontSize:13,color:"#AAAAAA",borderRadius:8 }}>
                      Creator Studio
                    </Link>
                  )}
                  {isAdminUser && (
                    <Link href="/admin/content" style={{ display:"block",padding:"9px 12px",fontSize:13,color:"#F0A500",borderRadius:8 }}>
                      Admin Panel
                    </Link>
                  )}

                  <div style={{ height:1,background:"#272727",margin:"6px 0" }} />
                  <button onClick={()=>signOut({ callbackUrl:"/" })} style={{ width:"100%",textAlign:"left",padding:"9px 12px",fontSize:13,color:"#E55555",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",borderRadius:8 }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" style={{ display:"block",padding:"9px 12px",fontSize:13,color:"#2ECC71",borderRadius:8 }}>Login</Link>
                  <Link href="/login" style={{ display:"block",padding:"9px 12px",fontSize:13,color:"#AAAAAA",borderRadius:8 }}>Register</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
