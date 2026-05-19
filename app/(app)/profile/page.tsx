"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, JellyRate } from "@/lib/types";
import { ScoreColor } from "@/components/JellyCard";

type GridTab = "jellies" | "rejellies" | "saved";

function InviteButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  function handleInvite() {
    const url = `${window.location.origin}/join/${username}`;
    if (navigator.share) {
      navigator.share({ title: "JellyRate", text: `Únete a JellyRate y ve mis ratings`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }
  return (
    <button
      onClick={handleInvite}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-[#e8363a] active:opacity-80 transition-opacity"
    >
      {copied
        ? <svg width="13" height="13" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        : <svg width="13" height="13" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
      }
      <span className="text-xs font-black text-white uppercase tracking-widest">
        {copied ? "¡Link!" : "Invitar"}
      </span>
    </button>
  );
}

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
          className="absolute top-0 left-0 w-9 h-9 flex items-center justify-center text-xs font-black text-white"
          style={{ backgroundColor: "#e8363a", borderBottomRightRadius: 8 }}
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
      const { data: { user: _authUser } } = await supabase.auth.getUser();
      const user = _authUser;
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
    const { data: rdata } = await supabase.from("rejellies").select("jellyrate_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
    if (rdata?.length) {
      const { data: jd } = await supabase.from("jellyrates").select("*").in("id", rdata.map((r: any) => r.jellyrate_id));
      setRejellies(jd ?? []);
    }
  }

  async function loadSaved() {
    if (!userId || saved.length > 0) return;
    const { data: sdata } = await supabase.from("saves").select("jellyrate_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
    if (sdata?.length) {
      const { data: jd } = await supabase.from("jellyrates").select("*").in("id", sdata.map((s: any) => s.jellyrate_id));
      setSaved(jd ?? []);
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
        <div className="h-12 bg-white" />
        <div className="bg-white px-4 pt-6 pb-4 flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-[#ece8e3]" />
          <div className="h-4 bg-[#ece8e3] rounded w-32" />
          <div className="h-3 bg-[#ece8e3] rounded w-20" />
          <div className="h-9 bg-[#ece8e3] rounded-2xl w-40" />
        </div>
      </div>
    );
  }

  const username = profile?.username ?? "usuario";
  const gridData = activeTab === "jellies" ? jellies : activeTab === "rejellies" ? rejellies : saved;
  const isPrivate = profile?.is_private ?? false;

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 safe-header z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-10" />
          <h1 className="font-black text-sm uppercase tracking-widest text-[#2a2a2a]">{username}</h1>
          <Link href="/profile/settings">
            <div className="w-10 h-10 flex items-center justify-center text-[#999] active:text-[#666]">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </Link>
        </div>
      </header>

      {/* ── Profile Card ── */}
      <div className="bg-white px-4 pt-6 pb-0">
        {/* Avatar — centered */}
        <div className="flex flex-col items-center">
          <div
            className="w-24 h-24 rounded-full bg-[#ece8e3] overflow-hidden flex items-center justify-center font-black text-3xl text-[#999]"
            style={{ boxShadow: "0 0 0 3px white, 0 0 0 5px #e8b96a" }}
          >
            {profile?.avatar_url
              ? <Image src={profile.avatar_url} alt="" width={96} height={96} className="object-cover" unoptimized />
              : username[0].toUpperCase()
            }
          </div>

          {/* Name + username */}
          <h2 className="mt-3 text-xl font-black text-[#2a2a2a] text-center leading-tight">
            {profile?.full_name || username}
          </h2>
          <p className="text-sm font-semibold text-[#5bbcb3] mt-0.5">@{username}</p>
          {profile?.bio && (
            <p className="text-xs text-[#777] mt-2 text-center leading-snug max-w-[260px]">{profile.bio}</p>
          )}

          {/* Edit + Invite buttons */}
          <div className="mt-4 w-full flex gap-2 max-w-[280px]">
            <Link href="/profile/edit" className="flex-1">
              <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-[#e0dbd4] bg-white active:bg-[#f5f2ee] transition-colors">
                <svg width="13" height="13" fill="none" stroke="#4a4a4a" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                <span className="text-xs font-black text-[#4a4a4a] uppercase tracking-widest">Editar</span>
              </div>
            </Link>
            <InviteButton username={username} /></div>
        </div>

        {/* Stats row */}
        <div className="flex mt-5 border-t border-[#f0ede8]">
          <div className="flex-1 flex flex-col items-center py-3">
            <span className="text-xl font-black text-[#e8363a]">{stats.total}</span>
            <span className="text-[9px] font-black text-[#bbb] uppercase tracking-widest mt-0.5">JELLYRATES</span>
          </div>
          <Link href={`/profile/${username}/followers`} className="flex-1 flex flex-col items-center py-3 border-x border-[#f0ede8] active:bg-[#fafaf9]">
            <span className="text-xl font-black text-[#e8363a]">{stats.followers}</span>
            <span className="text-[9px] font-black text-[#bbb] uppercase tracking-widest mt-0.5">SEGUIDORES</span>
          </Link>
          <Link href={`/profile/${username}/following`} className="flex-1 flex flex-col items-center py-3 active:bg-[#fafaf9]">
            <span className="text-xl font-black text-[#e8363a]">{stats.following}</span>
            <span className="text-[9px] font-black text-[#bbb] uppercase tracking-widest mt-0.5">SIGUIENDO</span>
          </Link>
        </div>

      </div>

      {/* ── Grid tabs ── */}
      <div className="flex bg-white border-t border-[#e8e3dd] sticky top-[52px] z-30">
        <button onClick={() => handleTabChange("jellies")}
          className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${activeTab === "jellies" ? "border-[#e8363a]" : "border-transparent"}`}>
          <svg width="20" height="20" fill="none" stroke={activeTab === "jellies" ? "#e8363a" : "#bbb"} strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </button>
        <button onClick={() => handleTabChange("rejellies")}
          className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${activeTab === "rejellies" ? "border-[#e8363a]" : "border-transparent"}`}>
          <svg width="20" height="20" fill={activeTab === "rejellies" ? "#f59e0b" : "none"} stroke={activeTab === "rejellies" ? "#f59e0b" : "#bbb"} strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
        <button onClick={() => handleTabChange("saved")}
          className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${activeTab === "saved" ? "border-[#e8363a]" : "border-transparent"}`}>
          <svg width="20" height="20" fill={activeTab === "saved" ? "#e8363a" : "none"} stroke={activeTab === "saved" ? "#e8363a" : "#bbb"} strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </button>
      </div>

      <ZigZag />

      {/* ── Grid ── */}
      {gridData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#e0dbd4] flex items-center justify-center">
          {activeTab === "saved" ? (
            <svg width="24" height="24" fill="none" stroke="#ccc" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
          ) : activeTab === "rejellies" ? (
            <svg width="24" height="24" fill="none" stroke="#ccc" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="#ccc" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
          )}
        </div>
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
