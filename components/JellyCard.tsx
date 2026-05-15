"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CommentsSheet from "@/components/CommentsSheet";
import ImageViewer from "@/components/ImageViewer";
import { useToast } from "@/components/Toast";
import type { JellyRate } from "@/lib/types";

// ── Action menu sheet ──────────────────────────────────────────────────
function ActionSheet({
  jelly,
  isOwner,
  onClose,
  onDeleted,
}: {
  jelly: JellyRate;
  isOwner: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este JellyRate?")) return;
    setDeleting(true);
    await supabase.from("jellyrates").delete().eq("id", jelly.id);
    onDeleted?.();
    onClose();
  }

  function handleCopy() {
    const url = `${window.location.origin}/jelly/${jelly.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(onClose, 700);
    });
  }

  function handleReport() {
    alert("Reporte enviado. Gracias.");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[480px] mx-auto bg-white rounded-t-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#e0dbd4]" />
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f5f2ee]">
          <div className="w-12 h-12 rounded-xl bg-[#f0ede8] overflow-hidden flex-shrink-0">
            {jelly.photo_url
              ? <Image src={jelly.photo_url} alt="" width={48} height={48} className="object-cover" unoptimized />
              : <div className="w-full h-full flex items-center justify-center text-lg">{jelly.score}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-[#2a2a2a] truncate">{jelly.title}</p>
            <p className="text-xs text-[#aaa]">Score: {jelly.score}/10</p>
          </div>
        </div>
        <div className="pb-8">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#f5f2ee] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
              {copied
                ? <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                : <svg width="18" height="18" fill="none" stroke="#5bbcb3" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              }
            </div>
            <span className="font-black text-sm text-[#2a2a2a] uppercase tracking-wide">
              {copied ? "¡Copiado!" : "Copiar enlace"}
            </span>
          </button>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#fff0f0] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#fff0f0] flex items-center justify-center flex-shrink-0">
                {deleting
                  ? <div className="w-4 h-4 border-2 border-[#e8363a] border-t-transparent rounded-full animate-spin" />
                  : <svg width="18" height="18" fill="none" stroke="#e8363a" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                }
              </div>
              <span className="font-black text-sm text-[#e8363a] uppercase tracking-wide">
                {deleting ? "Eliminando…" : "Eliminar JellyRate"}
              </span>
            </button>
          )}
          {!isOwner && (
            <button
              onClick={handleReport}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#f5f2ee] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <span className="font-black text-sm text-[#f59e0b] uppercase tracking-wide">Reportar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScoreColor(score: number) {
  if (score >= 9) return "#16a34a";
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "#f59e0b";
  if (score >= 4) return "#f97316";
  return "#e8363a";
}

export function ScoreLabel(score: number) {
  if (score >= 9) return "¡Increíble!";
  if (score >= 8) return "Muy bueno";
  if (score >= 7) return "Bueno";
  if (score >= 6) return "Aceptable";
  if (score >= 5) return "Regular";
  if (score >= 4) return "Mala";
  return "Terrible";
}

interface Props {
  jelly: JellyRate;
  currentUserId?: string;
}

export default function JellyCard({ jelly, currentUserId }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [liked, setLiked] = useState(jelly.user_liked ?? false);
  const [likes, setLikes] = useState(jelly.likes_count ?? 0);
  const [commentsCount] = useState(jelly.comments_count ?? 0);
  const [rejellies, setRejellies] = useState(jelly.rejellies_count ?? 0);
  const [saved, setSaved] = useState(jelly.user_saved ?? false);
  const [showRejelly, setShowRejelly] = useState(false);
  const [rejellyScore, setRejellyScore] = useState(7);
  const [rejellyDone, setRejellyDone] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const lastTap = useRef<number>(0);

  const isOwner = !!(currentUserId && currentUserId === jelly.user_id);

  const scoreColor = ScoreColor(jelly.score);
  const timeAgo = formatTimeAgo(jelly.created_at);
  const username = jelly.profile?.username ?? "usuario";

  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePhotoTap = useCallback(() => {
    const now = Date.now();
    const isDouble = now - lastTap.current < 350;
    lastTap.current = now;

    if (isDouble) {
      // Cancel pending single-tap open
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      if (!liked && currentUserId) {
        doLike();
        setHeartPop(true);
        setTimeout(() => setHeartPop(false), 800);
      }
    } else {
      // Delay single-tap to allow double-tap to cancel it
      singleTapTimer.current = setTimeout(() => {
        if (jelly.photo_url) setShowViewer(true);
      }, 360);
    }
  }, [liked, currentUserId, jelly.photo_url]);

  async function doLike() {
    await supabase.from("likes").insert({ user_id: currentUserId, jellyrate_id: jelly.id });
    setLikes(l => l + 1);
    setLiked(true);
    toast.show("¡Te gustó!", "❤️", "success");
  }

  async function toggleLike() {
    if (!currentUserId) return;
    if (liked) {
      await supabase.from("likes").delete().match({ user_id: currentUserId, jellyrate_id: jelly.id });
      setLikes(l => Math.max(0, l - 1));
      setLiked(false);
    } else {
      doLike();
    }
  }

  async function toggleSave() {
    if (!currentUserId) return;
    if (saved) {
      await supabase.from("saves").delete().match({ user_id: currentUserId, jellyrate_id: jelly.id });
      setSaved(false);
      toast.show("Guardado eliminado", "🔖");
    } else {
      await supabase.from("saves").insert({ user_id: currentUserId, jellyrate_id: jelly.id });
      setSaved(true);
      toast.show("¡Guardado!", "🔖", "success");
    }
  }

  async function submitRejelly() {
    if (!currentUserId) return;
    await supabase.from("rejellies").upsert({
      user_id: currentUserId,
      jellyrate_id: jelly.id,
      score: rejellyScore,
    });
    setShowRejelly(false);
    setRejellyDone(true);
    toast.show(`ReJelly ${rejellyScore}/10 enviado`, "⚡", "success");
    setRejellies(r => r + 1);
  }

  if (deleted) return null;

  return (
    <article className="border-b border-[#ede9e3] bg-white">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/profile/${username}`}>
          <div className="w-9 h-9 rounded-full bg-[#ece8e3] overflow-hidden flex-shrink-0 border-2 border-[#e0dbd4]">
            {jelly.profile?.avatar_url ? (
              <Image src={jelly.profile.avatar_url} alt="" width={36} height={36} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-black text-[#aaa]">
                {username[0].toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={`/profile/${username}`}>
              <span className="font-black text-xs uppercase tracking-widest text-[#5bbcb3]">{username}</span>
            </Link>
            {jelly.category && (
              <span className="text-[10px] text-[#bbb]">{jelly.category}</span>
            )}
          </div>
          {jelly.place_name && (
            <p className="text-[11px] text-[#aaa] truncate leading-tight">📍 {jelly.place_name}</p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-1">
          <span className="text-[11px] text-[#bbb]">{timeAgo}</span>
          <button
            onClick={() => setShowActions(true)}
            className="w-7 h-7 flex items-center justify-center text-[#ccc] active:text-[#999]"
          >
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Photo ── */}
      <div
        className="relative aspect-square bg-[#f0ede8] overflow-hidden select-none"
        onClick={handlePhotoTap}
      >
        {jelly.photo_url ? (
          <Image src={jelly.photo_url} alt={jelly.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="48" height="48" fill="none" stroke="#ddd" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}

        {/* Score badge */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center shadow-lg"
          style={{ backgroundColor: scoreColor, width: 52, height: 52, borderTopRightRadius: 12, borderBottomRightRadius: 12 }}
        >
          <span className="text-2xl font-black text-white leading-none">{jelly.score}</span>
        </div>

        {/* Audience */}
        {jelly.audience && jelly.audience !== "all" && (
          <div className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-0.5">
            <span className="text-[10px] font-bold text-white">{jelly.audience === "male" ? "♂" : "♀"}</span>
          </div>
        )}

        {/* Double-tap heart */}
        {heartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg width="90" height="90" fill="#e8363a" viewBox="0 0 24 24"
              style={{ filter: "drop-shadow(0 4px 12px rgba(232,54,58,0.5))", animation: "heartPop 0.7s ease-out forwards" }}>
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
        )}
      </div>

      {/* ── Title strip ── */}
      <div className="bg-[#2a2a2a] px-4 py-2 flex items-center justify-between">
        <p className="text-sm font-black text-white truncate flex-1 mr-3">{jelly.title}</p>
        <span className="text-[10px] font-black uppercase tracking-widest flex-shrink-0" style={{ color: scoreColor }}>
          {ScoreLabel(jelly.score)}
        </span>
      </div>

      {/* ── Friends / World bar ── */}
      <div className="flex items-stretch h-9">
        <div className="flex-1 flex items-center justify-center gap-1.5 bg-[#e8363a]">
          <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Amigos</span>
          <span className="text-sm font-black text-white">{jelly.friend_avg != null ? jelly.friend_avg.toFixed(1) : "—"}</span>
        </div>
        <div className="w-9 flex items-center justify-center bg-[#5bbcb3]">
          <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.15em]">JR</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5 bg-[#d6d2cc]">
          <span className="text-sm font-black text-[#4a4a4a]">{jelly.global_avg != null ? jelly.global_avg.toFixed(1) : "—"}</span>
          <span className="text-[10px] font-black text-[#777] uppercase tracking-widest">World</span>
        </div>
      </div>

      {/* ── Caption ── */}
      {jelly.description && (
        <div className="px-4 py-2.5 bg-white">
          <p className="text-sm text-[#444] leading-snug">
            <span className="font-black text-[#5bbcb3] mr-1.5 text-xs uppercase">{username}</span>
            {jelly.description}
          </p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center px-2 py-1.5 bg-white border-t border-[#f5f2ee]">
        {/* Like */}
        <button onClick={toggleLike} className="flex items-center gap-1 px-3 py-2 active:scale-90 transition-transform">
          <svg width="22" height="22"
            fill={liked ? "#e8363a" : "none"}
            stroke={liked ? "#e8363a" : "#c8c3bc"}
            strokeWidth={liked ? 0 : 1.8}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {likes > 0 && <span className="text-xs font-bold" style={{ color: liked ? "#e8363a" : "#c8c3bc" }}>{likes}</span>}
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(true)} className="flex items-center gap-1 px-3 py-2 active:scale-90 transition-transform">
          <svg width="21" height="21" fill="none" stroke="#c8c3bc" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {commentsCount > 0 && <span className="text-xs font-bold text-[#c8c3bc]">{commentsCount}</span>}
        </button>

        {/* ReJelly */}
        <button
          onClick={() => !rejellyDone && setShowRejelly(!showRejelly)}
          className="flex items-center gap-1 px-3 py-2 active:scale-90 transition-transform"
        >
          <svg width="20" height="20"
            fill={rejellyDone ? "#f59e0b" : "none"}
            stroke={rejellyDone ? "#f59e0b" : "#c8c3bc"}
            strokeWidth={1.8} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          {rejellies > 0 && <span className="text-xs font-bold" style={{ color: rejellyDone ? "#f59e0b" : "#c8c3bc" }}>{rejellies}</span>}
        </button>

        <div className="flex-1" />

        {/* Save */}
        <button onClick={toggleSave} className="flex items-center gap-1 px-3 py-2 active:scale-90 transition-transform">
          <svg width="20" height="20"
            fill={saved ? "#e8363a" : "none"}
            stroke={saved ? "#e8363a" : "#c8c3bc"}
            strokeWidth={1.8} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </button>
      </div>

      {/* ── ReJelly panel ── */}
      {showRejelly && (
        <div className="mx-4 mb-3 p-4 bg-[#f8f5f1] rounded-2xl border border-[#e8e3dd]">
          <p className="text-xs font-black text-[#2a2a2a] mb-3 uppercase tracking-wide">
            Tu nota para <span className="text-[#e8363a]">{jelly.title}</span>
          </p>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl font-black w-10 text-center" style={{ color: ScoreColor(rejellyScore) }}>
              {rejellyScore}
            </span>
            <input type="range" min={1} max={10} value={rejellyScore}
              onChange={e => setRejellyScore(Number(e.target.value))} className="flex-1" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowRejelly(false)}
              className="flex-1 py-2.5 rounded-xl border border-[#e0dbd4] text-xs font-bold text-[#999]">
              Cancelar
            </button>
            <button onClick={submitRejelly}
              className="flex-1 py-2.5 rounded-xl bg-[#e8363a] text-xs font-black text-white uppercase tracking-wide">
              ReJelly ⚡
            </button>
          </div>
        </div>
      )}

      {/* ── Comments Sheet ── */}
      {showComments && (
        <CommentsSheet
          jellyId={jelly.id}
          jellyTitle={jelly.title}
          currentUserId={currentUserId}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* ── Action Sheet ── */}
      {showActions && (
        <ActionSheet
          jelly={jelly}
          isOwner={isOwner}
          onClose={() => setShowActions(false)}
          onDeleted={() => setDeleted(true)}
        />
      )}

      {/* ── Image Viewer ── */}
      {showViewer && jelly.photo_url && (
        <ImageViewer
          src={jelly.photo_url}
          title={jelly.title}
          score={jelly.score}
          username={username}
          onClose={() => setShowViewer(false)}
        />
      )}
    </article>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}
