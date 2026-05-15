"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import JellyCard from "@/components/JellyCard";
import StoriesBar from "@/components/StoriesBar";
import type { JellyRate } from "@/lib/types";

type FeedTab = "forYou" | "following";

const PAGE_SIZE = 15;

export default function FeedPage() {
  const supabase = createClient();
  const [jellies, setJellies] = useState<JellyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const [myUsername, setMyUsername] = useState<string | undefined>();
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [tab, setTab] = useState<FeedTab>("forYou");
  const [feedGenderFilter, setFeedGenderFilter] = useState<"all" | "male" | "female">("all");

  // Pull-to-refresh
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      setUserId(uid);
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url, feed_gender_filter")
          .eq("id", uid).single();
        if (profile) {
          setMyUsername(profile.username);
          setMyAvatar(profile.avatar_url);
          setFeedGenderFilter((profile.feed_gender_filter as "all" | "male" | "female") ?? "all");
        }
      }
    }
    init();
  }, []);

  const fetchPage = useCallback(async (
    feedTab: FeedTab,
    genderFilter: "all" | "male" | "female",
    uid: string | undefined,
    page: number,
  ): Promise<JellyRate[]> => {
    let q = supabase
      .from("jellyrates")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (feedTab === "following" && uid) {
      const { data: followData } = await supabase
        .from("follows").select("following_id").eq("follower_id", uid);
      const ids = followData?.map((f: any) => f.following_id) ?? [];
      if (ids.length === 0) return [];
      q = q.in("user_id", ids);
    }
    if (genderFilter !== "all") q = q.in("audience", ["all", genderFilter]);

    const { data } = await q;
    if (!data?.length) return [];

    const userIds = [...new Set(data.map((j: any) => j.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles").select("id, username, avatar_url, full_name").in("id", userIds);
    const profileMap: Record<string, any> = {};
    profilesData?.forEach((p: any) => { profileMap[p.id] = p; });

    let likedSet = new Set<string>(), savedSet = new Set<string>();
    if (uid) {
      const jellyIds = data.map((j: any) => j.id);
      const [{ data: ld }, { data: sd }] = await Promise.all([
        supabase.from("likes").select("jellyrate_id").eq("user_id", uid).in("jellyrate_id", jellyIds),
        supabase.from("saves").select("jellyrate_id").eq("user_id", uid).in("jellyrate_id", jellyIds),
      ]);
      likedSet = new Set(ld?.map((l: any) => l.jellyrate_id) ?? []);
      savedSet = new Set(sd?.map((s: any) => s.jellyrate_id) ?? []);
    }

    return data.map((j: any) => ({
      ...j,
      profile: profileMap[j.user_id] ?? null,
      user_liked: likedSet.has(j.id),
      user_saved: savedSet.has(j.id),
      likes_count: j.likes_count ?? 0,
      comments_count: j.comments_count ?? 0,
      rejellies_count: j.rejellies_count ?? 0,
    }));
  }, []);

  const loadInitial = useCallback(async (feedTab: FeedTab, genderFilter: "all" | "male" | "female", uid?: string) => {
    setLoading(true);
    pageRef.current = 0;
    const items = await fetchPage(feedTab, genderFilter, uid, 0);
    setJellies(items);
    setHasMore(items.length === PAGE_SIZE);
    setLoading(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const items = await fetchPage(tab, feedGenderFilter, userId, nextPage);
    if (items.length > 0) {
      pageRef.current = nextPage;
      setJellies(prev => [...prev, ...items]);
    }
    setHasMore(items.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, tab, feedGenderFilter, userId, fetchPage]);

  useEffect(() => {
    if (userId !== undefined) loadInitial(tab, feedGenderFilter, userId);
  }, [tab, feedGenderFilter, userId]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // Pull-to-refresh handlers
  function handleTouchStart(e: React.TouchEvent) {
    if ((containerRef.current?.scrollTop ?? 0) > 0) return;
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchMove(e: React.TouchEvent) {
    if ((containerRef.current?.scrollTop ?? 0) > 0) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      setIsPulling(true);
      setPullY(Math.min(dy * 0.4, 80));
    }
  }
  async function handleTouchEnd() {
    if (pullY >= 60) {
      setIsRefreshing(true);
      setPullY(40);
      await loadInitial(tab, feedGenderFilter, userId);
      setIsRefreshing(false);
    }
    setIsPulling(false);
    setPullY(0);
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: pullY }}
        >
          <div className={`w-8 h-8 rounded-full border-2 border-[#e8363a] border-t-transparent ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: isRefreshing ? undefined : `rotate(${pullY * 4}deg)` }}
          />
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-[#e8363a]">Jelly</span><span className="text-[#2a2a2a]">Rate</span>
          </h1>
          <div className="flex items-center gap-1">
            <Link href="/activity">
              <div className="w-9 h-9 flex items-center justify-center text-[#bbb]">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Feed tabs */}
        <div className="flex px-4 pt-1">
          {(["forYou", "following"] as FeedTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${
                tab === t ? "border-[#e8363a] text-[#e8363a]" : "border-transparent text-[#bbb]"
              }`}
            >
              {t === "forYou" ? "Para Ti" : "Siguiendo"}
            </button>
          ))}
        </div>

        <div className="h-2" style={{
          backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(315deg, #e8e3dd 25%, transparent 25%), linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
          backgroundSize: "16px 16px", backgroundColor: "#f2f1ed",
        }} />
      </header>

      {/* Stories */}
      <StoriesBar currentUserId={userId} myUsername={myUsername} myAvatar={myAvatar} />

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col gap-0">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-[#e8e3dd] animate-pulse bg-white">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-[#ece8e3]" />
                <div className="flex-1">
                  <div className="h-3 bg-[#ece8e3] rounded w-20 mb-1.5" />
                  <div className="h-2.5 bg-[#ece8e3] rounded w-32" />
                </div>
              </div>
              <div className="aspect-square bg-[#f0ede8]" />
              <div className="h-8 bg-[#4a4a4a]" />
              <div className="h-9 bg-[#f0ede8]" />
            </div>
          ))}
        </div>
      ) : jellies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 gap-5">
          <div className="w-20 h-20 rounded-3xl bg-[#f0ede8] border border-[#e8e3dd] flex items-center justify-center">
            {tab === "following" ? <span className="text-3xl">👥</span> : <span className="text-3xl">⭐</span>}
          </div>
          <div className="text-center">
            <p className="font-black uppercase tracking-wide text-[#2a2a2a]">
              {tab === "following" ? "Sin posts de quienes sigues" : "Sin JellyRates aún"}
            </p>
            <p className="text-sm text-[#999] mt-1">
              {tab === "following" ? "Sigue personas para ver sus rates aquí" : "Sé el primero en calificar algo"}
            </p>
          </div>
          {tab === "following" ? (
            <Link href="/explore">
              <button className="px-6 py-3 rounded-2xl bg-[#e8363a] text-sm font-black text-white uppercase tracking-widest">
                Buscar Personas
              </button>
            </Link>
          ) : (
            <Link href="/create">
              <button className="px-6 py-3 rounded-2xl bg-[#e8363a] text-sm font-black text-white uppercase tracking-widest">
                Crear JellyRate
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div>
          {jellies.map(jelly => (
            <JellyCard key={jelly.id} jelly={jelly} currentUserId={userId} />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {loadingMore && (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-[#e8363a] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!hasMore && jellies.length > 0 && (
            <div className="py-8 flex items-center justify-center">
              <p className="text-xs text-[#bbb] font-black uppercase tracking-widest">— Fin del feed —</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
