"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useUI } from "@/lib/UIContext";
import { UploadIcon, SaveIcon, LikeIcon, VideoIcon, SettingsIcon } from "@/components/Icons";

function ProfileSettingsContent() {
  const { data: session, status, update } = useSession();
  const { uiMode, colorMode } = useUI();
  const isModern = uiMode === "modern";
  const isCyber = uiMode === "cyber";
  const isMinimal = uiMode === "minimalist";
  const router = useRouter();

  const [form, setForm] = useState({ name: "", bio: "", avatar: "", channelName: "", channelBio: "" });
  const [stats, setStats] = useState({ followers: 0, following: 0, saved: 0, liked: 0, hasChannel: false });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.id) {
      Promise.all([
        fetch(`/api/user/profile?id=${session.user.id}`).then(r => r.json()),
        fetch(`/api/user/me`).then(r => r.json())
      ])
      .then(([profD, meD]) => {
        if (profD?.user) {
          setForm(prev => ({
            ...prev,
            name: profD.user.name || "",
            bio: profD.user.bio || "",
            avatar: profD.user.avatar || "",
          }));
        }
        if (meD) {
          setStats({
            followers: meD.followers || 0,
            following: meD.following || 0,
            saved: (meD.savedVideos || []).length,
            liked: (meD.likedVideos || []).length,
            hasChannel: meD.hasChannel || false
          });
          setForm(prev => ({ ...prev, channelName: meD.channelName || "", channelBio: meD.channelBio || "" }));
        }
      })
      .finally(() => setFetching(false));
    }
  }, [status, session]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
       showToast("Please select an image file", "danger");
       return;
    }
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
       const res = await fetch("/api/upload", { method: "POST", body: formData });
       const data = await res.json();
       if (data.success && data.fileUrl) {
          setForm(prev => ({ ...prev, avatar: data.fileUrl }));
          showToast("✓ Image uploaded! Don't forget to Save Settings.");
       } else throw new Error();
    } catch(err) {
       showToast("❌ Failed to upload image", "danger");
    } finally {
       setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast("✓ Profile updated securely");
        update({ name: form.name }); 
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast("❌ Failed to update profile", "danger");
    } finally {
      setLoading(false);
    }
  };

  const inp = { width: "100%", background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "14px 16px", color: "var(--text-color)", fontSize: 14, fontFamily: "inherit", outline: "none", transition:"all 0.2s" };

  if (status === "loading" || fetching) return <div style={{ minHeight: "100vh", background: "var(--bg-color)", color: "var(--text-color)", paddingTop: 80, textAlign: "center" }}>Loading Profile...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-color)", color: "var(--text-color)", fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
      <Navbar />
      <style>{`.fi:focus{border-color:var(--accent-color)!important; box-shadow: 0 0 10px var(--accent-color);}`}</style>

      {toast && (
        <div className="glass-panel" style={{ position: "fixed", top: 68, right: 20, zIndex: 999, padding: "12px 20px", borderRadius: 10, color: toast.type === "success" ? "var(--accent-color)" : "#E55555", fontSize: 13, fontWeight: 600 }}>
          {toast.msg}
        </div>
      )}

      {/* Hero Banner */}
      <div style={{ height: 220, background: "linear-gradient(135deg, var(--accent-color), var(--bg-color))", opacity: 0.8, borderBottom: "1px solid var(--border-color)", position: "relative", paddingTop: 56 }}>
         <div style={{ maxWidth: 840, margin: "0 auto", position: "relative", height: "100%" }}>
            <div style={{ position: "absolute", bottom: -45, left: 24, display: "flex", alignItems: "flex-end", gap: 24 }}>
                <div 
                    onClick={() => fileRef.current?.click()}
                    style={{ width: 130, height: 130, borderRadius: "50%", background: "var(--card-bg)", border: "4px solid var(--bg-color)", cursor: "pointer", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow)" }}>
                    {form.avatar ? <img src={form.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 50, color: "var(--accent-color)", fontWeight: 700 }}>{form.name?.charAt(0).toUpperCase() || "U"}</span>}
                    
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}
                         onMouseEnter={e => e.currentTarget.style.opacity = 1}
                         onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                        <UploadIcon />
                        <span style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>Update</span>
                    </div>
                    {uploadingAvatar && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--accent-color)", fontSize:12, fontWeight:700 }}>Uploading...</div>}
                    <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                </div>
                
                <div style={{ paddingBottom: 14 }}>
                    <h1 className="gnlow-text" style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>{form.name || "Your Name"}</h1>
                    <div style={{ color: "var(--text-color)", opacity: 0.6, fontSize: 15, marginTop: 6, display: "flex", gap: 14 }}>
                        <span><strong style={{ color: "var(--accent-color)" }}>{stats.followers}</strong> Subscribers</span>
                        <span><strong style={{ color: "var(--accent-color)" }}>{stats.following}</strong> Subscribed</span>
                    </div>
                </div>
            </div>
         </div>
      </div>

      <main style={{ maxWidth: 840, margin: "0 auto", padding: "80px 24px 40px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 40, alignItems: "start" }}>
        
        <section style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <h2 className="gnlow-text" style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Basic Profile</h2>
              <p style={{ color: "var(--text-color)", opacity: 0.6, fontSize: 13, marginBottom: 20 }}>Your personal identity across Samtulan.</p>

              <div className="glass-panel" style={{ borderRadius: 16, padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: "var(--text-color)", opacity: 0.6, display: "block", marginBottom: 8, fontWeight: 600 }}>Display Name <span style={{ color:"#E55555" }}>*</span></label>
                    <input className="fi" style={inp} placeholder="Your real name or alias" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div style={{ marginBottom: 26 }}>
                    <label style={{ fontSize: 12, color: "var(--text-color)", opacity: 0.6, display: "block", marginBottom: 8, fontWeight: 600 }}>Short Bio</label>
                    <textarea className="fi" style={{ ...inp, minHeight: 80, resize: "vertical", lineHeight: 1.6 }} placeholder="A little about yourself..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                </div>
                <button onClick={handleSave} disabled={loading} style={{ width: "100%", background: "var(--accent-color)", color: colorMode === "dark" ? "#000" : "#FFF", border: "none", borderRadius: 10, padding: "14px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.2s", boxShadow: "var(--shadow)" }}>
                    {loading ? "Saving Profile..." : "Save Profile Details"}
                </button>
              </div>
            </div>

            <div>
              <h2 className="gnlow-text" style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Your Channel</h2>
              <p style={{ color: "var(--text-color)", opacity: 0.6, fontSize: 13, marginBottom: 20 }}>The identity viewers see when watching your videos.</p>

              <div className="glass-panel" style={{ borderRadius: 16, padding: 24 }}>
                {!stats.hasChannel ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>You don't have a channel</div>
                    <div style={{ color: "var(--text-color)", opacity: 0.6, fontSize: 13, marginBottom: 20 }}>Create a channel to start uploading videos and sharing with the world.</div>
                    <Link href="/create-channel" style={{ display: "inline-block", background: "var(--accent-color)", color: colorMode === "dark" ? "#000" : "#FFF", padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Create Channel →</Link>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 12, color: "var(--text-color)", opacity: 0.6, display: "block", marginBottom: 8, fontWeight: 600 }}>Channel Name <span style={{ color:"#E55555" }}>*</span></label>
                        <input className="fi" style={inp} placeholder="Tech Reviews India" value={form.channelName} onChange={e => setForm({ ...form, channelName: e.target.value })} required />
                    </div>
                    <div style={{ marginBottom: 26 }}>
                        <label style={{ fontSize: 12, color: "var(--text-color)", opacity: 0.6, display: "block", marginBottom: 8, fontWeight: 600 }}>Channel Bio / About</label>
                        <textarea className="fi" style={{ ...inp, minHeight: 120, resize: "vertical", lineHeight: 1.6 }} placeholder="Tell viewers what your channel is about..." value={form.channelBio} onChange={e => setForm({ ...form, channelBio: e.target.value })} />
                    </div>
                    <button onClick={handleSave} disabled={loading} style={{ width: "100%", background: "var(--accent-color)", color: colorMode === "dark" ? "#000" : "#FFF", border: "none", borderRadius: 10, padding: "14px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.2s", boxShadow: "var(--shadow)" }}>
                        {loading ? "Saving Channel..." : "Save Channel Details"}
                    </button>
                  </>
                )}
              </div>
            </div>
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
             <div className="glass-panel" style={{ borderRadius: 16, padding: 20 }}>
                 <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-color)", opacity: 0.5, marginBottom: 16 }}>Activity</h3>
                 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                     <Link href="/?feed=saved" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", padding: "8px 12px", background: "var(--glass-bg)", borderRadius: 10, transition: "background 0.2s" }}>
                         <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-color)" }}><SaveIcon /> Saved</span>
                         <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-color)" }}>{stats.saved}</span>
                     </Link>
                     <Link href="/?feed=liked" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", padding: "8px 12px", background: "var(--glass-bg)", borderRadius: 10, transition: "background 0.2s" }}>
                         <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-color)" }}><LikeIcon /> Liked</span>
                         <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-color)" }}>{stats.liked}</span>
                     </Link>
                     <Link href="/settings" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", padding: "8px 12px", background: "var(--glass-bg)", borderRadius: 10, transition: "background 0.2s" }}>
                         <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-color)" }}><SettingsIcon /> Platform Settings</span>
                         <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-color)" }}>→</span>
                     </Link>
                 </div>
             </div>

             <div className="glass-panel" style={{ borderRadius: 16, padding: "10px 0" }}>
                 <Link href="/creator" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", color: "var(--text-color)", textDecoration: "none", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--glass-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                     <div style={{ color: "#4A9EDB" }}><VideoIcon /></div>
                     <div>
                         <div style={{ fontSize: 14, fontWeight: 600 }}>Creator Studio</div>
                         <div style={{ fontSize: 12, color: "var(--text-color)", opacity:0.4 }}>Manage uploads</div>
                     </div>
                 </Link>
                 <Link href="/upload" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", color: "var(--text-color)", textDecoration: "none", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--glass-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                     <div style={{ color: "var(--accent-color)" }}><UploadIcon /></div>
                     <div>
                         <div style={{ fontSize: 14, fontWeight: 600 }}>Upload Video</div>
                         <div style={{ fontSize: 12, color: "var(--text-color)", opacity:0.4 }}>Share content</div>
                     </div>
                 </Link>
             </div>
        </aside>

      </main>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh",background:"var(--bg-color)",color:"var(--text-color)",padding:40 }}>Loading Profile...</div>}>
      <ProfileSettingsContent />
    </Suspense>
  );
}
