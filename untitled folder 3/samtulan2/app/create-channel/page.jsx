"use client";
export const dynamic = "force-dynamic";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useUI } from "@/lib/UIContext";

function CreateChannelContent() {
  const router = useRouter();
  const { colorMode } = useUI();
  const [form, setForm] = useState({ channelName: "", channelBio: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.channelName.trim()) {
      setError("Channel Name is required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/channel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/creator");
      } else {
        setError(data.error || "Failed to create channel.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const inpStyles = { 
    width: "100%", 
    background: "var(--card-bg)", 
    border: "1px solid var(--border-color)", 
    borderRadius: 10, 
    padding: "14px 16px", 
    color: "var(--text-color)", 
    fontSize: 14, 
    fontFamily: "inherit", 
    outline: "none", 
    transition: "all 0.2s" 
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-color)", color: "var(--text-color)", fontFamily: "'Inter','Roboto',sans-serif" }}>
      <Navbar />
      <style>{`.fi:focus{border-color:var(--accent-color)!important; box-shadow: 0 0 10px var(--accent-color);}`}</style>

      <main style={{ maxWidth: 500, margin: "0 auto", padding: "120px 24px 60px" }}>
        
        <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="glass-panel" style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid var(--accent-color)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "var(--shadow)" }}>🎬</div>
            <h1 className="gnlow-text" style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px 0" }}>Create Your Channel</h1>
            <p style={{ color: "var(--text-color)", opacity: 0.6, fontSize: 15, margin: 0, lineHeight: 1.5 }}>Join thousands of creators on Samtulan. Share your voice safely with the world.</p>
        </div>

        {error && (
            <div style={{ padding: "12px 16px", background: "rgba(229,85,85,0.1)", border: "1px solid #7A1F1F", color: "#E55555", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel" style={{ background: "var(--card-bg)", borderRadius: 16, padding: "32px 24px" }}>
            <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "var(--text-color)", opacity: 0.8, display: "block", marginBottom: 8, fontWeight: 600 }}>Channel Name <span style={{ color: "#E55555" }}>*</span></label>
                <input className="fi" style={inpStyles} placeholder="E.g., Tech Reviews India" value={form.channelName} onChange={e => setForm({ ...form, channelName: e.target.value })} required />
                <div style={{ fontSize: 11, color: "var(--text-color)", opacity: 0.4, marginTop: 6 }}>This represents you and your content. You can change it later.</div>
            </div>

            <div style={{ marginBottom: 30 }}>
                <label style={{ fontSize: 13, color: "var(--text-color)", opacity: 0.8, display: "block", marginBottom: 8, fontWeight: 600 }}>Channel Bio (Optional)</label>
                <textarea className="fi" style={{ ...inpStyles, minHeight: 100, resize: "vertical" }} placeholder="Tell viewers what your channel is about..." value={form.channelBio} onChange={e => setForm({ ...form, channelBio: e.target.value })} />
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", background: "var(--accent-color)", color: colorMode === "dark" ? "#000" : "#FFF", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.2s", boxShadow: "var(--shadow)" }}>
                {loading ? "Creating Channel..." : "Create Channel"}
            </button>
        </form>

      </main>
    </div>
  );
}

export default function CreateChannelPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh",background:"var(--bg-color)",color:"var(--text-color)",padding:40 }}>Loading...</div>}>
      <CreateChannelContent />
    </Suspense>
  );
}
