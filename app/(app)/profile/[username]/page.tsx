"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, JellyRate } from "@/lib/types";
import { ScoreColor } from "@/components/JellyCard";

type GridTab = "jellies" | "rejellies";

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
          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#ccc] p-2 text-center">
            {jelly.title}
          </div>
        )}
        <div
          className="absolute top-0 left-0 w-9 h-9 flex items-center justify-center text-xs font-black text-white"
          style={{ backgroundColor: "#e8363a", borderBottomRightRadius: 8 }}
        >
          {jelly.score}
        </div>
      </div>
    </Link>
  );
}

export default function UserProfilePage() {
  const router = useRouter();
  const { username } = useParams<{ username: string }>();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jellies, setJellies] = useState<JellyRate[]>([]);
  const [rejellies, setRejellies] = useState<JellyRate[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSelf, setIsSelf] = useState(false);
  const [activeTab, setActiveTab] = useState<GridTab>("jellies");

  useEffect(() => {
    async function load() {
      const { data: { user: _authUser } } = await supabase.auth.getUser();
      const currentId = _authUser?.id ?? null;
      setCurrentUserId(currentId);

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("username", username).single();

      if (!profileData) { router.push("/feed"); return; }
      setProfile(profileData);
      setIsSelf(currentId === profileData.id);

      const [{ data: jelliesData }, { count: followers }, { count: following }] = await Promise.all([
        supabase.from("jellyrates").select("*").eq("user_id", profileData.id).order("created_at", { ascending: false }),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileData.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileData.id),
      ]);

      setJellies(jelliesData ?? []);
      setStats({ followers: followers ?? 0, following: following ?? 0, total: jelliesData?.length ?? 0 });

      if (currentId && currentId !== profileData.id) {
        const { data: followData } = await supabase
          .from("follows").select("follower_id")
          .eq("follower_id", currentId).eq("following_id", profileData.id).single();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    }
    load();
  }, [username]);

  async function loadRejellies() {
    if (!profile || rejellies.length > 0) return;
    const { data: rdata } = await supabase
      .from("rejellies").select("jellyrate_id").eq("user_id", profile.id)
      .order("created_at", { ascending: false }).limit(30);

    if (rdata?.length) {
      const ids = rdata.map((r: any) => r.jellyrate_id);
      const { data: jdata } = await supabase.from("jellyrates").select("*").in("id", ids);
      setRejellies(jdata ?? []);
    }
  }

  function handleTabChange(tab: GridTab) {
    setActiveTab(tab);
    if (tab === "rejellies") loadRejellies();
  }

  async function toggleFollow() {
    if (!currentUserId || !profile || isSelf || followLoading) return;
    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows").delete()
        .match({ follower_id: currentUserId, following_id: profile.id });
      if (!error) {
        setIsFollowing(false);
        setStats(s => ({ ...s, followers: Math.max(0, s.followers - 1) }));
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .upsert({ follower_id: currentUserId, following_id: profile.id, status: "accepted" },
          { onConflict: "follower_id,following_id" });
      if (!error) {
        setIsFollowing(true);
        setStats(s => ({ ...s, followers: s.followers + 1 }));
      }
    }

    setFollowLoading(false);
  }

  async function startDM() {
    if (!currentUserId || !profile) return;

    const { data, error } = await supabase.rpc("create_or_get_dm", {
      target_user_id: profile.id,
    });

    if (error || !data) {
      console.error("startDM error", error);
      return;
    }

    router.push(`/messages/${data}`);
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

  if (!profile) return null;

  const gridData = activeTab === "jellies" ? jellies : rejellies;

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 safe-header z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center px-4 py-3.5 gap-3">
          <button onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8363a]">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a] flex-1 text-center mr-10">
            {profile.username}
          </h1>
        </div>
        <ZigZag />
      </header>

      {/* ── Profile Card ── */}
      <div className="bg-white px-4 pt-6 pb-0">
        <div className="flex flex-col items-center">
          {/* Avatar centered */}
          <div
            className="w-24 h-24 rounded-full bg-[#ece8e3] overflow-hidden flex items-center justify-center font-black text-3xl text-[#999]"
            style={{ boxShadow: "0 0 0 3px white, 0 0 0 5px #e8b96a" }}
          >
            {profile.avatar_url
              ? <Image src={profile.avatar_url} alt="" width={96} height={96} className="object-cover" unoptimized />
              : (profile.username[0] ?? "?").toUpperCase()
            }
          </div>

          {/* Name + username centered */}
          <h2 className="mt-3 text-xl font-black text-[#2a2a2a] text-center leading-tight">
            {profile.full_name || profile.username}
          </h2>
          <p className="text-sm font-semibold text-[#5bbcb3] mt-0.5">@{profile.username}</p>
          {profile.bio && (
            <p className="text-xs text-[#777] mt-2 text-center leading-snug max-w-[260px]">{profile.bio}</p>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-2 w-full max-w-[280px]">
            {isSelf ? (
              <Link href="/profile/edit" className="flex-1">
                <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-[#e0dbd4] bg-white active:bg-[#f5f2ee]">
                  <svg width="14" height="14" fill="none" stroke="#4a4a4a" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span className="text-xs font-black text-[#4a4a4a] uppercase tracking-widest">Editar perfil</span>
                </div>
              </Link>
            ) : (
              <>
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    isFollowing ? "bg-[#f0ede8] border border-[#e0dbd4] text-[#4a4a4a]" : "bg-[#e8363a] text-white"
                  } ${followLoading ? "opacity-60" : ""}`}
                >
                  {followLoading ? "..." : isFollowing ? "✓ Siguiendo" : "Seguir"}
                </button>
                {isFollowing && (
                  <button
                    onClick={startDM}
                    className="px-4 py-2.5 rounded-2xl border border-[#e0dbd4] text-xs font-black text-[#4a4a4a] bg-white uppercase tracking-wide active:bg-[#f5f2ee]"
                  >
                    Mensaje
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mt-5 px-1">
          <div className="flex-1 flex flex-col items-center py-2.5 rounded-xl bg-[#fff0f0]">
            <span className="text-xl font-black text-[#e8363a] leading-tight">{stats.total}</span>
            <span className="text-[9px] font-black text-[#e8363a]/70 uppercase tracking-widest mt-0.5">JELLYRATES</span>
          </div>
          <Link href={`/profile/${username}/followers`} className="flex-1 flex flex-col items-center py-2.5 rounded-xl bg-[#f5f2ee] active:bg-[#ede9e3]">
            <span className="text-xl font-black text-[#2a2a2a] leading-tight">{stats.followers}</span>
            <span className="text-[9px] font-black text-[#bbb] uppercase tracking-widest mt-0.5">SEGUIDORES</span>
          </Link>
          <Link href={`/profile/${username}/following`} className="flex-1 flex flex-col items-center py-2.5 rounded-xl bg-[#f5f2ee] active:bg-[#ede9e3]">
            <span className="text-xl font-black text-[#2a2a2a] leading-tight">{stats.following}</span>
            <span className="text-[9px] font-black text-[#bbb] uppercase tracking-widest mt-0.5">SIGUIENDO</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-t border-[#e8e3dd] sticky top-[52px] z-30">
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
      </div>
      <ZigZag />

      {/* Grid */}
      {gridData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#e0dbd4] flex items-center justify-center">
            {activeTab === "rejellies" ? (
              <svg width="24" height="24" fill="none" stroke="#ccc" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="#ccc" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
            )}
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-[#999]">
            {activeTab === "rejellies" ? "Sin ReJellies aún" : "Sin JellyRates aún"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-px bg-[#e8e3dd]">
          {gridData.map(jelly => <GridItem key={jelly.id} jelly={jelly} />)}
        </div>
      )}
    </div>
  );
}
