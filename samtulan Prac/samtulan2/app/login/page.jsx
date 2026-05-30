"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon, ShieldIcon } from "@/components/Icons";
import { useUI } from "@/lib/UIContext";

function LoginContent() {
  const router = useRouter();
  const { colorMode } = useUI();
  const [tab,     setTab]     = useState("login");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [form,    setForm]    = useState({ name:"", email:"", password:"", role:"creator" });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    const res = await signIn("credentials", { email: form.email, password: form.password, website: form.website, redirect: false });
    if (res?.error) setError("Email ya password galat hai");
    else router.push("/");
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    const res  = await fetch("/api/register", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/");
    setLoading(false);
  };

  const inpStyles = { 
    width:"100%", 
    background:"var(--card-bg)", 
    border:"1px solid var(--border-color)", 
    borderRadius:12, 
    padding:"14px 16px", 
    color:"var(--text-color)", 
    fontSize:14, 
    fontFamily:"inherit", 
    outline:"none",
    transition: "all 0.2s"
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-color)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Inter', sans-serif" }}>
      <style>{`.fi:focus{border-color:var(--accent-color)!important; box-shadow: 0 0 10px var(--accent-color);}`}</style>
      <div style={{ width:"100%", maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div className="glass-panel" style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:60, height:60, borderRadius:16, color:"var(--accent-color)", border:"1.5px solid var(--accent-color)", marginBottom:16, fontSize:28, boxShadow:"var(--shadow)" }}>
            <ShieldIcon />
          </div>
          <div className="gnlow-text" style={{ fontSize:28, fontWeight:800, color:"var(--text-color)" }}>सम<span style={{ color:"var(--accent-color)" }}>तुलन</span></div>
          <div style={{ fontSize:14, color:"var(--text-color)", opacity:0.5, marginTop:4, letterSpacing:"0.05em" }}>CONTENT DETOX PIPELINE</div>
        </div>

        {/* Card */}
        <div className="glass-panel" style={{ borderRadius:20, overflow:"hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:"1px solid var(--border-color)" }}>
            {[["login","Login"],["register","Register"]].map(([t,l]) => (
              <button key={t} onClick={()=>{ setTab(t); setError(""); }} style={{ flex:1, padding:"18px", background:"transparent", border:"none", color:tab===t?"var(--text-color)":"var(--text-color)", opacity:tab===t?1:0.4, fontSize:15, fontWeight:tab===t?700:500, cursor:"pointer", fontFamily:"inherit", borderBottom:tab===t?"3px solid var(--accent-color)":"3px solid transparent", transition:"all 0.2s" }}>{l}</button>
            ))}
          </div>

          <div style={{ padding:32 }}>
            {error && <div style={{ background:"rgba(229,85,85,0.1)", border:"1px solid #7A1F1F", color:"#E55555", borderRadius:12, padding:"12px 16px", fontSize:13, marginBottom:20 }}>{error}</div>}

            <form onSubmit={tab==="login" ? handleLogin : handleRegister}>
              {/* HONEYPOT FIELD (Bot Protection) */}
              <div style={{ display: "none" }}>
                <input type="text" name="website" value={form.website || ""} onChange={e => setForm({ ...form, website: e.target.value })} tabIndex="-1" autoComplete="off" />
              </div>

              {tab==="register" && (
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:12, color:"var(--text-color)", opacity:0.6, display:"block", marginBottom:8, fontWeight:600 }}>Pura Naam *</label>
                  <input className="fi" style={inpStyles} placeholder="Apna naam likhein" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                </div>
              )}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, color:"var(--text-color)", opacity:0.6, display:"block", marginBottom:8, fontWeight:600 }}>Email Address *</label>
                <input className="fi" style={inpStyles} type="email" placeholder="example@samtulan.in" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
              </div>
              <div style={{ marginBottom: tab==="register" ? 16 : 24, position: "relative" }}>
                <label style={{ fontSize:12, color:"var(--text-color)", opacity:0.6, display:"block", marginBottom:8, fontWeight:600 }}>Password *</label>
                <input className="fi" style={{...inpStyles, paddingRight:44}} type={showPassword ? "text" : "password"} placeholder={tab==="register"?"Strong password banayein":"Apna password daalein"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position:"absolute", right:12, bottom:12, background:"none", border:"none", color:"var(--text-color)", opacity:0.4, cursor:"pointer", padding:4, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {tab==="register" && (
                <div style={{ marginBottom:24, padding:"12px 16px", background:"var(--glass-bg)", borderRadius:12, fontSize:12, color:"var(--text-color)", opacity:0.7, border:"1px solid var(--border-color)", lineHeight:1.5 }}>
                  🛡️ By default, you are starting as a <strong>Creator</strong>. Content moderation roles are assigned by system admins.
                </div>
              )}
              <button type="submit" disabled={loading} style={{ width:"100%", background:"var(--accent-color)", color:colorMode === "dark" ? "#000" : "#FFF", border:"none", borderRadius:12, padding:"15px", fontSize:16, fontWeight:800, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", opacity:loading?0.7:1, boxShadow:"var(--shadow)", transition:"all 0.2s" }}>
                {loading ? "Processing..." : tab==="login" ? "Secure Login" : "Initialize Account"}
              </button>
            </form>

            <div style={{ marginTop:20, textAlign:"center", fontSize:14, color:"var(--text-color)", opacity:0.5 }}>
              {tab==="login" ? <>Naya account chahiye? <button onClick={()=>setTab("register")} style={{ background:"none",border:"none",color:"var(--accent-color)",cursor:"pointer",fontFamily:"inherit",fontSize:14, fontWeight:700 }}>Register Karein</button></> : <>Pehle se account hai? <button onClick={()=>setTab("login")} style={{ background:"none",border:"none",color:"var(--accent-color)",cursor:"pointer",fontFamily:"inherit",fontSize:14, fontWeight:700 }}>Login Karein</button></>}
            </div>

            <div style={{ marginTop:24, padding:"12px 16px", background:"var(--glass-bg)", border:"1.5px solid var(--accent-color)", borderRadius:12, fontSize:12, color:"var(--text-color)", opacity:0.8, display:"flex", gap:10, alignItems:"center", lineHeight:1.4 }}>
              <span style={{ color:"var(--accent-color)", fontSize:16 }}>🛡️</span> Content Detox: Only safe, verified accounts are allowed on Samtulan.
            </div>
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:24 }}>
          <Link href="/" style={{ color:"var(--text-color)", opacity:0.4, fontSize:14, textDecoration:"none", fontWeight:600 }}>← Wapas home pe jayein</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"var(--bg-color)", display:"flex", alignItems:"center", justifyContent:"center" }}>Initializing...</div>}>
      <LoginContent />
    </Suspense>
  );
}
