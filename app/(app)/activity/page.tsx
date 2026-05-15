"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ScoreColor } from "@/components/JellyCard";

interface Activity {
  id: string;
  type: "like" | "rejelly" | "follow" | "follow_request" | "comment";
  actor_username: string;
  actor_avatar: string | null;
  jelly_title?: string;
  jelly_score?: number;
  comment_text?: string;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function activityIcon(type: Activity["type"]) {
  switch (type) {
    case "like":
      return (
        <div className="w-8 h-8 rounded-full bg-[#fce7e7] flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" fill="#e8363a" viewBox="0 0 24 24">
            <path d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904" />
          </svg>
        </div>
      );
    case "rejelly":
      return (
        <div className="w-8 h-8 rounded-full bg-[#fef3cd] flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" fill="#f59e0b" viewBox="0 0 24 24">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
      );
    case "follow":
    case "follow_request":
      return (
        <div className="w-8 h-8 rounded-full bg-[#e0f5f3] flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" fill="none" stroke="#5bbcb3" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        </div>
      );
    case "comment":
      return (
        <div className="w-8 h-8 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" fill="none" stroke="#999" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
        </div>
      );
    default:
      return null;
  }
}

function activityText(activity: Activity) {
  const u = <span className="font-black text-[#5bbcb3] uppercase tracking-wide">{activity.actor_username}</span>;
  const jt = activity.jelly_title ? (
    <span className="text-[#e8363a] font-bold"> "{activity.jelly_title}"</span>
  ) : null;

  switch (activity.type) {
    case "like": return <>{u} le dio like a tu JellyRate{jt}</>;
    case "rejelly": return <>{u} hizo ReJelly ⚡{jt}</>;
    case "follow": return <>{u} comenzó a seguirte</>;
    case "follow_request": return <>{u} quiere seguirte</>;
    case "comment": return <>{u} comentó en{jt}: <span className="text-[#777] italic">"{activity.comment_text}"</span></>;
    default: return null;
  }
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Load likes on user's jellyrates
      const { data: likesData } = await supabase
        .from("likes")
        .select("created_at, user_id, jellyrate_id")
        .order("created_at", { ascending: false })
        .limit(30);

      const items: Activity[] = [];

      if (likesData && likesData.length > 0) {
        // Get all unique profile IDs
        const actorIds = [...new Set(likesData.map((l: any) => l.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", actorIds);

        const profileMap: Record<string, any> = {};
        profilesData?.forEach((p: any) => { profileMap[p.id] = p; });

        likesData.forEach((l: any) => {
          const profile = profileMap[l.user_id];
          if (profile) {
            items.push({
              id: `like-${l.created_at}-${l.user_id}`,
              type: "like",
              actor_username: profile.username,
              actor_avatar: profile.avatar_url,
              created_at: l.created_at,
            });
          }
        });
      }

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(items);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="px-4 py-3.5">
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a] text-center">ACTIVIDAD</h1>
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

      {loading ? (
        <div className="flex flex-col gap-0 pt-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f0ede8] bg-white animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[#ece8e3] flex-shrink-0" />
              <div className="w-8 h-8 rounded-full bg-[#f0ede8] flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-[#ece8e3] rounded w-3/4 mb-2" />
                <div className="h-2.5 bg-[#ece8e3] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white border border-[#e0dbd4] flex items-center justify-center">
            <span className="text-2xl">🔔</span>
          </div>
          <div className="text-center">
            <p className="font-black uppercase tracking-widest text-[#2a2a2a] text-sm">Sin actividad aún</p>
            <p className="text-xs text-[#999] mt-1">Aquí verás cuando alguien interactúe con tus JellyRates</p>
          </div>
        </div>
      ) : (
        <div className="bg-white">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start gap-3 px-4 py-4 border-b border-[#f0ede8]">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#ece8e3] flex-shrink-0 overflow-hidden flex items-center justify-center font-black text-sm text-[#999]">
                {activity.actor_avatar
                  ? <img src={activity.actor_avatar} alt="" className="w-full h-full object-cover" />
                  : activity.actor_username[0].toUpperCase()
                }
              </div>

              {/* Activity icon */}
              {activityIcon(activity.type)}

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#2a2a2a] leading-snug">
                  {activityText(activity)}
                </p>
                <p className="text-xs text-[#bbb] mt-0.5 uppercase font-bold tracking-wide">{timeAgo(activity.created_at)}</p>
              </div>

              {/* Score badge */}
              {activity.jelly_score != null && (
                <div
                  className="w-9 h-9 flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm"
                  style={{
                    backgroundColor: ScoreColor(activity.jelly_score),
                    borderTopRightRadius: 8,
                    borderBottomRightRadius: 8,
                  }}
                >
                  {activity.jelly_score}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
