"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldIcon, SearchIcon, UploadIcon, UserIcon, MenuIcon } from "./Icons";

export default function Navbar({ onMenuToggle, collapsed }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [q, setQ] = useState("");

  const isAdmin   = pathname?.startsWith("/admin");
  const isCreator = pathname?.startsWith("/creator");
  const isUpload  = pathname?.startsWith("/upload");

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) router.push(`/?search=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      height:56, background:"#0F0F0F", borderBottom:"1px solid #272727",
      display:"flex", alignItems:"center", padding:"0 16px", gap:8,
    }}>
      {/* Hamburger + Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:8, minWidth: collapsed ? 56 : 200, transition:"min-width 0.2s" }}>
        {onMenuToggle && (
          <button onClick={onMenuToggle} style={{ background:"none", border:"none", color:"#F1F1F1", cursor:"pointer", padding:8, borderRadius:"50%", display:"flex" }}>
            <MenuIcon />
          </button>
        )}
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:26,height:26,borderRadius:6,background:"rgba(46,204,113,0.15)",border:"1px solid #1A7A43",display:"flex",alignItems:"center",justifyContent:"center",color:"#2ECC71" }}>
            <ShieldIcon />
          </div>
          {!collapsed && (
            <span style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.02em" }}>
              सम<span style={{ color:"#2ECC71" }}>तुलन</span>
            </span>
          )}
        </Link>
      </div>

      {/* Search */}
      {!isAdmin && !isCreator && !isUpload && (
        <form onSubmit={handleSearch} style={{ flex:1, maxWidth:560, display:"flex", margin:"0 auto" }}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search videos..."
            style={{ flex:1, background:"#121212", border:"1px solid #303030", borderRight:"none", borderRadius:"40px 0 0 40px", padding:"9px 18px", color:"#F1F1F1", fontSize:14, outline:"none" }}
          />
          <button type="submit" style={{ background:"#272727", border:"1px solid #303030", borderRadius:"0 40px 40px 0", padding:"0 16px", color:"#F1F1F1", cursor:"pointer", display:"flex", alignItems:"center" }}>
            <SearchIcon />
          </button>
        </form>
      )}

      {/* Right */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
        {!isAdmin   && <Link href="/admin/content" style={{ color:"#AAAAAA", fontSize:12, padding:"6px 12px", border:"1px solid #272727", borderRadius:20 }}>Admin</Link>}
        {!isCreator && <Link href="/creator"       style={{ color:"#AAAAAA", fontSize:12, padding:"6px 12px", border:"1px solid #272727", borderRadius:20 }}>Studio</Link>}
        <Link href="/upload" style={{ display:"flex", alignItems:"center", gap:5, background:"#2ECC71", color:"#071209", borderRadius:20, padding:"7px 16px", fontSize:13, fontWeight:700 }}>
          <UploadIcon /> Upload
        </Link>
        <div style={{ width:34,height:34,borderRadius:"50%",background:"#272727",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#AAAAAA" }}>
          <UserIcon />
        </div>
      </div>
    </header>
  );
}
