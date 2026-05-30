"use client";
import React, { useState, useEffect } from "react";
import { useUI } from "@/lib/UIContext";
import { scanURL } from "@/lib/security";

export default function SecurityShield() {
  const { linkShieldEnabled, colorMode } = useUI();
  const [blockedData, setBlockedData] = useState(null); // { url, reason, risk }

  useEffect(() => {
    if (!linkShieldEnabled) return;

    const handleGlobalClick = (e) => {
      // Find closest anchor tag
      let target = e.target;
      while (target && target.tagName !== "A" && target.parentNode) {
        target = target.parentNode;
      }

      if (target && target.tagName === "A" && target.href) {
        const url = target.href;
        const result = scanURL(url);

        if (!result.safe) {
          e.preventDefault();
          e.stopPropagation();
          setBlockedData({ url, reason: result.reason, risk: result.risk });
        }
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => document.removeEventListener("click", handleGlobalClick, true);
  }, [linkShieldEnabled]);

  if (!blockedData) return null;

  const isDark = colorMode === "dark";

  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center",
        padding: "20px", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
        transition: "opacity 0.3s ease-in-out"
      }}
    >
      <div 
        className="glass-panel"
        style={{
          margin: "auto", maxWidth: "500px", width: "100%",
          background: isDark ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)",
          borderRadius: "24px", padding: "40px", textAlign: "center",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
        }}
      >
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>🛡️</div>
        
        <h2 style={{ 
          color: "#FF4B4B", fontSize: "24px", fontWeight: "900", 
          marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" 
        }}>
          Security Alert: Harmful Link Blocked
        </h2>
        
        <p style={{ 
          color: isDark ? "#CCC" : "#666", fontSize: "16px", 
          lineHeight: "1.6", marginBottom: "24px" 
        }}>
          Samtulan AI has blocked this link because it appears to be a <strong>{blockedData.risk}-risk</strong> threat.
          Our scanning system detected: <em>"{blockedData.reason}"</em>
        </p>

        <div style={{ 
          background: "rgba(0,0,0,0.1)", borderRadius: "12px", padding: "12px", 
          fontSize: "12px", color: "#888", marginBottom: "32px", 
          wordBreak: "break-all", fontStyle: "italic" 
        }}>
          URL: {blockedData.url}
        </div>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button 
            onClick={() => setBlockedData(null)}
            style={{
              padding: "14px 28px", borderRadius: "30px", border: "none",
              background: "#4A9EDB", color: "#FFF", fontWeight: "700",
              cursor: "pointer", transition: "transform 0.2s"
            }}
            onMouseOver={e => e.target.style.transform = "scale(1.05)"}
            onMouseOut={e => e.target.style.transform = "scale(1)"}
          >
            ← Back to Safety
          </button>
          
          <button 
            onClick={() => {
              const url = blockedData.url;
              setBlockedData(null);
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            style={{
              padding: "14px 28px", borderRadius: "30px", border: "1px solid #FF4B4B",
              background: "transparent", color: "#FF4B4B", fontWeight: "600",
              cursor: "pointer", fontSize: "13px"
            }}
          >
            Proceed Anyway
          </button>
        </div>
        
        <p style={{ marginTop: "24px", fontSize: "11px", color: "#777" }}>
          This protection is powered by Samtulan's In-built AI Shield Extension.
        </p>
      </div>
    </div>
  );
}
