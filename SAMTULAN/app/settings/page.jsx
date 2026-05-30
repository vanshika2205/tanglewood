"use client";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useUI } from "@/lib/UIContext";
import { SettingsIcon, CCIcon, ShieldIcon, BellIcon } from "@/components/Icons";

function SettingsContent() {
  const { data: session, status } = useSession();
  const { 
    uiMode, setUiMode, colorMode, setColorMode, 
    captionsEnabled, setCaptionsEnabled, captionSize, setCaptionSize, 
    autoPlay, setAutoPlay 
  } = useUI();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/settings");
    }
  }, [status, router]);

  if (!mounted || status === "loading") return <div style={{ minHeight: "100vh", background: "var(--bg-color)", color: "var(--text-color)", paddingTop: 100, textAlign: "center" }}>Loading Settings...</div>;

  const Section = ({ title, desc, children }) => (
    <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--text-color)", opacity: 0.6, marginBottom: 16 }}>{desc}</p>
        <div className="glass-panel" style={{ borderRadius: 16, padding: "20px", border: "1px solid var(--border-color)" }}>
            {children}
        </div>
    </div>
  );

  const Toggle = ({ active, onToggle, label }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-color)", lastChild: { borderBottom: "none" } }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
        <button onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, background: active ? "var(--accent-color)" : "var(--card-bg)", border: "1px solid var(--border-color)", position: "relative", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ position: "absolute", top: 2, left: active ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
        </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-color)", color: "var(--text-color)", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--glass-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-color)", border: "1.5px solid var(--accent-color)" }}>
                <SettingsIcon />
            </div>
            <h1 className="gnlow-text" style={{ fontSize: 32, fontWeight: 800 }}>Platform Settings</h1>
        </div>

        <Section title="Interface & Appearance" desc="Customize how Samtulan looks for you.">
            <Toggle label="Dark Mode" active={colorMode === "dark"} onToggle={() => setColorMode(colorMode === "dark" ? "light" : "dark")} />
            <div style={{ padding: "12px 0" }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Theme Preset</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {["classic", "modern", "cyber", "minimalist"].map(m => (
                        <button key={m} onClick={() => setUiMode(m)} style={{ background: uiMode === m ? "var(--accent-color)" : "var(--card-bg)", color: uiMode === m ? "#000" : "var(--text-color)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{m}</button>
                    ))}
                </div>
            </div>
        </Section>

        <Section title="Playback & Captions" desc="Manage your video watching experience.">
            <Toggle label="Enable Captions (CC) by default" active={captionsEnabled} onToggle={() => setCaptionsEnabled(!captionsEnabled)} />
            <Toggle label="Auto-play videos" active={autoPlay} onToggle={() => setAutoPlay(!autoPlay)} />
            <div style={{ padding: "12px 0" }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Caption Text Size</div>
                <div style={{ display: "flex", gap: 10 }}>
                    {["small", "medium", "large"].map(sz => (
                        <button key={sz} onClick={() => setCaptionSize(sz)} style={{ flex: 1, background: captionSize === sz ? "var(--accent-color)" : "var(--card-bg)", color: captionSize === sz ? "#000" : "var(--text-color)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{sz}</button>
                    ))}
                </div>
            </div>
        </Section>

        <Section title="Privacy & Safety" desc="Configure how we protect your data and viewing history.">
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", background: "rgba(46,204,113,0.1)", borderRadius: 12, border: "1px solid var(--accent-color)", marginTop: 8 }}>
                <ShieldIcon />
                <div style={{ fontSize: 13, fontWeight: 500 }}>AI Safe Mode is currently <strong>ACTIVE</strong> for your account.</div>
            </div>
        </Section>

        <div style={{ marginTop: 40, textAlign: "center", opacity: 0.4, fontSize: 12 }}>
            Samtulan Platform v1.2.0 • Build ID: SAFE_2026_A
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
