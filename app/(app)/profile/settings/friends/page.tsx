"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ZigzagBorder() {
  return (
    <div className="h-2" style={{
      backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0,
        linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0,
        linear-gradient(315deg, #e8e3dd 25%, transparent 25%),
        linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
      backgroundSize: '16px 16px',
      backgroundColor: '#f2f1ed',
    }} />
  );
}

interface UserResult {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_following?: boolean;
}

export default function FindFriendsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const { data: { user: _authUser } } = await supabase.auth.getUser();
      if (!_authUser) return;
      setUserId(_authUser?.id);

      const { data: followData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", _authUser?.id);

      setFollowingIds(new Set(followData?.map(f => f.following_id) ?? []));

      // Load suggested users
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .neq("id", _authUser?.id)
        .limit(20);

      setResults(data ?? []);
    }
    load();
  }, []);

  async function handleSearch(q: string) {
    setSearch(q);
    if (!q.trim()) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .ilike("username", `%${q}%`)
      .neq("id", userId)
      .limit(20);

    setResults(data ?? []);
  }

  async function toggleFollow(targetId: string) {
    if (!userId) return;
    if (followingIds.has(targetId)) {
      await supabase.from("follows").delete().match({ follower_id: userId, following_id: targetId });
      setFollowingIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from("follows").insert({ follower_id: userId, following_id: targetId, status: "accepted" });
      setFollowingIds(prev => new Set([...prev, targetId]));
    }
  }

  const tiles = [
    { color: "#4267B2", label: "DESDE\nFACEBOOK" },
    { color: "#5bbcb3", label: "DESDE\nCONTACTOS" },
    { color: "#d6d2cc", label: "INVITAR\nAMIGOS" },
  ];

  return (
    <div className="min-h-screen bg-[#f2f1ed]">
      <header className="sticky top-0 safe-header z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center px-4 py-3.5 gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8363a]">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a] flex-1 text-center mr-10">
            BUSCAR AMIGOS
          </h1>
        </div>
        <ZigzagBorder />
      </header>

      <div className="px-4 pt-4">
        {/* Import tiles */}
        <div className="flex gap-2 mb-4">
          {tiles.map(t => (
            <button key={t.label} className="flex-1 aspect-[3/2] rounded-xl flex items-end p-2 active:opacity-80 transition-opacity" style={{ backgroundColor: t.color }}>
              <span className="text-xs font-black text-white whitespace-pre-line uppercase tracking-wide leading-tight text-left">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Search field */}
        <div className="flex items-center bg-white border border-[#e0dbd4] rounded-xl px-4 py-3 gap-2 mb-4 focus-within:border-[#e8363a] transition-colors">
          <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por usuario..."
            className="flex-1 text-sm text-[#2a2a2a] placeholder:text-[#ccc]"
          />
        </div>

        {/* Suggested header */}
        {!search && (
          <p className="text-xs font-black text-[#bbb] uppercase tracking-widest text-center mb-3">SUGERIDOS</p>
        )}

        {/* User list */}
        <div className="flex flex-col gap-0">
          {results.map(user => (
            <div key={user.id} className="flex items-center gap-3 py-3 border-b border-[#f0ede8]">
              <div className="w-10 h-10 rounded-full bg-[#ece8e3] overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-sm text-[#999]">
                {user.avatar_url
                  ? <Image src={user.avatar_url} alt="" width={40} height={40} className="object-cover" />
                  : user.username[0].toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase tracking-wide text-[#5bbcb3]">{user.username}</p>
                {user.full_name && <p className="text-xs text-[#999] italic">{user.full_name}</p>}
              </div>
              <button
                onClick={() => toggleFollow(user.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border transition-colors ${
                  followingIds.has(user.id)
                    ? "bg-[#f5f5f5] border-[#e0dbd4] text-[#999]"
                    : "bg-[#d6d2cc] border-[#d6d2cc] text-white"
                }`}
              >
                {followingIds.has(user.id) ? "Siguiendo" : "Seguir"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
