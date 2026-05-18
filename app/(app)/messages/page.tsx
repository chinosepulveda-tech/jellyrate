"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function Avatar({ url, name, size = 44 }: { url: string | null; name: string; size?: number }) {
  const initials = (name || "?").slice(0, 2).toUpperCase();
  if (url) {
    return (
      <img src={url} alt={name} className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full bg-[#e8363a] flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}>
      <span className="text-white font-black text-sm">{initials}</span>
    </div>
  );
}

interface ConvRow {
  id: string;
  updated_at: string;
  other_id: string;
  other_username: string;
  other_full_name: string | null;
  other_avatar: string | null;
  last_text: string | null;
  last_jr_id: string | null;
  last_sender_id: string | null;
  last_msg_at: string | null;
}

export default function MessagesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_my_conversations");
    if (!error && data) setConvs(data as ConvRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setMyId(user.id);
      await loadConversations();
    }
    init();
  }, [loadConversations, router, supabase]);

  useEffect(() => {
    if (!myId) return;
    const channel = supabase
      .channel("messages-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myId, loadConversations, supabase]);

  function preview(conv: ConvRow) {
    if (!conv.last_msg_at) return "Inicia la conversación";
    if (conv.last_jr_id) return conv.last_sender_id === myId ? "Compartiste un JellyRate" : "Te compartió un JellyRate";
    return conv.last_text ?? "";
  }

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      <header className="sticky top-0 safe-header z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="w-8" />
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a]">Mensajes</h1>
          <div className="w-8" />
        </div>
        <div className="h-2" style={{
          backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(315deg, #e8e3dd 25%, transparent 25%), linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
          backgroundSize: "16px 16px", backgroundColor: "#f2f1ed",
        }} />
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-[#e8363a] border-t-transparent animate-spin" />
        </div>
      ) : convs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 px-6 gap-5">
          <div className="w-20 h-20 border-2 border-[#1a1a1a] bg-white flex items-center justify-center"
            style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
            <svg width="36" height="36" fill="none" stroke="#1a1a1a" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-black uppercase tracking-wide text-[#1a1a1a] text-sm">Sin mensajes todavía</p>
            <p className="text-sm text-[#888] mt-1.5 max-w-[240px] leading-snug">
              Visita el perfil de un amigo y toca <strong>Mensaje</strong> para chatear.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-[#ede9e3]">
          {convs.map((conv) => (
            <li key={conv.id}>
              <Link href={`/messages/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3.5 bg-white active:bg-[#fafaf9] transition-colors">
                <Avatar
                  url={conv.other_avatar}
                  name={conv.other_full_name || conv.other_username || "?"}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-black text-[#1a1a1a] text-sm truncate">
                      {conv.other_full_name || conv.other_username}
                    </span>
                    {conv.last_msg_at && (
                      <span className="text-[11px] text-[#aaa] flex-shrink-0">
                        {timeAgo(conv.last_msg_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#888] truncate mt-0.5">{preview(conv)}</p>
                </div>
                <svg width="16" height="16" fill="none" stroke="#ccc" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
