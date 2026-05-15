"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, JellyRate } from "@/lib/types";
import { ScoreColor } from "@/components/JellyCard";

type GridTab = "jellies" | "rejellies" | "saved";

const ZigZag = () => (
  <div className="h-2" style={{
    backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(315deg, #e8e3dd 25%, transparent 25%), linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
    backgroundSize: "16px 16px",
    backgroundColor: "#f2f1ed",
  }} />
);

function GridItem({ jelly }: { jelly: JellyRate }) {
  return (
    <Link href={`/jelly/${jelly.id}`}>
      <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
        {jelly.photo_url ? (
          <Image src={jelly.photo_url} alt={jelly.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2 text-center text-[10px] text-[#ccc]">
            {jelly.title}
          </div>
        )}
        <div
          className="absolute bottom-0 left-0 w-9 h-9 flex items-center justify-center text-xs font-black text-white"
          style={{ backgroundColor: ScoreColor(jelly.score), borderTopRightRadius: 8, borderBottomRightRadius: 8 }}
        >
          {jelly.score}
        </div>
      </div>
    </Link>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jellies, setJellies] = useState<JellyRate[]>([]);
  const [rejellies, setRejellies] = useState<JellyRate[]>([]);
  const [saved, setSaved] = useState<JellyRate[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GridTab>("jellies");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const [{ data: profileData }, { data: jelliesData }, { count: followers }, { count: following }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("jellyrates").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);

      setProfile(profileData);
      setJellies(jelliesData ?? []);
      setStats({ followers: followers ?? 0, following: following ?? 0, total: jelliesData?.length ?? 0 });
      setLoading(false);
    }
    load();
  }, []);

  async function loadRejellies() {
    if (!userId || rejellies.length > 0) return;
    const { data: rdata } = await supabase
      .from("rejellies")
      .select("jellyrate_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (rdata?.length) {
      const ids = rdata.map((r: any) => r.jellyrate_id);
      const { data: jelliesData } = await supabase
        .from("jellyrates").select("*").in("id", ids);
      setRejellies(jelliesData ?? []);
    }
  }

  async function loadSaved() {
    if (!userId || saved.length > 0) return;
    const { data: sdata } = await supabase
      .from("saves")
      .select("jellyrate_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (sdata?.length) {
      const ids = sdata.map((s: any) => s.jellyrate_id);
      const { data: jelliesData } = await supabase
        .from("jellyrates").select("*").in("id", ids);
      setSaved(jelliesData ?? []);
    }
  }

  function handleTabChange(tab: GridTab) {
    setActiveTab(tab);
    if (tab === "rejellies") loadRejellies();
    if (tab === "saved") loadSaved();
  }

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
  const gridData = activeTab === "jellies" ? jellies : activeTab === "rejellies" ? rejellies : saved;

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="w-10" />
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a]">{username}</h1>
          <Link href="/profile/settings">
            <div className="w-10 h-10 flex items-center justify-center text-[#999]">
              <svg width="21" height="21" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </Link>
        </div>
        <ZigZag />
      </header>

      {/* Profile info */}
      <div className="bg-white px-4 pt-5 pb-0">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-[82px] h-[82px] rounded-full bg-[#ece8e3] overflow-hidden flex items-center justify-center font-black text-2xl text-[#999] flex-shrink-0"
            style={{ border: "3px solid white", boxShadow: "0 0 0 2px #e0dbd4" }}
          >
            {profile?.avatar_url
              ? <Image src={profile.avatar_url} alt="" width={82} height={82} className="object-cover" unoptimized />
              : username[0].toUpperCase()
            }
          </div>

          {/* Name + bio */}
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-[11px] font-bold text-[#bbb] uppercase tracking-widest">@{username}</p>
            <p className="font-black text-xl text-[#2a2a2a] uppercase tracking-tight leading-tight">
              {profile?.full_name || username}
            </p>
            {profile?.bio && (
              <p className="text-xs text-[#777] mt-1 leading-snug">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-0 mt-4">
          <div className="flex-1 flex flex-col items-center py-2.5 border-r border-[#e8e3dd]">
            <span className="text-xl font-black text-[#e8363a]">{stats.total}</span>
            <span className="text-[9px] font-black text-[#bbb] uppercase tracking-widest">JELLYS</span>
          </div>
          <Link href={username ? `/profile/${username}/followers` : "#"} className="flex-1 flex flex-col items-center py-2.5 border-r border-[#e8e3dd] active:bg-[#fafaf9] transition-colors">
            <span className="text-xl font-black text-[#e8363a]">{stats.followers}</span>
            <span className="text-[9px] font-black text-[#bbb] uppercase tracking-widest">SEGUIDORES</span>
          </Link>
          <Link href={username ? `/profile/${username}/following` : "#"} className="flex-1 flex flex-col items-center py-2.5 active:bg-[#fafaf9] transition-colors">
            <span className="text-xl font-black text-[#e8363a]">{stats.following}</span>
            <span className="text-[9px] font-black text-[#bbb] uppercase tracking-widest">SIGUIENDO</span>
          </Link>
        </div>

        {/* Edit button */}
        <div className="py-3 flex gap-2">
          <Link href="/profile/edit" className="flex-1">
            <div className="w-full py-2.5 rounded-xl border border-[#e0dbd4] text-xs font-black text-[#4a4a4a] uppercase tracking-widest text-center bg-[#f8f7f5] active:bg-[#f0ede8] transition-colors">
              Editar Perfil
            </div>
          </Link>
          <Link href="/explore">
            <div className="h-full px-4 py-2.5 rounded-xl border border-[#e0dbd4] text-xs font-black text-[#4a4a4a] bg-[#f8f7f5] flex items-center active:bg-[#f0ede8] transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* Grid tabs */}
      <div className="flex bg-white border-t border-[#e8e3dd] sticky top-[93px] z-30">
        <button
          onClick={() => handleTabChange("jellies")}
          className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${activeTab === "jellies" ? "border-[#e8363a]" : "border-transparent"}`}
        >
          <svg width="20" height="20" fill="none" stroke={activeTab === "jellies" ? "#e8363a" : "#bbb"} strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </button>
        <button
          onClick={() => handleTabChange("rejellies")}
          className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${activeTab === "rejellies" ? "border-[#e8363a]" : "border-transparent"}`}
        >
          <svg width="20" height="20" fill={activeTab === "rejellies" ? "#f59e0b" : "none"} stroke={activeTab === "rejellies" ? "#f59e0b" : "#bbb"} strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
        <button
          onClick={() => handleTabChange("saved")}
          className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${activeTab === "saved" ? "border-[#e8363a]" : "border-transparent"}`}
        >
          <svg width="20" height="20" fill={activeTab === "saved" ? "#e8363a" : "none"} stroke={activeTab === "saved" ? "#e8363a" : "#bbb"} strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </button>
      </div>

      <ZigZag />

      {/* Grid */}
      {gridData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="text-4xl">{activeTab === "saved" ? "🔖" : activeTab === "rejellies" ? "⚡" : "📸"}</span>
          <p className="text-[#999] text-xs font-black uppercase tracking-widest text-center px-6">
            {activeTab === "saved" ? "Nada guardado aún" : activeTab === "rejellies" ? "Sin ReJellies aún" : "Sin JellyRates aún"}
          </p>
          {activeTab === "jellies" && (
            <Link href="/create">
              <button className="px-6 py-3 rounded-2xl bg-[#e8363a] text-sm font-black text-white uppercase tracking-widest">
                Crear el primero
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-px bg-[#e8e3dd]">
          {gridData.map(jelly => <GridItem key={jelly.id} jelly={jelly} />)}
        </div>
      )}
    </div>
  );
}
