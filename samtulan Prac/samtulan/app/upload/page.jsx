"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ShieldIcon, UploadIcon, CheckIcon, WarningIcon, CrossIcon } from "@/components/Icons";

const C = { bg:"#0F0F0F",surface:"#111",border:"#272727",borderMid:"#303030",accent:"#2ECC71",accentDim:"#1A7A43",accentGlow:"rgba(46,204,113,0.1)",text:"#F1F1F1",muted:"#AAAAAA",dim:"#717171",danger:"#E55555",dangerDim:"#7A1F1F",warn:"#F0A500",warnDim:"#7A5200" };

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
  if (v > 0.65) return C.danger;
  if (v > 0.30) return C.warn;
  return C.accent;
}

function Badge({ verdict }) {
  const cfg = {
    approved: { bg:"rgba(46,204,113,0.1)",border:C.accentDim,color:C.accent,label:"✓ AI Approved" },
    flagged:  { bg:"rgba(240,165,0,0.1)", border:C.warnDim,  color:C.warn,  label:"⚑ Flagged for Review" },
    rejected: { bg:"rgba(229,85,85,0.1)",border:C.dangerDim,color:C.danger, label:"✕ AI Rejected" },
  }[verdict]||{};
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:99,background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.color,fontSize:13,fontWeight:600 }}>
      {cfg.label}
    </span>
  );
}

