"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Hot: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>,
  Comida: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5M6 10.608v8.15c0 1.028.835 1.862 1.862 1.862h8.276c1.027 0 1.862-.834 1.862-1.862v-8.15M6 10.608h12" /></svg>,
  Película: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-14.25m0 14.25h1.5m0 0h14.25M3.375 5.25A1.125 1.125 0 012.25 6.375v11.25c0 .621.504 1.125 1.125 1.125M21 5.25h-1.5c-.621 0-1.125.504-1.125 1.125m2.625-1.125A1.125 1.125 0 0121.75 6.375v11.25a1.125 1.125 0 01-1.125 1.125M21 5.25v14.25m0-14.25h-1.5m0 0H6m14.25 0H6m0-1.125c0 .621-.504 1.125-1.125 1.125m7.5-7.5A2.25 2.25 0 0110.5 6v.75m3-3.75a2.25 2.25 0 00-4.5 0v.75M12 12a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" /></svg>,
  Lugar: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  Bebida: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.769 0-5.536-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>,
  Música: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /></svg>,
  Producto: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
  Libro: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  Viaje: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>,
  Juego: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" /></svg>,
  Servicio: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>,
};

const CATEGORIES = ["Hot","Comida","Película","Lugar","Bebida","Música","Producto","Libro","Viaje","Juego"];

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
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? "bg-[#e8363a] text-white"
                      : "bg-[#f0ede8] text-[#777]"
                  }`}
                >
                  {CATEGORY_ICONS[cat]}
                  <span className="uppercase tracking-wide">{cat}</span>
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
                {activeCategory === "Hot" ? "Lo más nuevo" : activeCategory}
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
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#e0dbd4] flex items-center justify-center">
                <svg width="26" height="26" fill="none" stroke="#ccc" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                </svg>
              </div>
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
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#e0dbd4] flex items-center justify-center">
                <svg width="26" height="26" fill="none" stroke="#ccc" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
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
