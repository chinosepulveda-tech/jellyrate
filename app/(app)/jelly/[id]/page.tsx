"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import JellyCard from "@/components/JellyCard";
import type { JellyRate } from "@/lib/types";

export default function JellyDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [jelly, setJelly] = useState<JellyRate | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
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
      setLoading(false);
    }
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#f2f1ed]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
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
            JELLYRATE
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
        <JellyCard jelly={jelly} currentUserId={userId} />
      ) : null}
    </div>
  );
}
