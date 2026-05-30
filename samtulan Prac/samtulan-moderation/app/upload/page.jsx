"use client";
import { useState, useRef, useCallback } from "react";

// ─── Samtulan color tokens ────────────────────────────────────────────────────
const C = {
  bg: "#0A0F0D",
  surface: "#111714",
  surfaceHover: "#171E1A",
  border: "#1E2B24",
  borderMid: "#2A3D30",
  accent: "#2ECC71",
  accentDim: "#1A7A43",
  accentGlow: "rgba(46,204,113,0.12)",
  text: "#E8F0EB",
  textMuted: "#6B8C76",
  textDim: "#3D5447",
  danger: "#E55555",
  dangerDim: "#7A1F1F",
  dangerGlow: "rgba(229,85,85,0.1)",
  warn: "#F0A500",
  warnDim: "#7A5200",
  warnGlow: "rgba(240,165,0,0.1)",
  safe: "#2ECC71",
  safeGlow: "rgba(46,204,113,0.08)",
};

// ─── AI Moderation categories ────────────────────────────────────────────────
const AI_CATEGORIES = [
  { key: "violence", label: "Violence / Gore", icon: "⚔" },
  { key: "adult", label: "Adult Content", icon: "🔞" },
  { key: "hate", label: "Hate Speech", icon: "⚡" },
  { key: "drugs", label: "Drugs / Substance", icon: "💊" },
  { key: "language", label: "Profanity", icon: "🗣" },
  { key: "copyright", label: "Copyright Risk", icon: "©" },
];

// ─── Simulate AI check (replace with real Claude API call) ───────────────────
async function runAICheck(file, metadata) {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 2200));

  // Fake scoring logic — in production: call Claude API here
  const scores = {};
  AI_CATEGORIES.forEach((c) => {
    scores[c.key] = Math.random() * 0.35; // mostly safe
  });

  // Sprinkle some variance based on title keywords
  const title = (metadata.title || "").toLowerCase();
  if (title.includes("fight") || title.includes("war")) scores.violence += 0.45;
  if (title.includes("adult") || title.includes("sexy")) scores.adult += 0.6;
  if (title.includes("drug") || title.includes("smoke")) scores.drugs += 0.4;

  const maxScore = Math.max(...Object.values(scores));
  const verdict =
    maxScore > 0.65 ? "rejected" : maxScore > 0.35 ? "flagged" : "approved";

  return { scores, verdict, confidence: Math.round((1 - maxScore) * 100) };
}

// ─── Helper: score bar color ─────────────────────────────────────────────────
function scoreColor(v) {
  if (v > 0.65) return C.danger;
  if (v > 0.35) return C.warn;
  return C.accent;
}

// ─── Components ──────────────────────────────────────────────────────────────

function Badge({ verdict }) {
  const cfg = {
    approved: { bg: C.safeGlow, border: C.accentDim, color: C.safe, label: "✓ AI Approved" },
    flagged: { bg: C.warnGlow, border: C.warnDim, color: C.warn, label: "⚑ Flagged for Review" },
    rejected: { bg: C.dangerGlow, border: C.dangerDim, color: C.danger, label: "✕ AI Rejected" },
  }[verdict] || {};

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 14px", borderRadius: 99,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: 13, fontWeight: 600, letterSpacing: "0.02em",
    }}>
      {cfg.label}
    </span>
  );
}

