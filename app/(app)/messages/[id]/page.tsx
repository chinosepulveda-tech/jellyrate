"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function Avatar({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
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
      <span className="text-white font-black text-xs">{initials}</span>
    </div>
  );
}

// ─── JellyRate bubble ────────────────────────────────────────────────────────

function JellyBubble({ jellyrate, isMine }: { jellyrate: Message["jellyrate"]; isMine: boolean }) {
  if (!jellyrate) return null;
  return (
    <Link
      href={`/jelly/${jellyrate.id}`}
      className={`flex items-center gap-3 p-2.5 border-2 border-[#1a1a1a] bg-white max-w-[220px] ${
        isMine ? "ml-auto" : ""
      }`}
      style={{ boxShadow: "2px 2px 0 #1a1a1a" }}
    >
      {jellyrate.photo_url && (
        <div className="w-14 h-14 flex-shrink-0 overflow-hidden border border-[#e0dbd4]">
          <img src={jellyrate.photo_url} alt={jellyrate.title}
            className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-[#1a1a1a] leading-tight truncate">{jellyrate.title}</p>
        <div className="mt-1 flex items-center gap-1">
          <span className="text-[10px] font-black text-white px-1.5 py-0.5"
            style={{ backgroundColor: "#e8363a" }}>
            {jellyrate.score}
          </span>
          <span className="text-[10px] text-[#888]">JellyRate</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Main chat page ──────────────────────────────────────────────────────────

export default function ChatPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<Profile | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
    }, 50);
  }, []);

  // ── load messages ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, text, jellyrate_id, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) { setLoading(false); return; }
    const msgs = (data ?? []) as Message[];

    // Fetch JellyRate data for any shared JellyRates
    const jrIds = [...new Set(msgs.map(m => m.jellyrate_id).filter(Boolean))] as string[];
    if (jrIds.length > 0) {
      const { data: jrs } = await supabase
        .from("jellyrates")
        .select("id, photo_url, title, score")
        .in("id", jrIds);
      const jrMap = Object.fromEntries((jrs ?? []).map((j: any) => [j.id, j]));
      setMessages(msgs.map(m => m.jellyrate_id ? { ...m, jellyrate: jrMap[m.jellyrate_id] } : m));
    } else {
      setMessages(msgs);
    }
    setLoading(false);
  }, [supabase, conversationId]);

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setMyId(user.id);

      // Get the other participant via SECURITY DEFINER function (bypasses RLS for other's row)
      const { data: otherProfile } = await supabase
        .rpc("get_dm_other_user", { conv_id: conversationId });

      if (otherProfile && otherProfile.length > 0) {
        setOther(otherProfile[0] as Profile);
      }

      await loadMessages();
      scrollToBottom("instant" as ScrollBehavior);
    }
    init();
  }, [conversationId, loadMessages, router, scrollToBottom, supabase]);

  // ── realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          let newMsg = payload.new as Message;

          // If it carries a jellyrate, fetch it
          if (newMsg.jellyrate_id) {
            const { data: jr } = await supabase
              .from("jellyrates")
              .select("id, photo_url, title, score")
              .eq("id", newMsg.jellyrate_id)
              .single();
            if (jr) newMsg = { ...newMsg, jellyrate: jr as any };
          }

          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) return prev;
            const tempIdx = prev.findIndex(
              (m) => m.id.startsWith("temp-") && m.sender_id === newMsg.sender_id
            );
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = newMsg;
              return next;
            }
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId, conversationId, supabase, scrollToBottom]);

  // ── send ──────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !myId || sending) return;

    setSending(true);
    setText("");

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: myId,
      text: trimmed,
      jellyrate_id: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: myId, text: trimmed })
      .select("id, conversation_id, sender_id, text, jellyrate_id, created_at")
      .single();

    if (error || !data) {
      // Roll back optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(trimmed);
    } else {
      // Replace temp with the real persisted message
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? (data as Message) : m)
      );
    }

    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  const isMine = (msg: Message) => msg.sender_id === myId;

  return (
    <div
      className="flex flex-col bg-[#f2f1ed] overflow-hidden"
      style={{ height: "calc(100svh - 72px - env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Header */}
      <header className="safe-header z-40 bg-white border-b border-[#ede9e3] flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center active:opacity-60">
            <svg width="22" height="22" fill="none" stroke="#1a1a1a" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {other && (
            <Link href={`/profile/${other.username}`} className="flex items-center gap-2.5 flex-1 min-w-0">
              <Avatar url={other.avatar_url} name={other.full_name || other.username} size={36} />
              <div className="min-w-0">
                <p className="font-black text-sm text-[#1a1a1a] truncate leading-tight">
                  {other.full_name || other.username}
                </p>
                <p className="text-xs text-[#888] truncate">@{other.username}</p>
              </div>
            </Link>
          )}
        </div>
        {/* Hatch pattern divider */}
        <div className="h-1.5" style={{
          backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0, linear-gradient(315deg, #e8e3dd 25%, transparent 25%), linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
          backgroundSize: "16px 16px", backgroundColor: "#f2f1ed",
        }} />
      </header>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-[#e8363a] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const mine = isMine(msg);
              const showDay = i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at);

              return (
                <div key={msg.id}>
                  {showDay && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] text-[#aaa] bg-[#ede9e3] px-3 py-1 rounded-full font-medium">
                        {dayLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar — only for other, and only on last msg in group */}
                    {!mine && (
                      <div className="w-7 flex-shrink-0">
                        {(i === messages.length - 1 || messages[i + 1]?.sender_id !== msg.sender_id) && (
                          <Avatar
                            url={other?.avatar_url ?? null}
                            name={other?.full_name || other?.username || "?"}
                            size={28}
                          />
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${mine ? "items-end" : "items-start"} max-w-[72%]`}>
                      {msg.jellyrate_id ? (
                        <JellyBubble jellyrate={(msg as any).jellyrate} isMine={mine} />
                      ) : (
                        <div
                          className={`px-3.5 py-2.5 text-sm leading-snug ${
                            mine
                              ? "bg-[#e8363a] text-white"
                              : "bg-white border border-[#e0dbd4] text-[#1a1a1a]"
                          }`}
                          style={{
                            borderRadius: mine
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                          }}
                        >
                          {msg.text}
                        </div>
                      )}
                      <span className="text-[10px] text-[#bbb] mt-1 px-1">
                        {timeLabel(msg.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Input bar */}
      <div
        className="bg-white border-t border-[#ede9e3] px-3 flex items-end gap-2 flex-shrink-0"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))", paddingTop: 10 }}
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje…"
          rows={1}
          className="flex-1 resize-none bg-[#f2f1ed] border border-[#e0dbd4] rounded-2xl px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#1a1a1a] transition-colors"
          style={{ maxHeight: 100, lineHeight: "1.4" }}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
          style={{
            backgroundColor: text.trim() ? "#e8363a" : "#e0dbd4",
            boxShadow: text.trim() ? "0 2px 8px rgba(232,54,58,0.35)" : "none",
          }}
        >
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
