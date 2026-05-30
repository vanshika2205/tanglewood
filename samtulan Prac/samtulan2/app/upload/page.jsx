"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useUI } from "@/lib/UIContext";
import { ShieldIcon, CheckIcon } from "@/components/Icons";

const AI_CATS = [
  { key:"violence",      label:"Violence",       },
  { key:"adult_content", label:"Adult Content",  },
  { key:"hate_speech",   label:"Hate Speech",    },
  { key:"drugs",         label:"Drugs",          },
  { key:"dangerous",     label:"Dangerous",      },
  { key:"misleading",    label:"Misleading",     },
  { key:"profanity",     label:"Profanity",      },
  { key:"copyright",     label:"Copyright Risk", },
];

function scoreColor(v) {
  if (v > 0.65) return "#E55555";
  if (v > 0.30) return "#F0A500";
  return "var(--accent-color)";
}

function Badge({ verdict }) {
  const cfg = {
    approved: { bg:"rgba(46,204,113,0.1)", border: "var(--accent-color)", color: "var(--accent-color)", label:"✓ AI Approved" },
    flagged:  { bg:"rgba(240,165,0,0.1)",  border: "rgba(240,165,0,0.3)",  color:"#F0A500",  label:"⚑ Flagged for Review" },
    rejected: { bg:"rgba(229,85,85,0.1)", border: "rgba(229,85,85,0.3)", color:"#E55555", label:"✕ AI Rejected" },
  }[verdict]||{};
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:99,background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.color,fontSize:13,fontWeight:600 }}>
      {cfg.label}
    </span>
  );
}

