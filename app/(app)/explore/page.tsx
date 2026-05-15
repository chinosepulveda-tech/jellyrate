"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { JellyRate } from "@/lib/types";
import { ScoreColor } from "@/components/JellyCard";

type ExploreTab = "posts" | "people";

interface Person {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  followers: number;
  isFollowing: boolean;
}

const CATEGORIES = [
  { emoji: "🔥", label: "Hot" },
  { emoji: "🍽️", label: "Comida" },
  { emoji: "🎬", label: "Película" },
  { emoji: "📍", label: "Lugar" },
  { emoji: "🍷", label: "Bebida" },
  { emoji: "🎵", label: "Música" },
  { emoji: "📦", label: "Producto" },
  { emoji: "📚", label: "Libro" },
  { emoji: "✈️", label: "Viaje" },
  { emoji: "🎮", label: "Juego" },
];

const ZigZag = () => (
  <div className="h-2" style={{
    backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(315deg, #e8e3dd 25%, transparent 25%), linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
    backgroundSize: "16px 16px",
    backgroundColor: "#f2f1ed",
  }} />
);

export default function ExplorePage() {
  const supabase = createClient();
  const [tab, setTab] = useState<ExploreTab>("posts");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Hot");
  const [posts, setPosts] = useState<JellyRate[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id ?? null);
      loadPosts("Hot", "");
    }
    init();
  }, []);

  const loadPosts = useCallback(async (category: string, q: string) => {
    setLoadingPosts(true);
    let query2 = supabase
      .from("jellyrates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);

    if (q.trim()) {
      query2 = query2.ilike("title", `%${q.trim()}%`);
    } else if (category !== "Hot") {
      query2 = query2.ilike("category", `%${category}%`);
    }

    const { data } = await query2;
    setPosts(data ?? []);
    setLoadingPosts(false);
  }, []);

  const loadPeople = useCallback(async (q: string) => {
    if (!q.trim() && people.length > 0) return;
    setLoadingPeople(true);

    let query2 = supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .limit(30);

    if (q.trim()) {
      query2 = query2.or(`username.ilike.%${q.trim()}%,full_name.ilike.%${q.trim()}%`);
    } else {
      query2 = query2.order("created_at", { ascending: false });
    }

    const { data: profilesData } = await query2;
    if (!profilesData?.length) { setPeople([]); setLoadingPeople(false); return; }

    // Get follower counts
    const ids = profilesData.map((p: any) => p.id);
    const { data: followData } = currentUserId
      ? await supabase.from("follows").select("following_id").eq("follower_id", currentUserId).in("following_id", ids)
      : { data: [] };

    const followingSet = new Set((followData ?? []).map((f: any) => f.following_id));

    setPeople(profilesData.map((p: any) => ({
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      followers: 0,
      isFollowing: followingSet.has(p.id),
    })));
    setLoadingPeople(false);
  }, [currentUserId, people.length]);

  function handleSearch(q: string) {
    setQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (tab === "posts") loadPosts(activeCategory, q);
      else loadPeople(q);
    }, 300);
  }

  function handleCategorySelect(cat: string) {
    setActiveCategory(cat);
    setQuery("");
    loadPosts(cat, "");
  }

  function handleTabChange(t: ExploreTab) {
    setTab(t);
    setQuery("");
    if (t === "people" && people.length === 0) loadPeople("");
  }

  async function toggleFollow(person: Person) {
    if (!currentUserId) return;
    if (person.isFollowing) {
      await supabase.from("follows").delete().match({ follower_id: currentUserId, following_id: person.id });
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: person.id, status: "accepted" });
    }
    setPeople(prev => prev.map(p =>
      p.id === person.id ? { ...p, isFollowing: !p.isFollowing } : p
    ));
  }

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="px-4 pt-3.5 pb-2">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => handleTabChange("posts")}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                tab === "posts" ? "bg-[#e8363a] text-white" : "bg-[#f0ede8] text-[#999]"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => handleTabChange("people")}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                tab === "people" ? "bg-[#e8363a] text-white" : "bg-[#f0ede8] text-[#999]"
              }`}
            >
              Personas
            </button>
          </div>

          {/* Search field */}
          <div className="flex items-center bg-[#f5f2ee] border border-[#e8e3dd] rounded-xl px-3 py-2.5 gap-2 focus-within:border-[#e8363a] transition-colors">
            <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder={tab === "people" ? "Buscar personas..." : "Buscar rates, lugares..."}
              className="flex-1 text-sm text-[#2a2a2a] placeholder:text-[#ccc] bg-transparent outline-none"
            />
            {query.length > 0 && (
              <button onClick={() => { setQuery(""); if (tab === "posts") loadPosts(activeCategory, ""); }}>
                <svg width="14" height="14" fill="none" stroke="#bbb" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category chips — only on posts tab */}
        {tab === "posts" && !query && (
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-2 px-4 pb-3 w-max">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => handleCategorySelect(cat.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-colors ${
                    activeCategory === cat.label
                      ? "bg-[#e8363a] text-white"
                      : "bg-[#f0ede8] text-[#777]"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="uppercase tracking-wide">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <ZigZag />
      </header>

      {/* ── POSTS grid ── */}
      {tab === "posts" && (
        <>
          {!query && (
            <div className="px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-[#bbb]">
                {activeCategory === "Hot" ? "🔥 Lo más nuevo" : `${CATEGORIES.find(c => c.label === activeCategory)?.emoji ?? ""} ${activeCategory}`}
              </p>
            </div>
          )}

          {loadingPosts ? (
            <div className="grid grid-cols-3 gap-px bg-[#e8e3dd] px-px">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square bg-[#f0ede8] animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-4xl">🔍</span>
              <p className="text-xs font-black uppercase tracking-widest text-[#999]">Sin resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-px bg-[#e8e3dd]">
              {posts.map(jelly => (
                <Link key={jelly.id} href={`/jelly/${jelly.id}`}>
                  <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
                    {jelly.photo_url ? (
                      <Image src={jelly.photo_url} alt={jelly.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#ccc] p-1 text-center">
                        {jelly.title}
                      </div>
                    )}
                    <div
                      className="absolute bottom-0 left-0 w-8 h-8 flex items-center justify-center text-xs font-black text-white"
                      style={{ backgroundColor: ScoreColor(jelly.score), borderTopRightRadius: 8, borderBottomRightRadius: 8 }}
                    >
                      {jelly.score}
                    </div>
                    {jelly.likes_count > 0 && (
                      <div className="absolute top-1 right-1 bg-black/50 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                        <svg width="9" height="9" fill="#ff6b6b" viewBox="0 0 24 24">
                          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        <span className="text-[9px] font-bold text-white">{jelly.likes_count}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── PEOPLE list ── */}
      {tab === "people" && (
        <div className="bg-white">
          {loadingPeople ? (
            <div className="flex flex-col">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f5f2ee] animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-[#ece8e3]" />
                  <div className="flex-1">
                    <div className="h-3 bg-[#ece8e3] rounded w-24 mb-2" />
                    <div className="h-2.5 bg-[#ece8e3] rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : people.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-4xl">👤</span>
              <p className="text-xs font-black uppercase tracking-widest text-[#999]">Sin personas</p>
            </div>
          ) : (
            people.map(person => (
              <div key={person.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f5f2ee]">
                <Link href={`/profile/${person.username}`}>
                  <div className="w-12 h-12 rounded-full bg-[#ece8e3] overflow-hidden flex items-center justify-center font-black text-base text-[#aaa] flex-shrink-0">
                    {person.avatar_url
                      ? <Image src={person.avatar_url} alt="" width={48} height={48} className="object-cover" unoptimized />
                      : person.username[0].toUpperCase()
                    }
                  </div>
                </Link>
                <Link href={`/profile/${person.username}`} className="flex-1 min-w-0">
                  <p className="font-black text-sm text-[#5bbcb3] uppercase tracking-wide">{person.username}</p>
                  {person.full_name && (
                    <p className="text-xs text-[#999] truncate">{person.full_name}</p>
                  )}
                </Link>
                {currentUserId && currentUserId !== person.id && (
                  <button
                    onClick={() => toggleFollow(person)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${
                      person.isFollowing
                        ? "bg-[#f0ede8] border border-[#e0dbd4] text-[#777]"
                        : "bg-[#e8363a] text-white"
                    }`}
                  >
                    {person.isFollowing ? "Siguiendo" : "Seguir"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
