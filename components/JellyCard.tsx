"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CommentsSheet from "@/components/CommentsSheet";
import type { JellyRate } from "@/lib/types";

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
  const [liked, setLiked] = useState(jelly.user_liked ?? false);
  const [likes, setLikes] = useState(jelly.likes_count ?? 0);
  const [commentsCount] = useState(jelly.comments_count ?? 0);
  const [rejellies, setRejellies] = useState(jelly.rejellies_count ?? 0);
  const [saved, setSaved] = useState(jelly.user_saved ?? false);
  const [showRejelly, setShowRejelly] = useState(false);
  const [rejellyScore, setRejellyScore] = useState(7);
  const [rejellyDone, setRejellyDone] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const lastTap = useRef<number>(0);

  const scoreColor = ScoreColor(jelly.score);
  const timeAgo = formatTimeAgo(jelly.created_at);
  const username = jelly.profile?.username ?? "usuario";

  const handlePhotoTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      if (!liked && currentUserId) {
        doLike();
        setHeartPop(true);
        setTimeout(() => setHeartPop(false), 800);
      }
    }
    lastTap.current = now;
  }, [liked, currentUserId]);

  async function doLike() {
    await supabase.from("likes").insert({ user_id: currentUserId, jellyrate_id: jelly.id });
    setLikes(l => l + 1);
    setLiked(true);
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
    } else {
      await supabase.from("saves").insert({ user_id: currentUserId, jellyrate_id: jelly.id });
    }
    setSaved(!saved);
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
    setRejellies(r => r + 1);
  }

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
          <button className="w-7 h-7 flex items-center justify-center text-[#ddd] active:text-[#999]">
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