export default function UploadPage() {
  const [file,      setFile]      = useState(null);
  const [dragging,  setDragging]  = useState(false);
  const [meta,      setMeta]      = useState({ title:"",description:"",category:"",tags:"" });
  const [step,      setStep]      = useState("idle"); // idle|uploading|ai_check|result
  const [uploadPct, setUploadPct] = useState(0);
  const [result,    setResult]    = useState(null);
  const fileRef = useRef();

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (f && f.type.startsWith("video/")) setFile(f);
  },[]);

  const simulateUpload = () => new Promise(res => {
    let p = 0;
    const id = setInterval(()=>{
      p += Math.random()*18+5;
      if(p>=100){p=100;clearInterval(id);res();}
      setUploadPct(Math.min(Math.round(p),100));
    },150);
  });

  const handleSubmit = async () => {
    if (!file || !meta.title) return;
    setStep("uploading"); setUploadPct(0);
    await simulateUpload();
    setStep("ai_check");

    try {
      // Call real Claude API
      const res = await fetch("/api/moderate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title:meta.title, description:meta.description, tags:meta.tags, category:meta.category }),
      });
      const data = await res.json();

      // Also save to DB
      fetch("/api/videos", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title:meta.title, description:meta.description, tags:meta.tags.split(",").map(t=>t.trim()), category:meta.category, uploaderName:"You" }),
      }).catch(()=>{});

      setResult(data);
    } catch {
      setResult({ verdict:"flagged", confidence:50, scores:{ violence:0,adult_content:0,hate_speech:0,drugs:0,dangerous:0,misleading:0,profanity:0,copyright:0 }, reasons:["Manual review required"] });
    }
    setStep("result");
  };

  const reset = () => { setFile(null); setMeta({title:"",description:"",category:"",tags:""}); setStep("idle"); setResult(null); };

  const inp = { width:"100%",background:"#0F0F0F",border:`1px solid ${C.borderMid}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:14,fontFamily:"inherit",outline:"none" };

  return (
    <div style={{ minHeight:"100vh",background:C.bg }}>
      <Navbar />
      <div style={{ maxWidth:680,margin:"0 auto",padding:"80px 20px 60px" }}>
        <style>{`.inp:focus{border-color:#2ECC71!important}`}</style>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
            <div style={{ width:32,height:32,borderRadius:9,background:"rgba(46,204,113,0.1)",border:"1px solid #1A7A43",display:"flex",alignItems:"center",justifyContent:"center",color:"#2ECC71" }}><ShieldIcon /></div>
            <span style={{ fontSize:20,fontWeight:700,letterSpacing:"-0.02em" }}>सम<span style={{ color:"#2ECC71" }}>तुलन</span> <span style={{ fontSize:16,color:C.muted,fontWeight:400 }}>Upload</span></span>
          </div>
          <p style={{ color:C.dim,fontSize:13 }}>Video upload karein → AI scan → Human review → Platform pe live</p>
        </div>

        {step === "idle" && (
          <>
            {/* Drop zone */}
            <div onClick={()=>fileRef.current?.click()} onDrop={onDrop} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
              style={{ border:`2px dashed ${dragging?C.accent:file?C.accentDim:C.borderMid}`,background:dragging?"rgba(46,204,113,0.05)":file?"#0D1510":C.surface,borderRadius:14,padding:"40px 24px",cursor:"pointer",textAlign:"center",marginBottom:16,transition:"all 0.2s" }}>
              <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={onDrop} />
              {file ? (
                <>
                  <div style={{ fontSize:32,marginBottom:8 }}>🎬</div>
                  <div style={{ color:C.accent,fontWeight:600,fontSize:15 }}>{file.name}</div>
                  <div style={{ color:C.dim,fontSize:12,marginTop:4 }}>{(file.size/1024/1024).toFixed(1)} MB</div>
                  <div style={{ color:C.dim,fontSize:11,marginTop:8 }}>click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:36,marginBottom:10,opacity:0.4 }}>📤</div>
                  <div style={{ color:C.muted,fontSize:15,fontWeight:600 }}>Video drag karein ya click karein</div>
                  <div style={{ color:C.dim,fontSize:12,marginTop:6 }}>MP4, MOV, AVI • max 2GB</div>
                </>
              )}
            </div>

            {/* Form */}
            <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:22,marginBottom:14 }}>
              <div style={{ fontSize:11,color:C.dim,letterSpacing:"0.1em",marginBottom:16 }}>VIDEO DETAILS</div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:C.muted,display:"block",marginBottom:6 }}>Title <span style={{ color:C.danger }}>*</span></label>
                <input className="inp" style={inp} placeholder="Video ka title..." value={meta.title} onChange={e=>setMeta({...meta,title:e.target.value})} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:C.muted,display:"block",marginBottom:6 }}>Description</label>
                <textarea className="inp" style={{...inp,resize:"vertical",minHeight:80,lineHeight:1.6}} placeholder="Video ke baare mein..." value={meta.description} onChange={e=>setMeta({...meta,description:e.target.value})} />
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <div>
                  <label style={{ fontSize:12,color:C.muted,display:"block",marginBottom:6 }}>Category</label>
                  <select className="inp" style={{...inp,cursor:"pointer"}} value={meta.category} onChange={e=>setMeta({...meta,category:e.target.value})}>
                    <option value="">Choose...</option>
                    {["Education","Entertainment","Gaming","Cooking","Kids","Music","Sports","Science","Tech","DIY","Comedy","News"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12,color:C.muted,display:"block",marginBottom:6 }}>Tags</label>
                  <input className="inp" style={inp} placeholder="comedy, kids, fun" value={meta.tags} onChange={e=>setMeta({...meta,tags:e.target.value})} />
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={!file||!meta.title} style={{ width:"100%",background:C.accent,color:"#071209",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,cursor:(!file||!meta.title)?"not-allowed":"pointer",opacity:(!file||!meta.title)?0.4:1,fontFamily:"inherit" }}>
              Upload & AI Scan Shuru Karein →
            </button>

            <div style={{ marginTop:14,padding:"12px 16px",borderRadius:10,background:"rgba(46,204,113,0.07)",border:"1px solid #1A7A43",fontSize:12,color:C.dim,display:"flex",gap:8 }}>
              <span style={{ color:C.accent,flexShrink:0 }}><ShieldIcon /></span>
              Upload hote hi Claude AI automatically scan karega. Phir human moderator final decision lega. Total time: <strong style={{ color:C.text }}>15–30 min</strong>
            </div>
          </>
        )}

        {step === "uploading" && (
          <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"48px 24px",textAlign:"center" }}>
            <div style={{ fontSize:36,marginBottom:16 }}>📡</div>
            <div style={{ fontSize:16,fontWeight:600,marginBottom:6 }}>Upload ho raha hai...</div>
            <div style={{ color:C.dim,fontSize:13,marginBottom:24 }}>"{file?.name}"</div>
            <div style={{ height:6,background:C.border,borderRadius:4,overflow:"hidden",marginBottom:8 }}>
              <div style={{ height:"100%",background:C.accent,borderRadius:4,width:`${uploadPct}%`,transition:"width 0.2s",boxShadow:`0 0 12px ${C.accent}60` }} />
            </div>
            <div style={{ color:C.accent,fontSize:13,fontWeight:600 }}>{uploadPct}%</div>
          </div>
        )}

        {step === "ai_check" && (
          <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"48px 24px",textAlign:"center" }}>
            <div style={{ width:48,height:48,borderRadius:"50%",border:`3px solid ${C.border}`,borderTopColor:C.accent,animation:"spin 0.8s linear infinite",margin:"0 auto 20px" }} />
            <div style={{ fontSize:16,fontWeight:600,marginBottom:8 }}>Claude AI scan chal raha hai...</div>
            <div style={{ color:C.dim,fontSize:12 }}>Violence • Adult Content • Hate Speech • Drugs • Profanity • Copyright</div>
          </div>
        )}

        {step === "result" && result && (
          <>
            {/* Verdict */}
            <div style={{ background:C.surface,border:`1px solid ${result.verdict==="approved"?C.accentDim:result.verdict==="flagged"?C.warnDim:C.dangerDim}`,borderRadius:14,padding:22,marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:11,color:C.dim,letterSpacing:"0.1em",marginBottom:10 }}>AI SCAN RESULT</div>
                  <Badge verdict={result.verdict} />
                  <div style={{ color:C.muted,fontSize:13,marginTop:8 }}>"{meta.title}"</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:32,fontWeight:700,color:result.verdict==="approved"?C.accent:result.verdict==="flagged"?C.warn:C.danger }}>{result.confidence}%</div>
                  <div style={{ fontSize:11,color:C.dim }}>confidence</div>
                </div>
              </div>

              {/* Scores */}
              {result.scores && AI_CATS.map(cat=>{
                const val = result.scores[cat.key]||0;
                return (
                  <div key={cat.key} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                      <span style={{ fontSize:12,color:C.muted }}>{cat.label}</span>
                      <span style={{ fontSize:12,color:scoreColor(val),fontWeight:600 }}>{Math.round(val*100)}%</span>
                    </div>
                    <div style={{ height:4,background:C.border,borderRadius:4,overflow:"hidden" }}>
                      <div style={{ height:"100%",background:scoreColor(val),borderRadius:4,width:`${Math.round(val*100)}%`,transition:"width 0.8s" }} />
                    </div>
                  </div>
                );
              })}

              {/* Reasons */}
              {result.reasons?.length > 0 && (
                <div style={{ marginTop:14,padding:"10px 14px",background:"#0F0F0F",borderRadius:10,fontSize:12,color:C.muted }}>
                  {result.reasons.map((r,i)=><div key={i} style={{ marginBottom:i<result.reasons.length-1?4:0 }}>• {r}</div>)}
                </div>
              )}

              {/* Next step message */}
              <div style={{ marginTop:14,padding:"10px 14px",background:"rgba(46,204,113,0.05)",border:"1px solid #1A7A43",borderRadius:10,fontSize:12,color:C.muted }}>
                {result.verdict==="approved" && "✓ AI ne safe find kiya! Ab human moderator review karega. Approve hone ke baad platform pe live hoga."}
                {result.verdict==="flagged"  && "⚑ Human moderator carefully review karega — thoda time lag sakta hai."}
                {result.verdict==="rejected" && "✕ Content guidelines ke against hai. Edit karke dobara upload kar sakte hain."}
              </div>
            </div>

            {/* Pipeline */}
            <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:22,marginBottom:14 }}>
              <div style={{ fontSize:11,color:C.dim,letterSpacing:"0.1em",marginBottom:16 }}>REVIEW PIPELINE</div>
              {[
                { label:"Upload",       done:true  },
                { label:"AI Scan",      done:true  },
                { label:"Human Review", done:false, active:result.verdict!=="rejected" },
                { label:"Published",    done:false  },
              ].map((s,i,arr)=>(
                <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:14,marginBottom:i<arr.length-1?16:0 }}>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
                    <div style={{ width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:s.done?C.accent:s.active?"rgba(240,165,0,0.1)":C.border,border:`2px solid ${s.done?C.accent:s.active?C.warn:C.borderMid}`,color:s.done?"#071209":s.active?C.warn:C.dim }}>
                      {s.done?<CheckIcon />:i+1}
                    </div>
                    {i<arr.length-1 && <div style={{ width:1,height:16,background:s.done?C.accentDim:C.border,marginTop:4 }} />}
                  </div>
                  <div style={{ paddingTop:4 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:s.done?C.text:s.active?C.warn:C.dim }}>{s.label}</div>
                    <div style={{ fontSize:12,color:C.dim,marginTop:2 }}>
                      {s.label==="Upload"?"Server pe store ho gaya":s.label==="AI Scan"?`${result.verdict} (${result.confidence}% confidence)`:s.label==="Human Review"?result.verdict==="rejected"?"Skipped — auto rejected":"~15 min wait":result.verdict==="rejected"?"Blocked":"Approval ke baad live"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex",gap:12 }}>
              <button onClick={reset} style={{ flex:1,background:C.accent,border:"none",color:"#071209",borderRadius:10,padding:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>+ Naya Upload</button>
              <Link href="/creator" style={{ flex:1,textAlign:"center",background:C.surface,border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:12,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>
                Creator Dashboard →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
