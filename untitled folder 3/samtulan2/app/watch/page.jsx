"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { PlayIcon, LikeIcon, DislikeIcon, SaveIcon, ShareIcon, BackIcon, CheckIcon, ShieldIcon, WarningIcon } from "@/components/Icons";
import EmojiPicker, { Theme } from "emoji-picker-react";

const COLORS = [["#1a3a2a","#0d2318"],["#1a1a3a","#0d0d23"],["#3a1a1a","#230d0d"],["#1a2a3a","#0d1823"],["#2a1a3a","#180d23"],["#3a2a1a","#23180d"]];

function fmtViews(n) {
  if (!n) return "0";
  if(n>=1e7) return (n/1e7).toFixed(1)+"Cr";
  if(n>=1e5) return (n/1e5).toFixed(1)+"L";
  if(n>=1e3) return (n/1e3).toFixed(1)+"K";
  return String(n);
}

function CreatorAvatar({ name, src, size=36 }) {
  if (src) {
    return <img src={src} alt={name} style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,objectFit:"cover",border:"1px solid #272727" }} />;
  }
  const i = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const h = (name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
  return <div style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,background:`hsl(${h},40%,22%)`,border:`1.5px solid hsl(${h},40%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:`hsl(${h},60%,75%)` }}>{i}</div>;
}

import { useUI } from "@/lib/UIContext";

function WatchPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id");
  const { uiMode, colorMode } = useUI();
  const isModern = uiMode === "modern";
  const isCyber = uiMode === "cyber";
  const isMinimal = uiMode === "minimalist";

  const [video,    setVideo]    = useState(null);
  const [related,  setRelated]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [liked,    setLiked]    = useState(false);
  const [disliked, setDisliked]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const { data: session, status } = useSession();
  const isAdminOrMod = session?.user?.role === "admin" || session?.user?.role === "moderator";
  
  // Comments state
  const [comment,  setComment]  = useState("");
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null); 
  const [editingDoc, setEditingDoc] = useState(null); 
  const [sharedToast, setSharedToast] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const viewTriggered = useRef(false);

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    
    fetch(`/api/videos?id=${videoId}`)
      .then(r=>r.ok?r.json():null)
      .then(data => {
        if (data?.videos?.[0]) {
          setVideo(data.videos[0]);
          setComments(data.videos[0].comments || []);
          setLikesCount(data.videos[0].likes || 0);

          const cat = data.videos[0].category;
          fetch(`/api/videos?category=${cat}&limit=12`).then(r=>r.json()).then(d=>{
            const filtered = (d.videos || []).filter(v => v._id !== videoId);
            setRelated(filtered.length > 0 ? filtered : []);
          }).catch(() => setRelated([]));
        } else {
          setVideo(null);
        }
      })
      .finally(()=>setLoading(false));
  }, [videoId]);

  useEffect(() => {
    if (videoId && !viewTriggered.current) {
      viewTriggered.current = true;
      fetch("/api/videos/interact", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ videoId, action: "view" })
      });
    }

    if (session?.user && video) {
      fetch("/api/user/me").then(r=>r.json()).then(data => {
        if(data.likedVideos?.includes(videoId)) setLiked(true);
        if(data.dislikedVideos?.includes(videoId)) setDisliked(true);
        if(data.savedVideos?.includes(videoId)) setSaved(true);
        if(data.subscribedTo?.includes(video.uploader)) setSubscribed(true);
      });
    }
  }, [videoId, session, video]);

  const handleLike = async () => {
    if (status !== "authenticated") return alert("Login to like video!");
    const wasLiked = liked;
    setLiked(!wasLiked);
    if (disliked) setDisliked(false);
    setLikesCount(p => wasLiked ? p - 1 : p + 1);
    await fetch("/api/videos/interact", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ videoId, action: "like" })
    });
  };

  const handleDislike = async () => {
    if (status !== "authenticated") return alert("Login to dislike video!");
    const wasDisliked = disliked;
    setDisliked(!wasDisliked);
    if (liked) {
      setLiked(false);
      setLikesCount(p => p - 1);
    }
    await fetch("/api/videos/interact", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ videoId, action: "dislike" })
    });
  };

  const handleSave = async () => {
    if (status !== "authenticated") return alert("Login to save video!");
    setSaved(!saved);
    await fetch("/api/videos/interact", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ videoId, action: "save" })
    });
  };

  const handleSubscribe = async () => {
    if (status !== "authenticated") return alert("Login to subscribe!");
    setSubscribed(!subscribed);
    await fetch("/api/user/subscribe", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ creatorId: video.uploader })
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setSharedToast(true);
    setTimeout(() => setSharedToast(false), 2000);
  };

  const handleReport = async () => {
    if (status !== "authenticated") {
      alert("Please login to report a video.");
      return;
    }
    const reason = window.prompt("Why are you reporting this video? (e.g. Inappropriate content, Spam, Violence)");
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch("/api/videos/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, reason: reason.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Thanks! Your report has been submitted for Admin Review.");
      } else {
        alert(data.error || "Failed to submit report.");
      }
    } catch {
      alert("Error submitting report.");
    }
  };

  const submitComment = async () => {
    if (!comment.trim() || status !== "authenticated") return;
    const txt = comment;
    setComment("");
    
    if (editingDoc) {
      const body = { videoId, action: editingDoc.type==="comment"?"edit_comment":"edit_reply", text: txt, commentId: editingDoc.commentId, replyId: editingDoc.replyId };
      const res = await fetch("/api/videos/comments", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      if (res.ok) {
        setComments(prev => {
          return prev.map(c => {
            if (c._id === editingDoc.commentId) {
              if (editingDoc.type === "comment") return { ...c, text: txt, isEdited: true };
              return { ...c, replies: c.replies.map(r => r._id === editingDoc.replyId ? { ...r, text: txt, isEdited: true } : r) };
            }
            return c;
          });
        });
      }
      setEditingDoc(null);
      return;
    }

    if (replyingTo) {
      const body = { videoId, action: "add_reply", text: txt, commentId: replyingTo };
      const res = await fetch("/api/videos/comments", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      if (res.ok) {
        const { reply } = await res.json();
        setComments(prev => prev.map(c => c._id === replyingTo ? { ...c, replies: [...(c.replies||[]), reply] } : c));
      }
      setReplyingTo(null);
    } else {
      const body = { videoId, action: "add_comment", text: txt };
      const res = await fetch("/api/videos/comments", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      if (res.ok) {
        const { comment: newC } = await res.json();
        setComments(prev => [newC, ...prev]);
      }
    }
  };

  const deleteComment = async (commentId, replyId = null) => {
    if (!confirm("Are you sure?")) return;
    const url = `/api/videos/comments?videoId=${videoId}&commentId=${commentId}${replyId ? `&replyId=${replyId}` : ''}`;
    await fetch(url, { method: "DELETE" });
    if (replyId) {
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, replies: c.replies.filter(r => r._id !== replyId) } : c));
    } else {
      setComments(prev => prev.filter(c => c._id !== commentId));
    }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background: "var(--bg-color)", fontFamily:"'Inter','Roboto', sans-serif" }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .sk {
          background: linear-gradient(90deg, var(--border-color) 25%, var(--card-bg) 50%, var(--border-color) 75%);
          background-size: 1200px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 8px;
        }
      `}</style>
      <Navbar />
      <div style={{ paddingTop:56, display:"flex", gap:0 }}>
        <div style={{ flex:1, padding:"16px 20px" }}>
          <div className="sk" style={{ width:"100%", paddingTop:"56.25%", borderRadius:12, marginBottom:16 }} />
          <div className="sk" style={{ height:22, width:"75%", marginBottom:10 }} />
          <div className="sk" style={{ height:16, width:"45%", marginBottom:20 }} />
          <div style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:16, borderBottom:"1px solid var(--border-color)" }}>
            <div className="sk" style={{ width:42, height:42, borderRadius:"50%", flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div className="sk" style={{ height:14, width:"30%", marginBottom:8 }} />
              <div className="sk" style={{ height:12, width:"20%" }} />
            </div>
          </div>
        </div>
        <div style={{ width:360, flexShrink:0, padding:"16px", borderLeft:"1px solid var(--border-color)" }}>
          {[...Array(5)].map((_,i) => (
            <div key={i} style={{ display:"flex", gap:10, marginBottom:14 }}>
              <div className="sk" style={{ width:160, height:90, borderRadius:8, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div className="sk" style={{ height:13, width:"90%", marginBottom:8 }} />
                <div className="sk" style={{ height:11, width:"60%", marginBottom:6 }} />
                <div className="sk" style={{ height:11, width:"40%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (!video) return <div style={{ minHeight:"100vh",background:"var(--bg-color)", color:"var(--text-color)", padding:"80px" }}>Video not found ❌</div>;

  const [c1,c2] = COLORS[(video.color||0) % COLORS.length];
  const daysAgoNum = Math.floor((Date.now()-new Date(video.createdAt))/86400000);

  return (
    <div style={{ minHeight:"100vh",background: "var(--bg-color)", color:"var(--text-color)", fontFamily:"'Inter','Roboto', sans-serif" }}>
      <Navbar />

      {sharedToast && (
         <div className="glass-panel" style={{ position:"fixed",top:68,right:20,zIndex:999,padding:"12px 20px",borderRadius:10,color:"var(--accent-color)",fontSize:13,fontWeight:700, boxShadow:"var(--shadow)" }}>
           📋 Link Copied to Clipboard!
         </div>
      )}

      <div style={{ paddingTop:56,display:"flex",gap:0 }}>
        {/* Main */}
        <div style={{ flex:1,minWidth:0,padding:"16px 20px 40px", position:"relative" }}>
          
          {/* Ambient Glow behind player */}
          <div style={{ 
            position:"absolute", top:-100, left:"50%", transform:"translateX(-50%)", width:"80%", height:"600px", 
            background:`radial-gradient(circle, var(--accent-color) 0%, transparent 70%)`, filter:"blur(120px)", zIndex:-1, opacity:0.2 
          }} />

          <Link href="/" style={{ display:"inline-flex",alignItems:"center",gap:6,color:"var(--text-color)", opacity:0.7, fontSize:13,marginBottom:14,padding:"6px 10px",borderRadius:8,background:"var(--card-bg)", border:"1px solid var(--border-color)" }}>
            <BackIcon /> Back
          </Link>

          {/* Player */}
          <div className="glass-panel" style={{ width:"100%",paddingTop:"56.25%",position:"relative",borderRadius:12,overflow:"hidden",background: `linear-gradient(135deg,${c1},${c2})`,marginBottom:16, boxShadow: "var(--shadow)" }}>
            {video.fileUrl ? (
              <video src={video.fileUrl.startsWith('http') ? video.fileUrl : `/api/videos/stream?file=${encodeURIComponent(video.fileUrl)}`} poster={video.thumbnailUrl} controls autoPlay 
                style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",backgroundColor:"#000" }} />
            ) : (
              <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14 }}>
                <div style={{ width:68,height:68,borderRadius:"50%",background:"rgba(0,0,0,0.7)",border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center" }}><PlayIcon /></div>
                <div style={{ color:"rgba(255,255,255,0.7)",fontSize:14 }}>{video.title}</div>
              </div>
            )}
            {video.status === "approved" && (
              <div style={{ position:"absolute",top:10,right:10,background: isModern || isCyber ? "rgba(0,255,136,0.15)" : "rgba(46,204,113,0.2)",border: `1px solid var(--accent-color)`,color:"var(--accent-color)",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:5,display:"flex",alignItems:"center",gap:4,pointerEvents:"none" }}>
                <ShieldIcon /> VERIFIED SAFE
              </div>
            )}
          </div>

          <h1 className="gnlow-text" style={{ fontSize:20,fontWeight:700,lineHeight:1.4,marginBottom:12, color:"var(--text-color)" }}>{video.title}</h1>

          {/* Channel row */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,paddingBottom:14,borderBottom:"1px solid var(--border-color)",marginBottom:14 }}>
            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
              <Link href={`/channel/${video.uploader?._id || video.uploader}`} style={{textDecoration:"none"}}>
                <CreatorAvatar name={video.uploaderName} src={video.uploaderAvatar} size={42} />
              </Link>
              <div>
                <Link href={`/channel/${video.uploader?._id || video.uploader}`} style={{textDecoration:"none", color:"var(--text-color)"}}>
                  <div style={{ fontSize:15,fontWeight:600 }}>{video.uploaderName} {video.verified && <span style={{ color:"var(--accent-color)" }}><CheckIcon /></span>}</div>
                </Link>
                <div style={{ fontSize:13,color:"var(--text-color)", opacity: 0.6 }}>Verified Creator</div>
              </div>
              <button onClick={handleSubscribe} style={{ background:subscribed?"var(--border-color)":"var(--accent-color)",color:subscribed?"var(--text-color)":(colorMode === "light" && !isCyber ? "#FFF" : "#000"),border:"none",borderRadius:20,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer", transition:"all 0.2s" }}>
                {subscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              <div style={{ display:"flex",background:"var(--card-bg)",borderRadius:20,overflow:"hidden", border:"1px solid var(--border-color)" }}>
                <button onClick={handleLike} style={{ background:"none",border:"none",borderRight:"1px solid var(--border-color)",color:liked?"var(--accent-color)":"var(--text-color)",padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13, transition:"color 0.2s" }}>
                  <LikeIcon /> {fmtViews(likesCount)}
                </button>
                <button onClick={handleDislike} style={{ background:"none",border:"none",color:disliked?"var(--accent-color)":"var(--text-color)", opacity: disliked ? 1 : 0.6, padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13, transition:"color 0.2s" }}><DislikeIcon /></button>
              </div>
              <button onClick={handleShare} style={{ background:"var(--card-bg)",border:"1px solid var(--border-color)",color:"var(--text-color)",borderRadius:20,padding:"8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer" }}>
                <ShareIcon /> Share
              </button>
              <button onClick={handleSave} style={{ background:"var(--card-bg)",border:"1px solid var(--border-color)",color:saved?"var(--accent-color)":"var(--text-color)",borderRadius:20,padding:"8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer",transition:"all 0.2s" }}>
                <SaveIcon /> {saved?"Saved":"Save"}
              </button>
              <button onClick={handleReport} style={{ background:"rgba(229,85,85,0.1)",border:"1px solid rgba(229,85,85,0.2)",color:"#E55555",borderRadius:20,padding:"8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer",transition:"background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(229,85,85,0.2)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(229,85,85,0.1)"}>
                <WarningIcon /> Report
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius:12,padding:"14px 16px",marginBottom:22, border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize:13,fontWeight:600,marginBottom:8 }}>
              {fmtViews(video.views)} views • {daysAgoNum <= 0 ? "Today" : `${daysAgoNum} days ago`}
            </div>
            <div style={{ fontSize:13,color:"var(--text-color)", opacity: 0.8, lineHeight:1.7,whiteSpace:"pre-line",maxHeight:showMore?"none":"72px",overflow:"hidden" }}>
              {video.description}
            </div>
            <button onClick={()=>setShowMore(p=>!p)} style={{ background:"none",border:"none",color:"var(--accent-color)",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:6 }}>
              {showMore?"Show less":"...more"}
            </button>
          </div>

          {/* Comments section */}
          <div>
            <h3 style={{ fontSize:16,fontWeight:700,marginBottom:18 }}>{comments.length} Comments</h3>
            <div style={{ display:"flex",gap:12,marginBottom:24 }}>
              <CreatorAvatar name={session?.user?.name||"Guest"} size={36} />
              <div style={{ flex:1 }}>
                {editingDoc && editingDoc.type==="reply" && <div style={{fontSize:12,color:"var(--accent-secondary)",marginBottom:4}}>Editing Reply</div>}
                {replyingTo && <div style={{fontSize:12,color:"var(--accent-secondary)",marginBottom:4}}>Replying to comment ID: {replyingTo.slice(-4)}</div>}
                <textarea 
                  value={comment} onChange={e=>setComment(e.target.value)} 
                  placeholder={status==="authenticated" ? "Comment karein..." : "Login to comment..."} rows={2} disabled={status!=="authenticated"}
                  style={{ width:"100%",background:"transparent",border:"none",borderBottom:"1px solid var(--border-color)",color:"var(--text-color)",fontSize:14,fontFamily:"inherit",outline:"none",resize:"none",lineHeight:1.6,padding:"4px 0" }} 
                />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                   {status==="authenticated" && (
                     <div style={{ position:"relative" }}>
                       <button onClick={()=>setShowPicker(!showPicker)} style={{ background:"transparent", border:"none", cursor:"pointer", fontSize:18, marginTop:2, opacity: 0.7 }}>😀</button>
                       {showPicker && (
                         <div style={{ position:"absolute", zIndex:20, marginTop:8 }}>
                           <EmojiPicker theme={colorMode === "dark" ? Theme.DARK : Theme.LIGHT} onEmojiClick={e => { setComment(p => p + e.emoji); setShowPicker(false); }} />
                         </div>
                       )}
                     </div>
                   )}
                  {(comment || replyingTo || editingDoc) && (
                    <div style={{ display:"flex",gap:8 }}>
                      <button onClick={()=>{setComment(""); setReplyingTo(null); setEditingDoc(null);}} style={{ background:"none",border:"none",color:"var(--text-color)",opacity:0.6,fontSize:13,cursor:"pointer",padding:"7px 14px",borderRadius:20 }}>Cancel</button>
                      <button onClick={submitComment} style={{ background:"var(--accent-color)",border:"none",color:colorMode === "light" && !isCyber ? "#FFF" : "#000",fontSize:13,fontWeight:700,cursor:"pointer",padding:"7px 16px",borderRadius:20 }}>Save</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {comments.map(c=>(
              <div key={c._id} style={{ display:"flex",gap:12,marginBottom:22 }}>
                <CreatorAvatar name={c.userName||"U"} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                    <span style={{ fontSize:13,fontWeight:600 }}>{c.userName}</span>
                    <span style={{ fontSize:12,color:"var(--text-color)", opacity:0.5 }}>{new Date(c.createdAt).toLocaleDateString()} {c.isEdited && "(edited)"}</span>
                  </div>
                  <div style={{ fontSize:14,color:"var(--text-color)", opacity: 0.9, lineHeight:1.5,marginBottom:6 }}>{c.text}</div>
                  
                  <div style={{ display:"flex",alignItems:"center",gap:14, marginBottom:10 }}>
                    <button style={{ background:"none",border:"none",color:"var(--text-color)",opacity:0.6,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>👍 {c.likes||0}</button>
                    <button onClick={() => { setReplyingTo(c._id); setComment(""); window.scrollTo({top: 400, behavior:'smooth'}) }} style={{ background:"none",border:"none",color:"var(--text-color)",opacity:0.6,fontSize:12,cursor:"pointer" }}>Reply</button>
                    {(session?.user?.id === c.user || isAdminOrMod) && (
                      <>
                        <button onClick={() => deleteComment(c._id)} style={{ background:"none",border:"none",color:"#E55555",fontSize:12,cursor:"pointer" }}>Delete</button>
                        {session?.user?.id === c.user && <button onClick={() => { setEditingDoc({type:'comment', commentId:c._id, text:c.text}); setComment(c.text); }} style={{ background:"none",border:"none",color:"var(--accent-secondary)",fontSize:12,cursor:"pointer" }}>Edit</button>}
                      </>
                    )}
                  </div>

                  {c.replies?.map(r => (
                     <div key={r._id} style={{ display:"flex",gap:10,marginTop:12 }}>
                       <CreatorAvatar name={r.userName||"R"} size={28} />
                       <div style={{ flex:1 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
                            <span style={{ fontSize:12,fontWeight:600 }}>{r.userName}</span>
                            <span style={{ fontSize:11,color:"var(--text-color)",opacity:0.5 }}>{new Date(r.createdAt).toLocaleDateString()} {r.isEdited && "(edited)"}</span>
                          </div>
                          <div style={{ fontSize:13,color:"var(--text-color)",opacity:0.8,lineHeight:1.4,marginBottom:4 }}>{r.text}</div>
                          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                            {(session?.user?.id === r.user || isAdminOrMod) && (
                              <button onClick={() => deleteComment(c._id, r._id)} style={{ background:"none",border:"none",color:"#E55555",fontSize:11,cursor:"pointer" }}>Delete</button>
                            )}
                            {session?.user?.id === r.user && (
                              <button onClick={() => { setEditingDoc({type:'reply', commentId:c._id, replyId:r._id, text:r.text}); setComment(r.text); }} style={{ background:"none",border:"none",color:"var(--accent-secondary)",fontSize:11,cursor:"pointer" }}>Edit</button>
                            )}
                          </div>
                       </div>
                     </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        <div className="glass-panel" style={{ 
          width:360,flexShrink:0,padding:"16px 16px 40px",
          background: "var(--bg-color)",
          borderLeft: "1px solid var(--border-color)",
          position:"sticky",top:56,maxHeight:"calc(100vh - 56px)",overflowY:"auto" 
        }}>
          <div style={{ fontSize:14,fontWeight:700,marginBottom:14,color:"var(--accent-color)" }}>Related Videos</div>
          {related.length===0 && <div style={{fontSize:12, color:"var(--text-color)", opacity: 0.5}}>No related videos found...</div>}
          {related.map(rv=>{
            const [rc1,rc2] = COLORS[(rv.color||0)%COLORS.length];
            return (
              <Link key={rv._id} href={`/watch?id=${rv._id}`} style={{ textDecoration:"none" }}>
                <div className="interactive-card" style={{ display:"flex",gap:10,padding:"8px",borderRadius:10,marginBottom:4,cursor:"pointer", border:"1px solid transparent" }}>
                  <div style={{ width:160,height:90,flexShrink:0,borderRadius:8,background:`linear-gradient(135deg,${rc1},${rc2})`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",color:"rgba(255,255,255,0.25)" }}>
                    {rv.thumbnailUrl ? <img src={rv.thumbnailUrl} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:8}} /> : <PlayIcon />}
                    <div style={{ position:"absolute",bottom:4,right:4,background:"rgba(0,0,0,0.85)",color:"#fff",fontSize:11,fontWeight:700,padding:"1px 5px",borderRadius:3 }}>{rv.duration||"--"}</div>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:"var(--text-color)",lineHeight:1.35,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{rv.title}</div>
                    <div style={{ fontSize:12,color:"var(--text-color)", opacity: 0.7 }}>{rv.uploaderName}</div>
                    <div style={{ fontSize:11,color:"var(--text-color)", opacity: 0.5, marginTop:1 }}>{fmtViews(rv.views)} views</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={null}>
      <WatchPageContent />
    </Suspense>
  );
}
