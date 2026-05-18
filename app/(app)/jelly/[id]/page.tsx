"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import JellyCard from "@/components/JellyCard";
import type { JellyRate } from "@/lib/types";

// ─── Score colour ────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 8) return "#22c55e";
  if (s >= 6) return "#f59e0b";
  if (s >= 4) return "#f97316";
  return "#e8363a";
}

// ─── Mini rating card ────────────────────────────────────────────────────────
interface CommunityRating {
  id: string;
  user_id: string;
  photo_url: string | null;
  score: number;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  likes_count: number;
  comments_count: number;
}

function Avatar({ url, name, size = 28 }: { url: string | null; name: string; size?: number }) {
  const initials = (name || "?").slice(0, 2).toUpperCase();
  if (url) {
    return (
      <img src={url} alt={name} className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full bg-[#e8363a] flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}>
      <span className="text-white font-black text-[10px]">{initials}</span>
    </div>
  );
}

function MiniRatingCard({ rating }: { rating: CommunityRating }) {
  return (
    <Link href={`/jelly/${rating.id}`}
      className="flex items-start gap-3 bg-white border border-[#ede9e3] p-3 active:bg-[#fafaf9] transition-colors"
      style={{ boxShadow: "1px 1px 0 #e0dbd4" }}>
      {/* Photo */}
      {rating.photo_url && (
        <div className="w-16 h-16 flex-shrink-0 overflow-hidden border border-[#e0dbd4]">
          <img src={rating.photo_url} alt={rating.title}
            className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {/* User */}
        <div className="flex items-center gap-1.5 mb-1">
          <Avatar url={rating.avatar_url} name={rating.full_name || rating.username} size={20} />
          <span className="text-[11px] text-[#888] truncate">
            {rating.full_name || `@${rating.username}`}
          </span>
        </div>
        {/* Score */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-black leading-none" style={{ color: scoreColor(rating.score) }}>
            {rating.score}
          </span>
          <span className="text-[10px] text-[#aaa] font-medium">/10</span>
        </div>
        {/* Description */}
        {rating.description && (
          <p className="text-xs text-[#666] leading-snug line-clamp-2">{rating.description}</p>
        )}
      </div>
    </Link>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function JellyDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [jelly, setJelly] = useState<JellyRate | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [communityRatings, setCommunityRatings] = useState<CommunityRating[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user: _authUser } } = await supabase.auth.getUser();
      const uid = _authUser?.id;
      setUserId(uid);

      const { data } = await supabase
        .from("jellyrates")
        .select("*")
        .eq("id", id)
        .single();

      if (!data) { router.push("/feed"); return; }

      // Enrich with profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, full_name")
        .eq("id", data.user_id)
        .single();

      let userLiked = false;
      let userSaved = false;
      if (uid) {
        const [{ data: likeData }, { data: saveData }] = await Promise.all([
          supabase.from("likes").select("user_id").eq("user_id", uid).eq("jellyrate_id", id).single(),
          supabase.from("saves").select("user_id").eq("user_id", uid).eq("jellyrate_id", id).single(),
        ]);
        userLiked = !!likeData;
        userSaved = !!saveData;
      }

      setJelly({
        ...data,
        profile: profile ?? undefined,
        user_liked: userLiked,
        user_saved: userSaved,
        likes_count: data.likes_count ?? 0,
        comments_count: data.comments_count ?? 0,
        rejellies_count: data.rejellies_count ?? 0,
      });

      // This item is a canonical → load community ratings
      // (canonical_id IS NULL means it is itself a canonical)
      if (!data.canonical_id) {
        const { data: ratings } = await supabase
          .rpc("get_canonical_ratings", { canonical_jellyrate_id: id });
        if (ratings && ratings.length > 0) {
          setCommunityRatings(ratings as CommunityRating[]);
          // Average = this post's score + all linked scores
          const allScores = [data.score, ...ratings.map((r: CommunityRating) => r.score)];
          const avg = allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length;
          setAvgScore(Math.round(avg * 10) / 10);
        }
      }

      setLoading(false);
    }
    load();
  }, [id]);

  const totalRatings = communityRatings.length + 1; // includes this post

  return (
    <div className="min-h-screen bg-[#f2f1ed]">
      {/* Header */}
      <header className="sticky top-0 safe-header z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center px-4 py-3.5 gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8363a]"
          >
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a] flex-1 text-center mr-10">
            {jelly?.title || "JELLYRATE"}
          </h1>
        </div>
        <div className="h-2" style={{
          backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(315deg, #e8e3dd 25%, transparent 25%), linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
          backgroundSize: "16px 16px",
          backgroundColor: "#f2f1ed",
        }} />
      </header>

      {loading ? (
        <div className="flex flex-col gap-0">
          <div className="border-b border-[#e8e3dd] animate-pulse bg-white">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-[#ece8e3]" />
              <div className="flex-1">
                <div className="h-3 bg-[#ece8e3] rounded w-20 mb-1.5" />
              </div>
            </div>
            <div className="aspect-square bg-[#f0ede8]" />
            <div className="h-8 bg-[#4a4a4a]" />
          </div>
        </div>
      ) : jelly ? (
        <>
          {/* Main JellyCard */}
          <JellyCard jelly={jelly} currentUserId={userId} />

          {/* ── Community ratings section ────────────────────────────────── */}
          {communityRatings.length > 0 && avgScore !== null && (
            <section className="mt-2 pb-6">
              {/* Community score banner */}
              <div className="bg-white border-y border-[#ede9e3] px-4 py-4 flex items-center gap-4"
                style={{ boxShadow: "0 1px 0 #ede9e3" }}>
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#888] mb-0.5">
                    Puntuación de la comunidad
                  </p>
                  <p className="text-xs text-[#aaa]">
                    Basada en {totalRatings} {totalRatings === 1 ? "valoración" : "valoraciones"}
                  </p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black leading-none"
                    style={{ color: scoreColor(avgScore) }}>
                    {avgScore}
                  </span>
                  <span className="text-sm text-[#aaa] font-medium mb-1">/10</span>
                </div>
              </div>

              {/* Hatch divider */}
              <div className="h-2" style={{
                backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(315deg, #e8e3dd 25%, transparent 25%), linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
                backgroundSize: "16px 16px",
                backgroundColor: "#f2f1ed",
              }} />

              {/* Section header */}
              <div className="px-4 pt-4 pb-2">
                <h2 className="font-black text-xs uppercase tracking-widest text-[#1a1a1a]">
                  Otras valoraciones
                </h2>
              </div>

              {/* Rating list */}
              <div className="flex flex-col gap-2 px-4">
                {communityRatings.map(r => (
                  <MiniRatingCard key={r.id} rating={r} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
