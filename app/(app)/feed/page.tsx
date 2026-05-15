"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import JellyCard from "@/components/JellyCard";
import type { JellyRate } from "@/lib/types";

export default function FeedPage() {
  const supabase = createClient();
  const [jellies, setJellies] = useState<JellyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    async function loadFeed() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      setUserId(uid);

      // Load user's feed_gender_filter preference from profile
      let feedGenderFilter: "all" | "male" | "female" = "all";
      if (uid) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("feed_gender_filter")
          .eq("id", uid)
          .single();
        feedGenderFilter = (profileData?.feed_gender_filter as "all" | "male" | "female") ?? "all";
      }

      let query = supabase
        .from("jellyrates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      // Auto-filter by user's saved preference — no visible UI control
      if (feedGenderFilter !== "all") {
        query = query.in("audience", ["all", feedGenderFilter]);
      }

      const { data, error } = await query;
      if (error) console.error("Feed error:", error);

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((j: any) => j.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, full_name")
          .in("id", userIds);

        const profileMap: Record<string, any> = {};
        profilesData?.forEach((p: any) => { profileMap[p.id] = p; });

        const enriched = data.map((j: any) => ({
          ...j,
          profile: profileMap[j.user_id] ?? null,
          likes_count: 0,
          rejellies_count: 0,
        }));
        setJellies(enriched);
      } else {
        setJellies([]);
      }
      setLoading(false);
    }
    loadFeed();
  }, []);

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-[#e8363a]">Jelly</span><span className="text-[#2a2a2a]">Rate</span>
          </h1>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center text-[#555]">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Zigzag border */}
        <div className="h-2" style={{
          backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0,
            linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0,
            linear-gradient(315deg, #e8e3dd 25%, transparent 25%),
            linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
          backgroundSize: '16px 16px',
          backgroundColor: '#f2f1ed',
        }} />
      </header>

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col gap-0">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-[#e8e3dd] animate-pulse bg-white">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-[#ece8e3]" />
                <div className="flex-1">
                  <div className="h-3 bg-[#ece8e3] rounded w-24 mb-1.5" />
                  <div className="h-2.5 bg-[#ece8e3] rounded w-40" />
                </div>
              </div>
              <div className="aspect-square bg-[#f0ede8]" />
              <div className="h-8 bg-[#4a4a4a]" />
              <div className="h-10 bg-[#f0ede8]" />
            </div>
          ))}
        </div>
      ) : jellies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 gap-4">
          <div className="w-20 h-20 rounded-3xl bg-[#f0ede8] border border-[#e8e3dd] flex items-center justify-center">
            <span className="text-3xl">⭐</span>
          </div>
          <div className="text-center">
            <p className="font-black uppercase tracking-wide text-[#2a2a2a]">Sin JellyRates aún</p>
            <p className="text-sm text-[#999] mt-1">Sé el primero en calificar algo</p>
          </div>
        </div>
      ) : (
        <div>
          {jellies.map(jelly => (
            <JellyCard key={jelly.id} jelly={jelly} currentUserId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}