function ScoreBar({ label, icon, value }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: C.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>{label}
        </span>
        <span style={{ color: scoreColor(value), fontSize: 12, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: C.border, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          width: `${pct}%`,
          background: scoreColor(value),
          transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: pct > 65 ? `0 0 8px ${C.danger}80` : "none",
        }} />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.textMuted, fontSize: 14 }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        border: `2px solid ${C.borderMid}`, borderTopColor: C.accent,
        animation: "spin 0.8s linear infinite",
      }} />
      AI scanning content…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SamtulanUpload() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [meta, setMeta] = useState({ title: "", description: "", category: "", tags: "" });
  const [step, setStep] = useState("idle"); // idle | uploading | ai_check | result
  const [uploadPct, setUploadPct] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const fileRef = useRef();

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (f && f.type.startsWith("video/")) setFile(f);
  }, []);

  const simulateUpload = () =>
    new Promise((res) => {
      let p = 0;
      const id = setInterval(() => {
        p += Math.random() * 18 + 5;
        if (p >= 100) { p = 100; clearInterval(id); res(); }
        setUploadPct(Math.min(Math.round(p), 100));
      }, 180);
    });

  const handleSubmit = async () => {
    if (!file || !meta.title) return;
    setStep("uploading"); setUploadPct(0);
    await simulateUpload();
    setStep("ai_check");
    const result = await runAICheck(file, meta);
    setAiResult(result);
    setStep("result");
  };

  const reset = () => {
    setFile(null); setMeta({ title: "", description: "", category: "", tags: "" });
    setStep("idle"); setUploadPct(0); setAiResult(null);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const card = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: C.bg, border: `1px solid ${C.borderMid}`,
    borderRadius: 10, padding: "11px 14px",
    color: C.text, fontSize: 14, fontFamily: "inherit",
    outline: "none", transition: "border 0.2s",
  };

  const btnPrimary = {
    background: C.accent, color: "#071209",
    border: "none", borderRadius: 10,
    padding: "13px 28px", fontSize: 15,
    fontWeight: 700, cursor: "pointer",
    letterSpacing: "0.02em", transition: "opacity 0.15s",
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: C.text, padding: "40px 20px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.accentGlow, border: `1px solid ${C.accentDim}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>⚖</div>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
              सम<span style={{ color: C.accent }}>तुलन</span>
            </span>
            <span style={{
              marginLeft: 8, fontSize: 11, color: C.textMuted,
              border: `1px solid ${C.borderMid}`, borderRadius: 6,
              padding: "2px 8px", letterSpacing: "0.08em",
            }}>CREATOR STUDIO</span>
          </div>
          <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
            Upload karein → AI scan → Human review → Platform pe live
          </p>
        </div>

        {/* ── IDLE / FORM STATE ── */}
        {(step === "idle") && (
          <>
            {/* Drop Zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              style={{
                ...card,
                border: `2px dashed ${dragging ? C.accent : file ? C.accentDim : C.borderMid}`,
                background: dragging ? C.accentGlow : file ? "#0D1510" : C.surface,
                cursor: "pointer", textAlign: "center",
                padding: "40px 24px",
                transition: "all 0.2s",
              }}
            >
              <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={onDrop} />
              {file ? (
                <>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                  <div style={{ color: C.accent, fontWeight: 600, fontSize: 15 }}>{file.name}</div>
                  <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>
                    {(file.size / 1024 / 1024).toFixed(1)} MB • {file.type}
                  </div>
                  <div style={{ color: C.textDim, fontSize: 11, marginTop: 10 }}>
                    click to change file
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📤</div>
                  <div style={{ color: C.textMuted, fontSize: 15, fontWeight: 600 }}>
                    Video yahan drag karein
                  </div>
                  <div style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>
                    ya click karein • MP4, MOV, AVI • max 2GB
                  </div>
                </>
              )}
            </div>

            {/* Metadata Form */}
            <div style={card}>
              <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.1em", marginBottom: 18 }}>
                VIDEO DETAILS
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 6 }}>
                  Title <span style={{ color: C.danger }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  placeholder="Video ka title likhen…"
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                  onFocus={(e) => e.target.style.borderColor = C.accent}
                  onBlur={(e) => e.target.style.borderColor = C.borderMid}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 6 }}>Description</label>
                <textarea
                  style={{ ...inputStyle, resize: "vertical", minHeight: 80, lineHeight: 1.6 }}
                  placeholder="Video ke baare mein batayein…"
                  value={meta.description}
                  onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                  onFocus={(e) => e.target.style.borderColor = C.accent}
                  onBlur={(e) => e.target.style.borderColor = C.borderMid}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 6 }}>Category</label>
                  <select
                    style={{ ...inputStyle, cursor: "pointer" }}
                    value={meta.category}
                    onChange={(e) => setMeta({ ...meta, category: e.target.value })}
                  >
                    <option value="">Choose…</option>
                    <option>Education</option>
                    <option>Entertainment</option>
                    <option>Gaming</option>
                    <option>Cooking</option>
                    <option>Sports</option>
                    <option>Science & Tech</option>
                    <option>Kids</option>
                    <option>Music</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 6 }}>Tags</label>
                  <input
                    style={inputStyle}
                    placeholder="comedy, kids, fun…"
                    value={meta.tags}
                    onChange={(e) => setMeta({ ...meta, tags: e.target.value })}
                    onFocus={(e) => e.target.style.borderColor = C.accent}
                    onBlur={(e) => e.target.style.borderColor = C.borderMid}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              style={{
                ...btnPrimary,
                width: "100%", opacity: (!file || !meta.title) ? 0.4 : 1,
                cursor: (!file || !meta.title) ? "not-allowed" : "pointer",
              }}
              disabled={!file || !meta.title}
              onClick={handleSubmit}
            >
              Upload & AI Scan Shuru Karein →
            </button>

            {/* Info strip */}
            <div style={{
              marginTop: 16, padding: "12px 16px", borderRadius: 10,
              background: C.accentGlow, border: `1px solid ${C.accentDim}`,
              fontSize: 12, color: C.textMuted,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span style={{ color: C.accent }}>ℹ</span>
              <span>
                Upload hote hi AI automatically scan karega — violence, adult content, hate speech etc.
                Phir human moderator final decision lega. Pura process usually <strong style={{ color: C.text }}>15–30 min</strong> leta hai.
              </span>
            </div>
          </>
        )}

        {/* ── UPLOADING STATE ── */}
        {step === "uploading" && (
          <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 36, marginBottom: 20 }}>📡</div>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
              Server pe upload ho raha hai…
            </div>
            <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 28 }}>"{file?.name}"</div>

            <div style={{ height: 6, background: C.border, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
              <div style={{
                height: "100%", background: C.accent, borderRadius: 6,
                width: `${uploadPct}%`,
                transition: "width 0.2s ease",
                boxShadow: `0 0 12px ${C.accent}60`,
              }} />
            </div>
            <div style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>{uploadPct}%</div>
          </div>
        )}

        {/* ── AI CHECK STATE ── */}
        {step === "ai_check" && (
          <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 36, marginBottom: 20 }}>🤖</div>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              AI Content Scan chal raha hai…
            </div>
            <Spinner />
            <div style={{ marginTop: 24, color: C.textDim, fontSize: 12 }}>
              Violence • Adult Content • Hate Speech • Drugs • Profanity • Copyright
            </div>
          </div>
        )}

        {/* ── RESULT STATE ── */}
        {step === "result" && aiResult && (
          <>
            {/* Verdict card */}
            <div style={{
              ...card,
              border: `1px solid ${aiResult.verdict === "approved" ? C.accentDim : aiResult.verdict === "flagged" ? C.warnDim : C.dangerDim}`,
              background: aiResult.verdict === "approved" ? C.safeGlow : aiResult.verdict === "flagged" ? C.warnGlow : C.dangerGlow,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>AI SCAN RESULT</div>
                  <Badge verdict={aiResult.verdict} />
                  <div style={{ marginTop: 10, fontSize: 13, color: C.textMuted }}>
                    "{meta.title}"
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: aiResult.verdict === "approved" ? C.safe : aiResult.verdict === "flagged" ? C.warn : C.danger }}>
                    {aiResult.confidence}%
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim }}>safety confidence</div>
                </div>
              </div>

              {/* Verdict message */}
              <div style={{
                marginTop: 16, padding: "12px 14px", borderRadius: 10,
                background: C.bg, fontSize: 13, color: C.textMuted, lineHeight: 1.6,
              }}>
                {aiResult.verdict === "approved" && (
                  <span>✓ AI ne content safe find kiya. Ab <strong style={{ color: C.text }}>human moderator review queue</strong> mein bhej diya gaya hai. Approval ke baad platform pe live hoga.</span>
                )}
                {aiResult.verdict === "flagged" && (
                  <span>⚑ Kuch categories mein borderline score aaya. <strong style={{ color: C.text }}>Human moderator carefully review karega</strong> — final decision unka hoga. Thoda time lag sakta hai.</span>
                )}
                {aiResult.verdict === "rejected" && (
                  <span>✕ AI ne high-risk content detect kiya. Content <strong style={{ color: C.text }}>community guidelines</strong> ke against hai. Aap edit karke dobara upload kar sakte hain.</span>
                )}
              </div>
            </div>

            {/* Score breakdown */}
            <div style={card}>
              <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.1em", marginBottom: 18 }}>
                AI CATEGORY SCORES
              </div>
              {AI_CATEGORIES.map((cat) => (
                <ScoreBar key={cat.key} label={cat.label} icon={cat.icon} value={aiResult.scores[cat.key]} />
              ))}
            </div>

            {/* Pipeline status */}
            <div style={card}>
              <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.1em", marginBottom: 18 }}>
                REVIEW PIPELINE
              </div>
              {[
                { step: "Upload", done: true, label: "Server pe store ho gaya" },
                { step: "AI Scan", done: true, label: `${aiResult.verdict === "rejected" ? "Issues found" : "Scan complete"}` },
                { step: "Human Review", done: false, active: aiResult.verdict !== "rejected", label: aiResult.verdict === "rejected" ? "Skipped — auto rejected" : "Queue mein hai — ~15 min" },
                { step: "Published", done: false, active: false, label: aiResult.verdict === "rejected" ? "Blocked" : "Human approval ke baad" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: i < 3 ? 18 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                      background: s.done ? C.accent : s.active ? C.warnGlow : C.border,
                      border: `2px solid ${s.done ? C.accent : s.active ? C.warn : C.borderMid}`,
                      color: s.done ? "#071209" : s.active ? C.warn : C.textDim,
                      fontWeight: 700,
                    }}>
                      {s.done ? "✓" : i + 1}
                    </div>
                    {i < 3 && <div style={{ width: 1, height: 18, background: s.done ? C.accentDim : C.border, marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.done ? C.text : s.active ? C.warn : C.textDim }}>
                      {s.step}
                    </div>
                    <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={reset} style={{ ...btnPrimary, flex: 1 }}>
                + Naya Video Upload Karein
              </button>
              {aiResult.verdict === "rejected" && (
                <button onClick={reset} style={{
                  flex: 1, background: "transparent",
                  border: `1px solid ${C.dangerDim}`, color: C.danger,
                  borderRadius: 10, padding: "13px 20px",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>
                  Edit & Re-Upload
                </button>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 36, color: C.textDim, fontSize: 11 }}>
          Samtulan © 2025 • Family-Safe Video Platform • सभी content moderated
        </div>
      </div>
    </div>
  );
}