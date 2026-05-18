"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Person {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  isFollowing: boolean;
}

export default function FollowingPage() {
  const router = useRouter();
  const { username } = useParams<{ username: string }>();
  const supabase = createClient();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user: _authUser } } = await supabase.auth.getUser();
      const uid = _authUser?.id ?? null;
      setCurrentUserId(uid);

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles").select("id").eq("username", username).single();
      if (!profileData) { setLoading(false); return; }

      // Get following (people this user follows)
      const { data: followRows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", profileData.id)
        .eq("status", "accepted");

      if (!followRows?.length) { setLoading(false); return; }

      const ids = followRows.map((r: any) => r.following_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", ids);

      // Check which ones current user follows
      const { data: myFollows } = uid
        ? await supabase.from("follows").select("following_id").eq("follower_id", uid).in("following_id", ids)
        : { data: [] };

      const followingSet = new Set((myFollows ?? []).map((f: any) => f.following_id));

      setPeople((profiles ?? []).map((p: any) => ({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        isFollowing: followingSet.has(p.id),
      })));
      setLoading(false);
    }
    load();
  }, [username]);

  async function toggleFollow(person: Person) {
    if (!currentUserId) return;
    if (person.isFollowing) {
      const { error } = await supabase.from("follows").delete()
        .match({ follower_id: currentUserId, following_id: person.id });
      if (!error) setPeople(prev => prev.map(p => p.id === person.id ? { ...p, isFollowing: false } : p));
    } else {
      const { error } = await supabase.from("follows")
        .upsert({ follower_id: currentUserId, following_id: person.id, status: "accepted" },
          { onConflict: "follower_id,following_id" });
      if (!error) setPeople(prev => prev.map(p => p.id === person.id ? { ...p, isFollowing: true } : p));
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f1ed]">
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center px-4 py-3.5 gap-3">
          <button onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8363a]">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-[#2a2a2a]">Siguiendo</h1>
            <p className="text-xs text-[#aaa]">@{username}</p>
          </div>
        </div>
        <div className="h-2" style={{
          backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(315deg, #e8e3dd 25%, transparent 25%), linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
          backgroundSize: "16px 16px", backgroundColor: "#f2f1ed",
        }} />
      </header>

      <div className="bg-white">
        {loading ? (
          <div className="flex flex-col">
            {[1,2,3,4,5].map(i => (
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
              <svg width="24" height="24" fill="none" stroke="#ccc" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-[#999]">No sigue a nadie aún</p>
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
    </div>
  );
}