function UploadContent() {
  const { colorMode } = useUI();
  const [file,      setFile]      = useState(null);
  const [thumb,     setThumb]     = useState(null);
  const [dragging,  setDragging]  = useState(false);
  const [meta,      setMeta]      = useState({ title:"",description:"",category:"",tags:"" });
  const [step,      setStep]      = useState("idle"); // idle|uploading|ai_check|result
  const [uploadPct, setUploadPct] = useState(0);
  const [result,    setResult]    = useState(null);
  const fileRef = useRef();
  const thumbRef = useRef();
  
  const { data: session, status } = useSession();
  const router = useRouter();

  const [channelInfo, setChannelInfo] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/upload");
    } else if (status === "authenticated") {
      fetch("/api/user/me").then(r=>r.json()).then(d => {
         if (!d.hasChannel) router.replace("/create-channel");
         else setChannelInfo(d);
      });
    }
  }, [status, router]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (f && f.type.startsWith("video/")) setFile(f);
  },[]);

  const onThumbDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (f && f.type.startsWith("image/")) setThumb(f);
  },[]);

  const handleSubmit = async () => {
    if (!file || !meta.title) return;
    setStep("uploading"); setUploadPct(0);

    const formData = new FormData();
    formData.append("file", file);
    if (thumb) formData.append("thumbnail", thumb);

    try {
      const uploadRes = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => resolve(JSON.parse(xhr.responseText)));
        xhr.addEventListener("error", reject);
        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      if (uploadRes.error) throw new Error(uploadRes.error);
      const { fileUrl, thumbnailUrl } = uploadRes;

      setStep("ai_check");
      const res = await fetch("/api/moderate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title:meta.title, description:meta.description, tags:meta.tags, category:meta.category }),
      });
      const data = await res.json();

      await fetch("/api/videos", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ 
          title:meta.title, description:meta.description, 
          tags:meta.tags.split(",").map(t=>t.trim()), category:meta.category, 
          uploaderName: channelInfo?.channelName || session?.user?.name || "You", fileUrl, thumbnailUrl 
        }),
      });

      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ verdict:"flagged", confidence:50, scores:{}, reasons:["Upload failed or Manual review required"] });
    }
    setStep("result");
  };

  const reset = () => { setFile(null); setThumb(null); setMeta({title:"",description:"",category:"",tags:""}); setStep("idle"); setResult(null); };

  const inpStyles = { width:"100%",background:"var(--card-bg)",border:"1px solid var(--border-color)",borderRadius:10,padding:"11px 14px",color:"var(--text-color)",fontSize:14,fontFamily:"inherit",outline:"none", transition:"all 0.2s" };

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg-color)", color:"var(--text-color)", fontFamily:"'Inter', sans-serif" }}>
      <Navbar />
      {(status === "loading" || status === "unauthenticated") ? (
        <div style={{ padding:"100px", textAlign:"center", color:"var(--text-color)", opacity:0.5 }}>Loading...</div>
      ) : (
        <div style={{ maxWidth:680,margin:"0 auto",padding:"80px 20px 60px" }}>
          <style>{`.inp:focus{border-color:var(--accent-color)!important; box-shadow: 0 0 10px var(--accent-color);}`}</style>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
            <div style={{ width:32,height:32,borderRadius:9,background:"var(--glass-bg)",border:"1px solid var(--border-color)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent-color)" }}><ShieldIcon /></div>
            <span className="gnlow-text" style={{ fontSize:20,fontWeight:700,letterSpacing:"-0.02em" }}>सम<span style={{ color:"var(--accent-color)" }}>तुलन</span> <span style={{ fontSize:16,color:"var(--text-color)",opacity:0.6,fontWeight:400 }}>Upload</span></span>
          </div>
          <p style={{ color:"var(--text-color)", opacity: 0.6, fontSize:13 }}>Safe content creator studio → Upload, AI Scan, and Share.</p>
        </div>

        {step === "idle" && (
          <>
            {/* Drop zone */}
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:16 }}>
              <div onClick={()=>fileRef.current?.click()} onDrop={onDrop} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
                className="glass-panel"
                style={{ border:`2px dashed ${dragging?"var(--accent-color)":file?"var(--accent-color)":"var(--border-color)"}`,background:dragging?"var(--glass-bg)":file?"var(--glass-bg)":"var(--card-bg)",borderRadius:14,padding:"40px 24px",cursor:"pointer",textAlign:"center",transition:"all 0.2s" }}>
                <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={onDrop} />
                {file ? (
                  <>
                    <div style={{ fontSize:32,marginBottom:8 }}>🎬</div>
                    <div style={{ color:"var(--accent-color)",fontWeight:600,fontSize:15 }}>{file.name}</div>
                    <div style={{ color:"var(--text-color)",opacity:0.4,fontSize:12,marginTop:4 }}>{(file.size/1024/1024).toFixed(1)} MB</div>
                    <div style={{ color:"var(--text-color)",opacity:0.4,fontSize:11,marginTop:8 }}>click to change video</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:36,marginBottom:10,opacity:0.4 }}>📤</div>
                    <div style={{ color:"var(--text-color)",opacity:0.6,fontSize:15,fontWeight:600 }}>Drag video here or click</div>
                    <div style={{ color:"var(--text-color)",opacity:0.3,fontSize:12,marginTop:6 }}>MP4, MOV, AVI • max 2GB</div>
                  </>
                )}
              </div>
              <div onClick={()=>thumbRef.current?.click()} 
                className="glass-panel"
                style={{ border:`2px dashed ${thumb?"var(--accent-color)":"var(--border-color)"}`,background:thumb?"var(--glass-bg)":"var(--card-bg)",borderRadius:14,padding:"20px 14px",cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center" }}>
                <input ref={thumbRef} type="file" accept="image/*" style={{ display:"none" }} onChange={onThumbDrop} />
                {thumb ? (
                  <>
                    <div style={{ color:"var(--accent-color)",fontWeight:600,fontSize:13,textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap' }}>{thumb.name}</div>
                    <div style={{ color:"var(--text-color)",opacity:0.4,fontSize:11,marginTop:4 }}>Thumbnail Set ✓</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:22,marginBottom:6,opacity:0.4 }}>🖼️</div>
                    <div style={{ color:"var(--text-color)",opacity:0.6,fontSize:12,fontWeight:600 }}>Thumbnail</div>
                    <div style={{ color:"var(--text-color)",opacity:0.3,fontSize:10,marginTop:4 }}>(Optional) JPG, PNG</div>
                  </>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="glass-panel" style={{ borderRadius:14,padding:22,marginBottom:14 }}>
              <div style={{ fontSize:11,color:"var(--text-color)",opacity:0.4,letterSpacing:"0.1em",marginBottom:16 }}>VIDEO DETAILS</div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:"var(--text-color)",opacity:0.6,display:"block",marginBottom:6 }}>Title <span style={{ color:"#E55555" }}>*</span></label>
                <input className="inp" style={inpStyles} placeholder="Catchy title..." value={meta.title} onChange={e=>setMeta({...meta,title:e.target.value})} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:"var(--text-color)",opacity:0.6,display:"block",marginBottom:6 }}>Description</label>
                <textarea className="inp" style={{...inpStyles,resize:"vertical",minHeight:80,lineHeight:1.6}} placeholder="What's this video about?" value={meta.description} onChange={e=>setMeta({...meta,description:e.target.value})} />
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <div>
                  <label style={{ fontSize:12,color:"var(--text-color)",opacity:0.6,display:"block",marginBottom:6 }}>Category</label>
                  <select className="inp" style={{...inpStyles,cursor:"pointer"}} value={meta.category} onChange={e=>setMeta({...meta,category:e.target.value})}>
                    <option value="">Choose...</option>
                    {["Education","Entertainment","Gaming","Cooking","Kids","Music","Sports","Science","Tech","DIY","Comedy","News"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12,color:"var(--text-color)",opacity:0.6,display:"block",marginBottom:6 }}>Tags</label>
                  <input className="inp" style={inpStyles} placeholder="comma, separated, tags" value={meta.tags} onChange={e=>setMeta({...meta,tags:e.target.value})} />
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={!file||!meta.title} style={{ width:"100%",background:"var(--accent-color)",color:colorMode === "dark" ? "#000" : "#FFF",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,cursor:(!file||!meta.title)?"not-allowed":"pointer",opacity:(!file||!meta.title)?0.4:1,fontFamily:"inherit", boxShadow: "var(--shadow)" }}>
              Upload & AI Scan Shuru Karein →
            </button>

            <div className="glass-panel" style={{ marginTop:14,padding:"12px 16px",borderRadius:10,background:"rgba(46,204,113,0.07)",border:"1px solid var(--accent-color)",fontSize:12,color:"var(--text-color)",opacity:0.8,display:"flex",gap:8 }}>
              <span style={{ color:"var(--accent-color)",flexShrink:0 }}><ShieldIcon /></span>
              <span>AI automically scans your content for safety. Humans make the final call. Avg time: 15–30 min</span>
            </div>
          </>
        )}

        {step === "uploading" && (
          <div className="glass-panel" style={{ borderRadius:14,padding:"48px 24px",textAlign:"center" }}>
            <div style={{ fontSize:36,marginBottom:16 }}>📡</div>
            <div style={{ fontSize:16,fontWeight:600,marginBottom:6 }}>Uploading...</div>
            <div style={{ color:"var(--text-color)",opacity:0.6,fontSize:13,marginBottom:24 }}>"{file?.name}"</div>
            <div style={{ height:6,background:"var(--card-bg)",borderRadius:4,overflow:"hidden",marginBottom:8 }}>
              <div style={{ height:"100%",background:"var(--accent-color)",borderRadius:4,width:`${uploadPct}%`,transition:"width 0.2s",boxShadow:"0 0 12px var(--accent-color)" }} />
            </div>
            <div style={{ color:"var(--accent-color)",fontSize:13,fontWeight:600 }}>{uploadPct}%</div>
          </div>
        )}

        {step === "ai_check" && (
          <div className="glass-panel" style={{ borderRadius:14,padding:"48px 24px",textAlign:"center" }}>
            <div style={{ width:48,height:48,borderRadius:"50%",border:`3px solid var(--border-color)`,borderTopColor:"var(--accent-color)",animation:"spin 0.8s linear infinite",margin:"0 auto 20px" }} />
            <div style={{ fontSize:16,fontWeight:600,marginBottom:8 }}>Claude AI scanning content...</div>
            <div style={{ color:"var(--text-color)",opacity:0.4,fontSize:12 }}>Violence • Adult • Hate Speech • Drugs • Copyright • Safe</div>
          </div>
        )}

        {step === "result" && result && (
          <>
            <div className="glass-panel" style={{ border:`1px solid ${result.verdict==="approved"?"var(--accent-color)":result.verdict==="flagged"?"#F0A500":"#E55555"}`,borderRadius:14,padding:22,marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:11,color:"var(--text-color)",opacity:0.4,letterSpacing:"0.1em",marginBottom:10 }}>AI SCAN RESULT</div>
                  <Badge verdict={result.verdict} />
                  <div style={{ color:"var(--text-color)",fontSize:13,marginTop:8 }}>"{meta.title}"</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div className="gnlow-text" style={{ fontSize:32,fontWeight:700,color:result.verdict==="approved"?"var(--accent-color)":result.verdict==="flagged"?"#F0A500":"#E55555" }}>{result.confidence}%</div>
                  <div style={{ fontSize:11,color:"var(--text-color)",opacity:0.4 }}>confidence</div>
                </div>
              </div>

              {result.scores && AI_CATS.map(cat=>{
                const val = result.scores[cat.key]||0;
                return (
                  <div key={cat.key} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                      <span style={{ fontSize:12,color:"var(--text-color)",opacity:0.6 }}>{cat.label}</span>
                      <span style={{ fontSize:12,color:scoreColor(val),fontWeight:600 }}>{Math.round(val*100)}%</span>
                    </div>
                    <div style={{ height:4,background:"var(--card-bg)",borderRadius:4,overflow:"hidden" }}>
                      <div style={{ height:"100%",background:scoreColor(val),borderRadius:4,width:`${Math.round(val*100)}%`,transition:"width 0.8s" }} />
                    </div>
                  </div>
                );
              })}

              {result.reasons?.length > 0 && (
                <div style={{ marginTop:14,padding:"10px 14px",background:"var(--glass-bg)",borderRadius:10,fontSize:12,color:"var(--text-color)",opacity:0.6 }}>
                  {result.reasons.map((r,i)=><div key={i} style={{ marginBottom:i<result.reasons.length-1?4:0 }}>• {r}</div>)}
                </div>
              )}

              <div style={{ marginTop:14,padding:"10px 14px",background:"var(--glass-bg)",border:"1px solid var(--border-color)",borderRadius:10,fontSize:12,color:"var(--text-color)",opacity:0.8 }}>
                {result.verdict==="approved" && "✓ AI approved this content! Now for a quick human double-check before it goes live."}
                {result.verdict==="flagged"  && "⚑ This content needs a closer look by our moderators. Stay tuned."}
                {result.verdict==="rejected" && "✕ Content violated safety guidelines. Please review our policy and try again."}
              </div>
            </div>

            <div className="glass-panel" style={{ borderRadius:14,padding:22,marginBottom:14 }}>
              <div style={{ fontSize:11,color:"var(--text-color)",opacity:0.4,letterSpacing:"0.1em",marginBottom:16 }}>REVIEW PIPELINE</div>
              {[
                { label:"Upload",       done:true  },
                { label:"AI Scan",      done:true  },
                { label:"Human Review", done:false, active:result.verdict!=="rejected" },
                { label:"Published",    done:false  },
              ].map((s,i,arr)=>(
                <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:14,marginBottom:i<arr.length-1?16:0 }}>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
                    <div style={{ width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:s.done?"var(--accent-color)":s.active?"rgba(240,165,0,0.1)":"var(--card-bg)",border:`2px solid ${s.done?"var(--accent-color)":s.active?"#F0A500":"var(--border-color)"}`,color:s.done?(colorMode === "dark" ? "#000" : "#FFF"):s.active?"#F0A500":"var(--text-color)" }}>
                      {s.done?<CheckIcon />:i+1}
                    </div>
                    {i<arr.length-1 && <div style={{ width:1,height:16,background:s.done?"var(--accent-color)":"var(--border-color)",marginTop:4 }} />}
                  </div>
                  <div style={{ paddingTop:4 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:s.done?"var(--text-color)":s.active?"#F0A500":"var(--text-color)" }}>{s.label}</div>
                    <div style={{ fontSize:12,color:"var(--text-color)",opacity:0.4,marginTop:2 }}>
                      {s.label==="Upload"?"Stored securely":s.label==="AI Scan"?`${result.verdict} (${result.confidence}%)`:s.label==="Human Review"?result.verdict==="rejected"?"Skipped":"~15 min wait":result.verdict==="rejected"?"Blocked":"Awaiting final check"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex",gap:12 }}>
              <button onClick={reset} style={{ flex:1,background:"var(--accent-color)",color:colorMode === "dark" ? "#000" : "#FFF",border:"none",borderRadius:10,padding:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit", boxShadow:"var(--shadow)" }}>+ Upload Again</button>
              <Link href="/creator" style={{ flex:1,textAlign:"center",background:"var(--card-bg)",border:`1px solid var(--border-color)`,color:"var(--text-color)",borderRadius:10,padding:12,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center", textDecoration:"none" }}>
                Creator Dashboard →
              </Link>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh",background:"var(--bg-color)",color:"var(--text-color)",padding:40 }}>Loading Upload...</div>}>
      <UploadContent />
    </Suspense>
  );
}
