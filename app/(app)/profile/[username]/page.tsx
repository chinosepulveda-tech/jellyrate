"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, JellyRate } from "@/lib/types";
import { ScoreColor } from "@/components/JellyCard";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jellies, setJellies] = useState<JellyRate[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSelf, setIsSelf] = useState(false);
  const [activeTab, setActiveTab] = useState<"jellies" | "hashtags">("jellies");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id ?? null;
      setCurrentUserId(currentId);

      // Load profile by username
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!profileData) { router.push("/feed"); return; }
      setProfile(profileData);
      setIsSelf(currentId === profileData.id);

      // Jellies
      const { data: jelliesData } = await supabase
        .from("jellyrates")
        .select("*")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false });
      setJellies(jelliesData ?? []);

      // Stats
      const { count: followers } = await supabase
        .from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileData.id);
      const { count: following } = await supabase
        .from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileData.id);
      setStats({ followers: followers ?? 0, following: following ?? 0, total: jelliesData?.length ?? 0 });

      // Is following?
      if (currentId && currentId !== profileData.id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", currentId)
          .eq("following_id", profileData.id)
          .single();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    }
    load();
  }, [username]);

  async function toggleFollow() {
    if (!currentUserId || !profile || isSelf) return;
    if (isFollowing) {
      await supabase.from("follows").delete().match({ follower_id: currentUserId, following_id: profile.id });
      setStats(s => ({ ...s, followers: s.followers - 1 }));
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: profile.id, status: "accepted" });
      setStats(s => ({ ...s, followers: s.followers + 1 }));
    }
    setIsFollowing(!isFollowing);
  }

  if (loading) {
    return (
      <div className="animate-pulse bg-[#f2f1ed] min-h-screen">
        <div className="h-14 bg-white" />
        <div className="px-4 py-6 flex gap-4">
          <div className="w-20 h-20 rounded-full bg-[#ece8e3]" />
          <div className="flex-1 pt-2">
            <div className="h-3 bg-[#ece8e3] rounded w-20 mb-2" />
            <div className="h-5 bg-[#ece8e3] rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center px-4 py-3.5 gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8363a]">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a] flex-1 text-center mr-10">PERFIL</h1>
        </div>
        <div className="h-2" style={{
          backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0,
            linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0,
            linear-gradient(315deg, #e8e3dd 25%, transparent 25%),
            linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
          backgroundSize: '16px 16px',
          backgroundColor: '#f2f1ed',
        }} />
      </header>

      {/* Profile info */}
      <div className="bg-white px-4 pt-5 pb-0">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-[#ece8e3] overflow-hidden flex items-center justify-center font-black text-2xl text-[#999] flex-shrink-0"
            style={{ border: '3px solid white', boxShadow: '0 0 0 2px #e0dbd4' }}>
            {profile.avatar_url
              ? <Image src={profile.avatar_url} alt="" width={80} height={80} className="object-cover" />
              : (profile.username[0] ?? "?").toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-xs font-bold text-[#999] uppercase tracking-widest">@{profile.username}</p>
            <p className="font-black text-xl text-[#2a2a2a] uppercase tracking-wide leading-tight">
              {profile.full_name || profile.username}
            </p>
            {profile.bio && (
              <p className="text-xs text-[#777] mt-1 uppercase leading-snug">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-0 mt-4">
          {[
            { label: "JELLYS", value: stats.total },
            { label: "SEGUIDORES", value: stats.followers },
            { label: "SIGUIENDO", value: stats.following },
          ].map((stat, i) => (
            <div key={i} className="flex-1 flex flex-col items-center py-2.5 border-r border-[#e0dbd4] last:border-r-0">
              <span className="text-xl font-black text-[#e8363a]">{stat.value}</span>
              <span className="text-[9px] font-black text-[#e8363a] uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Follow / Edit button */}
        <div className="py-3">
          {isSelf ? (
            <button
              onClick={() => router.push("/profile/edit")}
              className="w-full py-2 rounded-xl border border-[#e0dbd4] text-xs font-black text-[#4a4a4a] uppercase tracking-widest text-center bg-[#f8f7f5]"
            >
              Editar Perfil
            </button>
          ) : (
            <button
              onClick={toggleFollow}
              className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                isFollowing
                  ? "bg-[#f0ede8] border border-[#e0dbd4] text-[#4a4a4a]"
                  : "bg-[#d6d2cc] text-white"
              }`}
            >
              {isFollowing ? "Siguiendo ✓" : "FOLLOW"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-t border-[#e8e3dd]">
        <button
          onClick={() => setActiveTab("jellies")}
          className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${
            activeTab === "jellies" ? "border-[#e8363a]" : "border-transparent"
          }`}
        >
          <span className={`text-xs font-black uppercase tracking-widest ${activeTab === "jellies" ? "text-[#e8363a]" : "text-[#bbb]"}`}>
            JR
          </span>
        </button>
        <button
          onClick={() => setActiveTab("hashtags")}
          className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${
            activeTab === "hashtags" ? "border-[#e8363a]" : "border-transparent"
          }`}
        >
          <span className={`text-lg font-black ${activeTab === "hashtags" ? "text-[#e8363a]" : "text-[#bbb]"}`}>#</span>
        </button>
      </div>

      {/* Zigzag */}
      <div className="h-2" style={{
        backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0,
          linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0,
          linear-gradient(315deg, #e8e3dd 25%, transparent 25%),
          linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
        backgroundSize: '16px 16px',
        backgroundColor: '#f2f1ed',
      }} />

      {/* Grid */}
      {jellies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-xs font-black uppercase tracking-widest text-[#999]">Sin JellyRates aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-px bg-[#e8e3dd]">
          {jellies.map(jelly => (
            <div key={jelly.id} className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
              {jelly.photo_url ? (
                <Image src={jelly.photo_url} alt={jelly.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xs p-2 text-center">
                  {jelly.title}
                </div>
              )}
              <div
                className="absolute bottom-0 left-0 w-9 h-9 flex items-center justify-center text-xs font-black text-white"
                style={{
                  backgroundColor: ScoreColor(jelly.score),
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                }}
              >
                {jelly.score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
