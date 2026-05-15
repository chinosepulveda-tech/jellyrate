"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  profile?: { username: string; avatar_url: string | null };
}

interface Props {
  jellyId: string;
  jellyTitle: string;
  currentUserId?: string;
  onClose: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function CommentsSheet({ jellyId, jellyTitle, currentUserId, onClose }: Props) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
    setTimeout(() => inputRef.current?.focus(), 300);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [jellyId]);

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("id, user_id, text, created_at")
      .eq("jellyrate_id", jellyId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data && data.length > 0) {
      const uids = [...new Set(data.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", uids);
      const pm: Record<string, any> = {};
      profiles?.forEach((p: any) => { pm[p.id] = p; });
      setComments(data.map((c: any) => ({ ...c, profile: pm[c.user_id] })));
    } else {
      setComments([]);
    }
    setLoading(false);
  }

  async function submitComment() {
    if (!currentUserId || !text.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ user_id: currentUserId, jellyrate_id: jellyId, text: text.trim() })
      .select("id, user_id, text, created_at")
      .single();

    if (!error && data) {
      const { data: profile } = await supabase
        .from("profiles").select("username, avatar_url").eq("id", currentUserId).single();
      setComments(prev => [...prev, { ...data, profile: profile ?? undefined }]);
      setText("");
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
    setSubmitting(false);
  }

  async function deleteComment(commentId: string) {
    await supabase.from("comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "80dvh" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#e0dbd4]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-[#f0ede8] flex-shrink-0">
          <h2 className="font-black text-sm uppercase tracking-widest text-[#2a2a2a]">Comentarios</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f0ede8]">
            <svg width="14" height="14" fill="none" stroke="#999" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#e8363a] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl">💬</span>
              <p className="text-xs font-black text-[#bbb] uppercase tracking-widest text-center">
                Sin comentarios aún
              </p>
              <p className="text-xs text-[#ccc] text-center">¡Sé el primero en comentar!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#f0ede8] overflow-hidden flex items-center justify-center font-black text-sm text-[#bbb] flex-shrink-0">
                  {comment.profile?.avatar_url ? (
                    <Image src={comment.profile.avatar_url} alt="" width={36} height={36} className="object-cover" />
                  ) : (
                    (comment.profile?.username?.[0] ?? "?").toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-black text-[#5bbcb3] uppercase tracking-wide">
                      {comment.profile?.username ?? "usuario"}
                    </span>
                    <span className="text-[10px] text-[#bbb]">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#2a2a2a] mt-0.5 leading-snug">{comment.text}</p>
                </div>
                {comment.user_id === currentUserId && (
                  <button onClick={() => deleteComment(comment.id)}
                    className="flex-shrink-0 text-[#ddd] hover:text-[#e8363a] transition-colors mt-1">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-[#f0ede8] flex-shrink-0 pb-safe"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && submitComment()}
            placeholder="Agrega un comentario..."
            maxLength={500}
            className="flex-1 bg-[#f5f2ee] rounded-2xl px-4 py-2.5 text-sm text-[#2a2a2a] placeholder:text-[#bbb] outline-none"
          />
          <button
            onClick={submitComment}
            disabled={!text.trim() || submitting || !currentUserId}
            className="w-10 h-10 rounded-full bg-[#e8363a] flex items-center justify-center disabled:opacity-40 transition-opacity active:scale-95"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
