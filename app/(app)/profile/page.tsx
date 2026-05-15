"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, JellyRate } from "@/lib/types";
import { ScoreColor } from "@/components/JellyCard";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jellies, setJellies] = useState<JellyRate[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jellies" | "hashtags">("jellies");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { router.push("/login"); return; }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      const { data: jelliesData } = await supabase
        .from("jellyrates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setJellies(jelliesData ?? []);

      const { count: followers } = await supabase
        .from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id);
      const { count: following } = await supabase
        .from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id);

      setStats({
        followers: followers ?? 0,
        following: following ?? 0,
        total: jelliesData?.length ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse bg-[#f2f1ed] min-h-screen">
        <div className="h-14 bg-white" />
        <div className="h-2 bg-[#e8e3dd]" />
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

  const username = profile?.username ?? "usuario";

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="w-10" />
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a]">PERFIL</h1>
          <Link href="/profile/settings">
            <div className="w-10 h-10 flex items-center justify-center text-[#999]">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </Link>
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
      </header>

      {/* Profile info */}
      <div className="bg-white px-4 pt-5 pb-0">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#ece8e3] border-3 border-white shadow-md overflow-hidden flex items-center justify-center font-black text-2xl text-[#999] flex-shrink-0"
            style={{ border: '3px solid white', boxShadow: '0 0 0 2px #e0dbd4' }}>
            {profile?.avatar_url
              ? <Image src={profile.avatar_url} alt="" width={80} height={80} className="object-cover" />
              : username[0].toUpperCase()
            }
          </div>

          {/* Name + bio */}
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-xs font-bold text-[#999] uppercase tracking-widest">@{username}</p>
            <p className="font-black text-xl text-[#2a2a2a] uppercase tracking-wide leading-tight">
              {profile?.full_name || username}
            </p>
            {profile?.bio && (
              <p className="text-xs text-[#777] mt-1 uppercase leading-snug">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats — ribbon style */}
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

        {/* Edit profile button */}
        <div className="py-3">
          <Link href="/profile/edit">
            <div className="w-full py-2 rounded-xl border border-[#e0dbd4] text-xs font-black text-[#4a4a4a] uppercase tracking-widest text-center bg-[#f8f7f5]">
              Editar Perfil
            </div>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-t border-[#e8e3dd]">
        <button
          onClick={() => setActiveTab("jellies")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 transition-colors border-b-2 ${
            activeTab === "jellies" ? "border-[#e8363a]" : "border-transparent"
          }`}
        >
          {/* JR icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <text x="2" y="18" fontSize="16" fontWeight="900" fill={activeTab === "jellies" ? "#e8363a" : "#bbb"} fontFamily="sans-serif">JR</text>
          </svg>
        </button>
        <button
          onClick={() => setActiveTab("hashtags")}
          className={`flex-1 py-3 flex items-center justify-center transition-colors border-b-2 ${
            activeTab === "hashtags" ? "border-[#e8363a]" : "border-transparent"
          }`}
        >
          <span className={`text-lg font-black ${activeTab === "hashtags" ? "text-[#e8363a]" : "text-[#bbb]"}`}>#</span>
        </button>
      </div>

      {/* Zigzag below tabs */}
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
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-[#999] text-sm uppercase font-black">Sin JellyRates aún</p>
          <button
            onClick={() => router.push("/create")}
            className="px-6 py-3 rounded-2xl bg-[#e8363a] text-sm font-black text-white uppercase tracking-widest"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-px bg-[#e8e3dd]">
          {jellies.map(jelly => (
            <div key={jelly.id} className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
              {jelly.photo_url ? (
                <Image src={jelly.photo_url} alt={jelly.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-[#ccc]">
                  {jelly.title}
                </div>
              )}
              <div
                className="absolute bottom-0 left-0 w-9 h-9 flex items-center justify-center text-xs font-black text-white shadow-lg"
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
