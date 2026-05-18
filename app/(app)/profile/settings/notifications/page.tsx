"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { NotificationSettings } from "@/lib/types";

type SettingKey = keyof Omit<NotificationSettings, "user_id">;

interface SettingRow {
  key: SettingKey;
  label: string;
  color: string;
}

const SETTINGS_ROWS: SettingRow[] = [
  { key: "likes_jellyrate", label: "Le gusta tu JellyRate", color: "#5bbcb3" },
  { key: "likes_comment", label: "Le gusta tu comentario", color: "#5bbcb3" },
  { key: "comments_jellyrate", label: "Comenta tu JellyRate", color: "#c8b96a" },
  { key: "mentions", label: "Te menciona", color: "#c8b96a" },
  { key: "favorites_jellyrate", label: "Marca tu JellyRate como favorito", color: "#f0a440" },
  { key: "rejellies_jellyrate", label: "Hace un ReJelly del tuyo", color: "#f0a440" },
  { key: "reposts_jellyrate", label: "Repostea tu JellyRate", color: "#e8363a" },
  { key: "new_follower", label: "Comienza a seguirte", color: "#e8363a" },
  { key: "follow_request", label: "Quiere seguirte (cuenta privada)", color: "#e8363a" },
  { key: "follow_accepted", label: "Aceptó tu solicitud", color: "#e8363a" },
  { key: "friend_joined", label: "Tu amigo de Facebook se unió", color: "#4a7ab5" },
];

const DEFAULT_SETTINGS: Omit<NotificationSettings, "user_id"> = {
  likes_jellyrate: true,
  likes_comment: true,
  comments_jellyrate: true,
  mentions: true,
  favorites_jellyrate: true,
  rejellies_jellyrate: true,
  reposts_jellyrate: true,
  new_follower: true,
  follow_request: true,
  follow_accepted: true,
  friend_joined: true,
};

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

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [settings, setSettings] = useState<Omit<NotificationSettings, "user_id">>(DEFAULT_SETTINGS);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user: _authUser } } = await supabase.auth.getUser();
      if (!_authUser) return;
      setUserId(_authUser?.id);

      const { data } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", _authUser?.id)
        .single();

      if (data) {
        const { user_id, ...rest } = data;
        setSettings(rest);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function toggle(key: SettingKey) {
    if (!userId) return;
    const newVal = !settings[key];
    const updated = { ...settings, [key]: newVal };
    setSettings(updated);

    await supabase
      .from("notification_settings")
      .upsert({ user_id: userId, [key]: newVal });
  }

  return (
    <div className="min-h-screen bg-[#f2f1ed]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center px-4 py-3.5 gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8363a]">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a] flex-1 text-center mr-10">
            NOTIFICACIONES
          </h1>
        </div>
        <ZigzagBorder />
      </header>

      {/* Subheader */}
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs font-black text-[#999] uppercase tracking-widest text-center">
          CUANDO ALGUIEN...
        </p>
      </div>

      {/* Notification rows */}
      {loading ? (
        <div className="px-4 flex flex-col gap-2">
          {SETTINGS_ROWS.map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-[#e8e3dd] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-2 pb-8">
          {SETTINGS_ROWS.map((row) => {
            const enabled = settings[row.key];
            return (
              <button
                key={row.key}
                onClick={() => toggle(row.key)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all active:opacity-80"
                style={{ backgroundColor: enabled ? row.color : "#d6d2cc" }}
              >
                <span className="text-sm font-black text-white uppercase tracking-wide text-left leading-snug">
                  {row.label.toUpperCase()}
                </span>
                <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0 ml-3 ${enabled ? "bg-white/30" : ""}`}>
                  {enabled && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
