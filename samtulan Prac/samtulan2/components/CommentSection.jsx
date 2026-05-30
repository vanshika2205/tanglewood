import { useState } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useUI } from "@/lib/UIContext";

function CreatorAvatar({ name, src, size=36 }) {
  if (src) {
    return <img src={src} alt={name} style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,objectFit:"cover",border:"1px solid var(--border-color)" }} />;
  }
  const i = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const h = (name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
  return <div style={{ width:size,height:size,borderRadius:"50%",flexShrink:0,background:`hsl(${h},40%,22%)`,border:`1.5px solid hsl(${h},40%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:`hsl(${h},60%,75%)` }}>{i}</div>;
}

export default function CommentSection({ videoId, initialComments, session, status, isAdminOrMod }) {
  const { colorMode } = useUI();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(initialComments || []);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const submitComment = async () => {
    if (!comment.trim() || status !== "authenticated") return;
    const txt = comment;
    setComment("");
    
    if (editingDoc) {
      const body = { videoId, action: editingDoc.type==="comment"?"edit_comment":"edit_reply", text: txt, commentId: editingDoc.commentId, replyId: editingDoc.replyId };
      const res = await fetch("/api/videos/comments", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      if (res.ok) {
        setComments(prev => prev.map(c => {
          if (c._id === editingDoc.commentId) {
            if (editingDoc.type === "comment") return { ...c, text: txt, isEdited: true };
            return { ...c, replies: c.replies.map(r => r._id === editingDoc.replyId ? { ...r, text: txt, isEdited: true } : r) };
          }
          return c;
        }));
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
    const url = `/api/videos/comments?videoId=${videoId}&commentId=${commentId}${replyId ? `&replyId=${replyId}` : ""}`;
    await fetch(url, { method: "DELETE" });
    if (replyId) {
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, replies: c.replies.filter(r => r._id !== replyId) } : c));
    } else {
      setComments(prev => prev.filter(c => c._id !== commentId));
    }
  };

  return (
    <div style={{ marginTop: "24px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>{comments.length} Comments</h3>
      
      {/* Input Field */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
        <CreatorAvatar name={session?.user?.name || "Guest"} size={40} />
        <div style={{ flex: 1 }}>
          {editingDoc && <div style={{ fontSize: "12px", color: "var(--accent-secondary)", marginBottom: "4px" }}>Editing {editingDoc.type}</div>}
          {replyingTo && <div style={{ fontSize: "12px", color: "var(--accent-secondary)", marginBottom: "4px" }}>Replying...</div>}
          <textarea 
            value={comment} onChange={e => setComment(e.target.value)} 
            placeholder={status === "authenticated" ? "Add a comment..." : "Login to comment..."} rows={1} 
            disabled={status !== "authenticated"}
            style={{ 
              width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--border-color)", 
              color: "var(--text-color)", fontSize: "14px", fontFamily: "inherit", outline: "none", resize: "none", 
              lineHeight: "1.6", padding: "4px 0", transition: "border-color 0.2s" 
            }} 
            onFocus={(e) => e.target.style.borderBottomColor = "var(--text-color)"}
            onBlur={(e) => e.target.style.borderBottomColor = "var(--border-color)"}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            {status === "authenticated" && (
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowPicker(!showPicker)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "18px", opacity: 0.7 }}>😀</button>
                {showPicker && (
                  <div style={{ position: "absolute", zIndex: 50, marginTop: "8px" }}>
                    <EmojiPicker theme={colorMode === "dark" ? Theme.DARK : Theme.LIGHT} onEmojiClick={e => { setComment(p => p + e.emoji); setShowPicker(false); }} />
                  </div>
                )}
              </div>
            )}
            {(comment || replyingTo || editingDoc) && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => { setComment(""); setReplyingTo(null); setEditingDoc(null); }} 
                  style={{ background: "none", border: "none", color: "var(--text-color)", opacity: 0.6, fontSize: "13px", cursor: "pointer", padding: "8px 16px", borderRadius: "20px" }}
                >
                  Cancel
                </button>
                <button 
                  onClick={submitComment} 
                  style={{ background: "var(--accent-color)", border: "none", color: colorMode === "dark" ? "#000" : "#FFF", fontSize: "13px", fontWeight: "700", cursor: "pointer", padding: "8px 16px", borderRadius: "20px" }}
                >
                  Comment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      {comments.map(c => (
        <div key={c._id} style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <CreatorAvatar name={c.userName} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>@{c.userName}</span>
              <span style={{ fontSize: "12px", color: "var(--text-color)", opacity: 0.5 }}>{new Date(c.createdAt).toLocaleDateString()} {c.isEdited && "(edited)"}</span>
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-color)", lineHeight: "1.5", marginBottom: "8px" }}>{c.text}</div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button style={{ background: "none", border: "none", color: "var(--text-color)", opacity: 0.6, fontSize: "12px", cursor: "pointer" }}>👍 {c.likes || 0}</button>
              <button onClick={() => { setReplyingTo(c._id); setComment(""); }} style={{ background: "none", border: "none", color: "var(--text-color)", opacity: 0.6, fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Reply</button>
              {(session?.user?.id === c.user || isAdminOrMod) && (
                <>
                  <button onClick={() => deleteComment(c._id)} style={{ background: "none", border: "none", color: "#E55555", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                  {session?.user?.id === c.user && <button onClick={() => { setEditingDoc({type:"comment", commentId:c._id, text:c.text}); setComment(c.text); }} style={{ background: "none", border: "none", color: "var(--text-color)", opacity: 0.6, fontSize: "11px", cursor: "pointer" }}>Edit</button>}
                </>
              )}
            </div>

            {/* Replies */}
            {c.replies?.map(r => (
              <div key={r._id} style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <CreatorAvatar name={r.userName} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700" }}>@{r.userName}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-color)", opacity: 0.5 }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-color)", lineHeight: "1.4", marginBottom: "4px" }}>{r.text}</div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {(session?.user?.id === r.user || isAdminOrMod) && (
                      <button onClick={() => deleteComment(c._id, r._id)} style={{ background: "none", border: "none", color: "#E55555", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                    )}
                    {session?.user?.id === r.user && (
                      <button onClick={() => { setEditingDoc({type:"reply", commentId:c._id, replyId:r._id, text:r.text}); setComment(r.text); }} style={{ background: "none", border: "none", color: "var(--text-color)", opacity: 0.6, fontSize: "11px", cursor: "pointer" }}>Edit</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
