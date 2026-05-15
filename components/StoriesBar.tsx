"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface StoryUser {
  username: string;
  avatar_url: string | null;
  hasNew: boolean;
}

interface Props {
  currentUserId?: string;
  myUsername?: string;
  myAvatar?: string | null;
}

export default function StoriesBar({ currentUserId, myUsername, myAvatar }: Props) {
  const supabase = createClient();
  const [users, setUsers] = useState<StoryUser[]>([]);

  useEffect(() => {
    async function load() {
      if (!currentUserId) return;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: recentJellies } = await supabase
        .from("jellyrates")
        .select("user_id")
        .gte("created_at", since)
        .neq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!recentJellies?.length) return;

      const userIds = [...new Set(recentJellies.map((j: any) => j.user_id))].slice(0, 15);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesData) {
        const ordered = userIds
          .map(id => profilesData.find((p: any) => p.id === id))
          .filter(Boolean)
          .map((p: any) => ({ username: p.username, avatar_url: p.avatar_url, hasNew: true }));
        setUsers(ordered);
      }
    }
    load();
  }, [currentUserId]);

  return (
    <div className="bg-white border-b border-[#ede9e3] overflow-x-auto scrollbar-none">
      <div className="flex gap-0 px-3 py-3 w-max">
        {/* My "create" bubble */}
        <Link href="/create" className="flex flex-col items-center gap-1 px-2.5">
          <div className="relative">
            <div className="w-[60px] h-[60px] rounded-full border-2 border-[#ede9e3] overflow-hidden flex items-center justify-center bg-[#f5f2ee]">
              {myAvatar ? (
                <Image src={myAvatar} alt="" width={60} height={60} className="object-cover" />
              ) : (
                <span className="font-black text-xl text-[#ccc]">
                  {myUsername?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            {/* + badge */}
            <div className="absolute bottom-0 right-0 w-[20px] h-[20px] bg-[#e8363a] rounded-full border-[2px] border-white flex items-center justify-center">
              <svg width="9" height="9" fill="none" stroke="white" strokeWidth={2.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          </div>
          <span className="text-[10px] font-black text-[#bbb] uppercase tracking-wide">Tu Rate</span>
        </Link>

        {/* Other users */}
        {users.map(user => (
          <Link key={user.username} href={`/profile/${user.username}`} className="flex flex-col items-center gap-1 px-2.5">
            <div
              className="w-[60px] h-[60px] rounded-full p-[2.5px]"
              style={{
                background: user.hasNew
                  ? "linear-gradient(135deg, #e8363a 0%, #f59e0b 50%, #5bbcb3 100%)"
                  : "#e0dbd4",
              }}
            >
              <div className="w-full h-full rounded-full bg-white p-[2px] overflow-hidden">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#f0ede8] flex items-center justify-center">
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt="" width={52} height={52} className="object-cover" />
                  ) : (
                    <span className="font-black text-[#aaa] text-base">
                      {user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-[#777] uppercase tracking-wide truncate max-w-[60px] text-center">
              {user.username}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
