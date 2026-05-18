"use client";

import { useEffect, useState, type ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  type: "like" | "comment" | "rejelly" | "follow" | "follow_request" | "follow_accepted";
  actor_id: string;
  actor_username: string;
  actor_avatar: string | null;
  jellyrate_id?: string;
  jelly_title?: string;
  jelly_score?: number;
  jelly_photo?: string;
  comment_text?: string;
  read: boolean;
  created_at: string;
}

type FilterTab = "all" | "likes" | "comments" | "rejellies" | "follows";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

function groupByTime(items: Notification[]) {
  const today: Notification[] = [];
  const week: Notification[] = [];
  const older: Notification[] = [];
  const now = Date.now();

  items.forEach(item => {
    const diff = now - new Date(item.created_at).getTime();
    const hours = diff / 3600000;
    if (hours < 24) today.push(item);
    else if (hours < 24 * 7) week.push(item);
    else older.push(item);
  });
  return { today, week, older };
}

function NotifIcon({ type }: { type: Notification["type"] }) {
  const icons: Record<string, { bg: string; content: ReactElement }> = {
    like: {
      bg: "#fce7e7",
      content: (
        <svg width="15" height="15" fill="#e8363a" viewBox="0 0 24 24">
          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
    comment: {
      bg: "#f0ede8",
      content: (
        <svg width="15" height="15" fill="none" stroke="#777" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
        </svg>
      ),
    },
    rejelly: {
      bg: "#fef3cd",
      content: (
        <svg width="15" height="15" fill="#f59e0b" viewBox="0 0 24 24">
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
    },
    follow: {
      bg: "#e0f5f3",
      content: (
        <svg width="15" height="15" fill="none" stroke="#5bbcb3" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
    },
    follow_accepted: {
      bg: "#e0f5f3",
      content: (
        <svg width="15" height="15" fill="none" stroke="#5bbcb3" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    follow_request: {
      bg: "#e0f5f3",
      content: (
        <svg width="15" height="15" fill="none" stroke="#5bbcb3" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  };

  const cfg = icons[type] ?? icons.like;
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
      {cfg.content}
    </div>
  );
}

function notifText(n: Notification) {
  const u = <Link href={`/profile/${n.actor_username}`}><span className="font-black text-[#5bbcb3]">{n.actor_username}</span></Link>;
  const jt = n.jelly_title ? <span className="font-semibold text-[#e8363a]"> "{n.jelly_title}"</span> : null;
  switch (n.type) {
    case "like": return <>{u} le dio like a tu JellyRate{jt}</>;
    case "comment": return <>{u} comentó en{jt}: <span className="text-[#777] italic">"{n.comment_text}"</span></>;
    case "rejelly": return <>{u} hizo ReJelly{jt}</>;
    case "follow": return <>{u} comenzó a seguirte</>;
    case "follow_request": return <>{u} quiere seguirte</>;
    case "follow_accepted": return <>{u} aceptó tu solicitud</>;
    default: return <>{u} interactuó contigo</>;
  }
}

function TabIcon({ type, active }: { type: FilterTab; active: boolean }) {
  const c = active ? "white" : "#999";
  if (type === "all") return <span className="text-xs font-black uppercase tracking-widest">Todo</span>;
  if (type === "likes") return (
    <svg width="14" height="14" fill={active ? "white" : "none"} stroke={c} strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
  if (type === "comments") return (
    <svg width="14" height="14" fill="none" stroke={c} strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
    </svg>
  );
  if (type === "rejellies") return (
    <svg width="14" height="14" fill={active ? "white" : "none"} stroke={c} strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
  if (type === "follows") return (
    <svg width="14" height="14" fill="none" stroke={c} strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
  return null;
}

const filterTabs: { key: FilterTab; types: string[] }[] = [
  { key: "all", types: [] },
  { key: "likes", types: ["like"] },
  { key: "comments", types: ["comment"] },
  { key: "rejellies", types: ["rejelly"] },
  { key: "follows", types: ["follow", "follow_request", "follow_accepted"] },
];

export default function ActivityPage() {
  const supabase = createClient();
  const [allNotifs, setAllNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user: _authUser } } = await supabase.auth.getUser();
      const uid = _authUser?.id;
      if (!uid) return;
      setUserId(uid);

      // Try notifications table first (new schema)
      const { data: notifData, error } = await supabase
        .from("notifications")
        .select("id, type, actor_id, jellyrate_id, comment_id, read, created_at")
        .eq("recipient_id", uid)
        .order("created_at", { ascending: false })
        .limit(60);

      if (!error && notifData && notifData.length > 0) {
        // Enrich with actor profiles
        const actorIds = [...new Set(notifData.map((n: any) => n.actor_id))];
        const { data: actors } = await supabase
          .from("profiles").select("id, username, avatar_url").in("id", actorIds);
        const actorMap: Record<string, any> = {};
        actors?.forEach((a: any) => { actorMap[a.id] = a; });

        // Enrich with jellyrate data
        const jellyIds = [...new Set(notifData.filter((n: any) => n.jellyrate_id).map((n: any) => n.jellyrate_id))];
        let jellyMap: Record<string, any> = {};
        if (jellyIds.length > 0) {
          const { data: jellies } = await supabase
            .from("jellyrates").select("id, title, score, photo_url").in("id", jellyIds);
          jellies?.forEach((j: any) => { jellyMap[j.id] = j; });
        }

        // Enrich with comment text
        const commentIds = [...new Set(notifData.filter((n: any) => n.comment_id).map((n: any) => n.comment_id))];
        let commentMap: Record<string, string> = {};
        if (commentIds.length > 0) {
          const { data: comments } = await supabase
            .from("comments").select("id, text").in("id", commentIds);
          comments?.forEach((c: any) => { commentMap[c.id] = c.text; });
        }

        const notifications: Notification[] = notifData.map((n: any) => {
          const actor = actorMap[n.actor_id];
          const jelly = n.jellyrate_id ? jellyMap[n.jellyrate_id] : null;
          return {
            id: n.id,
            type: n.type,
            actor_id: n.actor_id,
            actor_username: actor?.username ?? "usuario",
            actor_avatar: actor?.avatar_url ?? null,
            jellyrate_id: n.jellyrate_id,
            jelly_title: jelly?.title,
            jelly_score: jelly?.score,
            jelly_photo: jelly?.photo_url,
            comment_text: n.comment_id ? commentMap[n.comment_id] : undefined,
            read: n.read,
            created_at: n.created_at,
          };
        });
        setAllNotifs(notifications);

        // Mark all as read
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("recipient_id", uid)
          .eq("read", false);

      } else {
        // Fallback: load likes on my own jellyrates manually
        const { data: myJellies } = await supabase
          .from("jellyrates").select("id, title, score").eq("user_id", uid);

        if (!myJellies?.length) { setLoading(false); return; }
        const myJellyIds = myJellies.map((j: any) => j.id);
        const jellyMap2: Record<string, any> = {};
        myJellies.forEach((j: any) => { jellyMap2[j.id] = j; });

        const { data: likesData } = await supabase
          .from("likes")
          .select("user_id, jellyrate_id, created_at")
          .in("jellyrate_id", myJellyIds)
          .neq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(40);

        const actorIds2 = [...new Set(likesData?.map((l: any) => l.user_id) ?? [])];
        let actorMap2: Record<string, any> = {};
        if (actorIds2.length) {
          const { data: actors2 } = await supabase
            .from("profiles").select("id, username, avatar_url").in("id", actorIds2);
          actors2?.forEach((a: any) => { actorMap2[a.id] = a; });
        }

        const notifications: Notification[] = (likesData ?? []).map((l: any) => {
          const actor = actorMap2[l.user_id];
          const jelly = jellyMap2[l.jellyrate_id];
          return {
            id: `like-${l.created_at}-${l.user_id}-${l.jellyrate_id}`,
            type: "like" as const,
            actor_id: l.user_id,
            actor_username: actor?.username ?? "usuario",
            actor_avatar: actor?.avatar_url ?? null,
            jellyrate_id: l.jellyrate_id,
            jelly_title: jelly?.title,
            jelly_score: jelly?.score,
            read: true,
            created_at: l.created_at,
          };
        });
        setAllNotifs(notifications);
      }

      setLoading(false);
    }
    load();
  }, []);

  const filtered = activeFilter === "all"
    ? allNotifs
    : allNotifs.filter(n => filterTabs.find(t => t.key === activeFilter)?.types.includes(n.type));

  const { today, week, older } = groupByTime(filtered);
  const unread = allNotifs.filter(n => !n.read).length;

  function renderItem(n: Notification) {
    // Deep link target
    const href = n.jellyrate_id
      ? `/jelly/${n.jellyrate_id}`
      : ["follow", "follow_request", "follow_accepted"].includes(n.type)
        ? `/profile/${n.actor_username}`
        : undefined;

    const inner = (
      <div className={`flex items-center gap-3 px-4 py-3.5 border-b border-[#f5f2ee] active:bg-[#f5f2ee] transition-colors ${!n.read ? "bg-[#fff8f8]" : "bg-white"}`}>
        {/* Actor avatar */}
        <div className="w-10 h-10 rounded-full bg-[#ece8e3] overflow-hidden flex items-center justify-center font-black text-sm text-[#aaa] flex-shrink-0">
          {n.actor_avatar
            ? <Image src={n.actor_avatar} alt="" width={40} height={40} className="object-cover" unoptimized />
            : n.actor_username[0].toUpperCase()
          }
        </div>

        {/* Type icon */}
        <NotifIcon type={n.type} />

        {/* Text + time */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#2a2a2a] leading-snug">{notifText(n)}</p>
          <p className="text-[11px] text-[#bbb] mt-0.5 font-semibold">{timeAgo(n.created_at)}</p>
        </div>

        {/* Jelly thumbnail */}
        {n.jelly_photo && (
          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[#f0ede8] border border-[#e8e3dd]">
            <Image src={n.jelly_photo} alt="" width={44} height={44} className="object-cover" unoptimized />
          </div>
        )}

        {/* Unread dot */}
        {!n.read && !n.jelly_photo && (
          <div className="w-2 h-2 rounded-full bg-[#e8363a] flex-shrink-0" />
        )}

        {/* Follow request actions — stop propagation */}
        {n.type === "follow_request" && (
          <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button className="w-8 h-8 rounded-xl bg-[#e8363a] flex items-center justify-center active:opacity-80">
              <svg width="14" height="14" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </button>
            <button className="w-8 h-8 rounded-xl bg-[#f0ede8] flex items-center justify-center active:opacity-80">
              <svg width="14" height="14" fill="none" stroke="#999" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
      </div>
    );

    return href
      ? <Link key={n.id} href={href}>{inner}</Link>
      : <div key={n.id}>{inner}</div>;
  }

  function renderSection(label: string, items: Notification[]) {
    if (!items.length) return null;
    return (
      <div>
        <div className="px-4 py-2 bg-[#f8f5f1]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#aaa]">{label}</p>
        </div>
        {items.map(renderItem)}
      </div>
    );
  }

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="w-8" />
          <div className="flex items-center gap-2">
            <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a]">ACTIVIDAD</h1>
            {unread > 0 && (
              <div className="w-5 h-5 rounded-full bg-[#e8363a] flex items-center justify-center">
                <span className="text-[10px] font-black text-white">{unread > 9 ? "9+" : unread}</span>
              </div>
            )}
          </div>
          <div className="w-8" />
        </div>

        {/* Filter tabs */}
        <div className="flex px-4 pb-2 gap-2">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center justify-center px-3 py-1.5 rounded-xl transition-colors ${
                tab.key === "all" ? "flex-1" : "w-10"
              } ${
                activeFilter === tab.key
                  ? "bg-[#e8363a] text-white"
                  : "bg-[#f0ede8] text-[#999]"
              }`}
            >
              <TabIcon type={tab.key} active={activeFilter === tab.key} />
            </button>
          ))}
        </div>

        <div className="h-2" style={{
          backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(315deg, #e8e3dd 25%, transparent 25%), linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
          backgroundSize: "16px 16px",
          backgroundColor: "#f2f1ed",
        }} />
      </header>

      {loading ? (
        <div className="flex flex-col gap-0 pt-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f0ede8] bg-white animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[#ece8e3]" />
              <div className="w-7 h-7 rounded-full bg-[#f0ede8]" />
              <div className="flex-1">
                <div className="h-3 bg-[#ece8e3] rounded w-3/4 mb-2" />
                <div className="h-2.5 bg-[#ece8e3] rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white border border-[#e0dbd4] flex items-center justify-center">
            <svg width="28" height="28" fill="none" stroke="#ccc" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-black uppercase tracking-widest text-[#2a2a2a] text-sm">Sin actividad aún</p>
            <p className="text-xs text-[#999] mt-1">Aquí verás cuando alguien interactúe contigo</p>
          </div>
        </div>
      ) : (
        <div>
          {renderSection("Hoy", today)}
          {renderSection("Esta Semana", week)}
          {renderSection("Antes", older)}
        </div>
      )}
    </div>
  );
}
