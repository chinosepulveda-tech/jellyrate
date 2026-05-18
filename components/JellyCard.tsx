"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CommentsSheet from "@/components/CommentsSheet";
import ImageViewer from "@/components/ImageViewer";
import { useToast } from "@/components/Toast";
import type { JellyRate } from "@/lib/types";

// ── Share sheet ───────────────────────────────────────────────────────
function ShareSheet({
  jelly,
  currentUserId,
  onClose,
  onToast,
}: {
  jelly: JellyRate;
  currentUserId?: string;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const supabase = createClient();
  const [step, setStep] = useState<"main" | "dm">("main");
  const [convos, setConvos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/jelly/${jelly.id}` : "";

  // Load existing conversations when DM step opens
  useEffect(() => {
    if (step !== "dm") return;
    supabase.rpc("get_my_conversations").then(({ data }) => {
      setConvos(data ?? []);
    });
  }, [step, supabase]);

  // Debounced people search
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .ilike("username", `%${search.trim()}%`)
        .neq("id", currentUserId ?? "")
        .limit(8);
      setSearchResults(data ?? []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [search, currentUserId, supabase]);

  async function sendDM(targetUserId: string) {
    if (!currentUserId || sending) return;
    setSending(targetUserId);
    const { data: convId, error } = await supabase.rpc("create_or_get_dm", {
      target_user_id: targetUserId,
    });
    if (error || !convId) { setSending(null); return; }
    await supabase.from("messages").insert({
      conversation_id: convId,
      sender_id: currentUserId,
      jellyrate_id: jelly.id,
    });
    setSending(null);
    onClose();
    onToast("¡JellyRate enviado!");
  }

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      onClose();
      onToast("Enlace copiado");
    });
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`${jelly.title} — ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    onClose();
  }

  // ── DM picker step ──────────────────────────────────────────────────
  if (step === "dm") {
    const listToShow = search.trim() ? searchResults : convos;
    return (
      <div className="fixed inset-0 z-[200] flex items-end" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative w-full max-w-[480px] mx-auto bg-white rounded-t-3xl overflow-hidden"
          onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#e0dbd4]" />
          </div>
          <div className="flex items-center gap-2 px-4 pb-3 pt-1">
            <button onClick={() => setStep("main")} className="w-8 h-8 flex items-center justify-center active:opacity-60">
              <svg width="20" height="20" fill="none" stroke="#1a1a1a" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <p className="font-black text-sm uppercase tracking-wide text-[#1a1a1a]">Enviar a…</p>
          </div>
          {/* Search */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 bg-[#f2f1ed] rounded-xl px-3 py-2.5">
              <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar persona…"
                className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none"
              />
              {searching && <div className="w-3 h-3 rounded-full border border-[#aaa] border-t-transparent animate-spin" />}
            </div>
          </div>
          {/* List */}
          <div className="overflow-y-auto max-h-[50vh] pb-8" style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
            {!search.trim() && convos.length === 0 && (
              <p className="text-xs text-[#bbb] text-center py-6">Aún no tienes conversaciones.</p>
            )}
            {listToShow.map((item: any) => {
              const id = item.other_id ?? item.id;
              const name = item.other_full_name ?? item.full_name ?? item.other_username ?? item.username;
              const user = item.other_username ?? item.username;
              const avatar = item.other_avatar ?? item.avatar_url;
              const isSending = sending === id;
              return (
                <button
                  key={id}
                  onClick={() => sendDM(id)}
                  disabled={!!sending}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#f5f2ee] transition-colors"
                >
                  {avatar
                    ? <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-full bg-[#e8363a] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-black text-sm">{(name || "?").slice(0, 2).toUpperCase()}</span>
                      </div>
                  }
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-black text-sm text-[#1a1a1a] truncate">{name}</p>
                    <p className="text-xs text-[#888]">@{user}</p>
                  </div>
                  {isSending
                    ? <div className="w-5 h-5 rounded-full border-2 border-[#e8363a] border-t-transparent animate-spin" />
                    : <div className="w-8 h-8 rounded-full bg-[#e8363a] flex items-center justify-center">
                        <svg width="14" height="14" fill="none" stroke="white" strokeWidth={2.2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </div>
                  }
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Main step ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-[480px] mx-auto bg-white rounded-t-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#e0dbd4]" />
        </div>
        {/* Preview */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f5f2ee]">
          <div className="w-12 h-12 rounded-xl bg-[#f0ede8] overflow-hidden flex-shrink-0">
            {jelly.photo_url
              ? <img src={jelly.photo_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-lg font-black text-[#e8363a]">{jelly.score}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-[#1a1a1a] truncate">{jelly.title}</p>
            <p className="text-xs text-[#aaa]">Score: {jelly.score}/10</p>
          </div>
        </div>
        {/* Options */}
        <div className="pb-safe">
          {currentUserId && (
            <button onClick={() => setStep("dm")}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#f5f2ee] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#1a1a1a" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-black text-sm text-[#1a1a1a] uppercase tracking-wide">Enviar por mensaje</p>
                <p className="text-xs text-[#aaa]">Envía este JellyRate a alguien</p>
              </div>
              <svg className="ml-auto" width="16" height="16" fill="none" stroke="#ccc" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
          <button onClick={shareWhatsApp}
            className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#f5f2ee] transition-colors">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#25D366" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="font-black text-sm text-[#1a1a1a] uppercase tracking-wide">Enviar por WhatsApp</p>
              <p className="text-xs text-[#aaa]">Comparte el enlace directo</p>
            </div>
          </button>
          <button onClick={copyLink}
            className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#f5f2ee] transition-colors"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
            <div className="w-10 h-10 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" stroke="#5bbcb3" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-black text-sm text-[#1a1a1a] uppercase tracking-wide">Copiar enlace</p>
              <p className="text-xs text-[#aaa]">Copia el link para compartir donde quieras</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit sheet ────────────────────────────────────────────────────────
function EditSheet({
  jelly,
  onClose,
  onSaved,
}: {
  jelly: JellyRate;
  onClose: () => void;
  onSaved: (title: string, description: string) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(jelly.title);
  const [description, setDescription] = useState(jelly.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const t = title.trim();
    if (!t) { setError("El título no puede estar vacío."); return; }
    setSaving(true);
    const { error: err } = await supabase
      .from("jellyrates")
      .update({ title: t, description: description.trim() || null })
      .eq("id", jelly.id);
    setSaving(false);
    if (err) { setError("No se pudo guardar. Intenta de nuevo."); return; }
    onSaved(t, description.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[480px] mx-auto bg-white rounded-t-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#e0dbd4]" />
        </div>
        <div className="px-5 pb-2 pt-1">
          <h2 className="font-black text-base text-[#1a1a1a] uppercase tracking-wide">Editar JellyRate</h2>
          <p className="text-xs text-[#aaa] mt-0.5">Solo el título y el comentario son editables.</p>
        </div>
        <div className="px-5 pb-4 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-1.5">Título</label>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setError(""); }}
              maxLength={120}
              className="w-full border-2 border-[#1a1a1a] bg-white px-3.5 py-2.5 text-sm font-black text-[#1a1a1a] focus:outline-none focus:border-[#e8363a] transition-colors"
              style={{ boxShadow: "2px 2px 0 #1a1a1a" }}
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-1.5">Comentario</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Agrega un comentario… (opcional)"
              className="w-full border-2 border-[#1a1a1a] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:border-[#e8363a] transition-colors resize-none"
              style={{ boxShadow: "2px 2px 0 #1a1a1a" }}
            />
          </div>
          {error && <p className="text-xs text-[#e8363a] font-bold">{error}</p>}
          <div className="flex gap-3 pb-4" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-[#1a1a1a] text-xs font-black text-[#1a1a1a] uppercase tracking-wide active:opacity-70"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-[#e8363a] text-xs font-black text-white uppercase tracking-wide active:opacity-80 disabled:opacity-50"
              style={{ boxShadow: saving ? "none" : "2px 2px 0 #1a1a1a" }}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Action menu sheet ──────────────────────────────────────────────────
function ActionSheet({
  jelly,
  isOwner,
  onClose,
  onDeleted,
  onEdit,
}: {
  jelly: JellyRate;
  isOwner: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  onEdit?: () => void;
}) {
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este JellyRate?")) return;
    setDeleting(true);
    await supabase.from("jellyrates").delete().eq("id", jelly.id);
    onDeleted?.();
    onClose();
  }

  function handleCopy() {
    const url = `${window.location.origin}/jelly/${jelly.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(onClose, 700);
    });
  }

  function handleReport() {
    alert("Reporte enviado. Gracias.");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[480px] mx-auto bg-white rounded-t-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#e0dbd4]" />
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f5f2ee]">
          <div className="w-12 h-12 rounded-xl bg-[#f0ede8] overflow-hidden flex-shrink-0">
            {jelly.photo_url
              ? <Image src={jelly.photo_url} alt="" width={48} height={48} className="object-cover" unoptimized />
              : <div className="w-full h-full flex items-center justify-center text-lg">{jelly.score}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-[#2a2a2a] truncate">{jelly.title}</p>
            <p className="text-xs text-[#aaa]">Score: {jelly.score}/10</p>
          </div>
        </div>
        <div className="pb-8">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#f5f2ee] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
              {copied
                ? <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                : <svg width="18" height="18" fill="none" stroke="#5bbcb3" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              }
            </div>
            <span className="font-black text-sm text-[#2a2a2a] uppercase tracking-wide">
              {copied ? "¡Copiado!" : "Copiar enlace"}
            </span>
          </button>
          {isOwner && (
            <button
              onClick={() => { onClose(); onEdit?.(); }}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#f5f2ee] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#1a1a1a" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </div>
              <span className="font-black text-sm text-[#1a1a1a] uppercase tracking-wide">Editar JellyRate</span>
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#fff0f0] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#fff0f0] flex items-center justify-center flex-shrink-0">
                {deleting
                  ? <div className="w-4 h-4 border-2 border-[#e8363a] border-t-transparent rounded-full animate-spin" />
                  : <svg width="18" height="18" fill="none" stroke="#e8363a" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                }
              </div>
              <span className="font-black text-sm text-[#e8363a] uppercase tracking-wide">
                {deleting ? "Eliminando…" : "Eliminar JellyRate"}
              </span>
            </button>
          )}
          {!isOwner && (
            <button
              onClick={handleReport}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#f5f2ee] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <span className="font-black text-sm text-[#f59e0b] uppercase tracking-wide">Reportar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Strip leading emoji chars from legacy category strings like "📦 Producto"
function cleanCategory(cat: string): string {
  return cat.replace(/^[\p{Emoji}\s]+/u, "").trim();
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  comida:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5M6 10.608v8.15c0 1.028.835 1.862 1.862 1.862h8.276c1.027 0 1.862-.834 1.862-1.862v-8.15M6 10.608h12" /></svg>,
  película:  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-14.25m0 14.25h1.5m0 0h14.25M3.375 5.25A1.125 1.125 0 002.25 6.375v11.25c0 .621.504 1.125 1.125 1.125M21 5.25h-1.5c-.621 0-1.125.504-1.125 1.125m2.625-1.125A1.125 1.125 0 0121.75 6.375v11.25a1.125 1.125 0 01-1.125 1.125M21 5.25v14.25m0-14.25h-1.5m0 0H6" /></svg>,
  bebida:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.769 0-5.536-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>,
  lugar:     <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  música:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /></svg>,
  producto:  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
  libro:     <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  viaje:     <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>,
  servicio:  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>,
  juego:     <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" /></svg>,
};

function CategoryBadge({ category }: { category: string }) {
  const clean = cleanCategory(category);
  const key = clean.toLowerCase();
  const icon = CATEGORY_ICONS[key];
  return (
    <div className="flex items-center gap-1 text-[#888]">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wide">{clean}</span>
    </div>
  );
}

export function ScoreColor(score: number) {
  if (score >= 9) return "#16a34a";
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "#f59e0b";
  if (score >= 4) return "#f97316";
  return "#e8363a";
}

export function ScoreLabel(score: number) {
  if (score >= 9) return "¡Increíble!";
  if (score >= 8) return "Muy bueno";
  if (score >= 7) return "Bueno";
  if (score >= 6) return "Aceptable";
  if (score >= 5) return "Regular";
  if (score >= 4) return "Mala";
  return "Terrible";
}

interface Props {
  jelly: JellyRate;
  currentUserId?: string;
}

export default function JellyCard({ jelly, currentUserId }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [liked, setLiked] = useState(jelly.user_liked ?? false);
  const [likes, setLikes] = useState(jelly.likes_count ?? 0);
  // Total visible in CommentsSheet: author note + text comments + rejellies
  const initialActivityCount =
    (jelly.description ? 1 : 0) +
    (jelly.comments_count ?? 0) +
    (jelly.rejellies_count ?? 0);
  const [commentsCount, setCommentsCount] = useState(initialActivityCount);
  const [rejellies, setRejellies] = useState(jelly.rejellies_count ?? 0);
  const [saved, setSaved] = useState(jelly.user_saved ?? false);
  const [showRejelly, setShowRejelly] = useState(false);
  const [rejellyScore, setRejellyScore] = useState(7);
  const [rejellyComment, setRejellyComment] = useState("");
  const [rejellyDone, setRejellyDone] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [localTitle, setLocalTitle] = useState(jelly.title);
  const [localDescription, setLocalDescription] = useState(jelly.description ?? "");
  const [heartPop, setHeartPop] = useState(false);
  const lastTap = useRef<number>(0);

  const isOwner = !!(currentUserId && currentUserId === jelly.user_id);

  const scoreColor = ScoreColor(jelly.score);
  const timeAgo = formatTimeAgo(jelly.created_at);
  const username = jelly.profile?.username ?? "usuario";

  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePhotoTap = useCallback(() => {
    const now = Date.now();
    const isDouble = now - lastTap.current < 350;
    lastTap.current = now;

    if (isDouble) {
      // Cancel pending single-tap open
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      if (!liked && currentUserId) {
        doLike();
        setHeartPop(true);
        setTimeout(() => setHeartPop(false), 800);
      }
    } else {
      // Delay single-tap to allow double-tap to cancel it
      singleTapTimer.current = setTimeout(() => {
        if (jelly.photo_url) setShowViewer(true);
      }, 360);
    }
  }, [liked, currentUserId, jelly.photo_url]);

  async function doLike() {
    await supabase.from("likes").insert({ user_id: currentUserId, jellyrate_id: jelly.id });
    setLikes(l => l + 1);
    setLiked(true);
    toast.show("¡Te gustó!", "♥", "success");
  }

  async function toggleLike() {
    if (!currentUserId) return;
    if (liked) {
      await supabase.from("likes").delete().match({ user_id: currentUserId, jellyrate_id: jelly.id });
      setLikes(l => Math.max(0, l - 1));
      setLiked(false);
    } else {
      doLike();
    }
  }

  async function toggleSave() {
    if (!currentUserId) return;
    if (saved) {
      await supabase.from("saves").delete().match({ user_id: currentUserId, jellyrate_id: jelly.id });
      setSaved(false);
      toast.show("Guardado eliminado", "×");
    } else {
      await supabase.from("saves").insert({ user_id: currentUserId, jellyrate_id: jelly.id });
      setSaved(true);
      toast.show("¡Guardado!", "✓", "success");
    }
  }

  async function submitRejelly() {
    if (!currentUserId) return;
    await supabase.from("rejellies").upsert({
      user_id: currentUserId,
      jellyrate_id: jelly.id,
      score: rejellyScore,
      comment: rejellyComment.trim() || null,
    });
    setShowRejelly(false);
    setRejellyDone(true);
    setRejellyComment("");
    toast.show(`ReJelly ${rejellyScore}/10 enviado`, "★", "success");
    setRejellies(r => r + 1);
  }

  if (deleted) return null;

  return (
    <article className="border-b border-[#ede9e3] bg-white">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <Link href={`/profile/${username}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#ece8e3] overflow-hidden border-2 border-[#e0dbd4]">
            {jelly.profile?.avatar_url ? (
              <Image src={jelly.profile.avatar_url} alt="" width={40} height={40} className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-black text-[#aaa]">
                {username[0].toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        {/* Username + title */}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${username}`}>
            <p className="font-black text-xs uppercase tracking-widest text-[#2a2a2a] leading-tight">{username}</p>
          </Link>
          <p className="text-xs text-[#888] truncate leading-tight mt-0.5">{localTitle}</p>
        </div>

        {/* Time + location (right column) */}
        <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
          {/* Time */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-[#aaa]">{timeAgo}</span>
            <svg width="11" height="11" fill="none" stroke="#ccc" strokeWidth={1.8} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 6v6l3.5 2" />
            </svg>
          </div>
          {/* Location */}
          {jelly.place_name ? (
            <div className="flex items-center gap-0.5 max-w-[110px]">
              <svg width="9" height="9" fill="#e8363a" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span className="text-[10px] text-[#aaa] truncate">{jelly.place_name}</span>
            </div>
          ) : (
            /* 3-dot menu when no location, else below */
            <button
              onClick={() => setShowActions(true)}
              className="w-6 h-6 flex items-center justify-center text-[#ccc] active:text-[#999]"
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          )}
          {/* 3-dot when location exists */}
          {jelly.place_name && (
            <button
              onClick={() => setShowActions(true)}
              className="w-5 h-5 flex items-center justify-center text-[#ccc] active:text-[#999] -mt-0.5"
            >
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Photo ── */}
      <div
        className="relative bg-[#f0ede8] select-none overflow-hidden"
        onClick={handlePhotoTap}
      >
        {jelly.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={jelly.photo_url}
            alt={jelly.title}
            className="w-full h-auto block"
            style={{ maxHeight: "85vh" }}
          />
        ) : (
          <div className="aspect-square flex items-center justify-center">
            <svg width="48" height="48" fill="none" stroke="#ddd" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}

        {/* ── Score badge: top-left ── */}
        <div
          className="absolute top-0 left-0 flex flex-col items-center justify-center"
          style={{
            backgroundColor: "#e8363a",
            width: 60,
            minHeight: 56,
            paddingBottom: (jelly.total_ratings ?? 1) > 1 ? 6 : 0,
            paddingTop: (jelly.total_ratings ?? 1) > 1 ? 6 : 0,
            borderBottomRightRadius: 14,
            boxShadow: "3px 3px 10px rgba(0,0,0,0.35)",
          }}
        >
          <span
            className="text-2xl font-black text-white leading-none"
            style={{ textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
          >
            {(jelly.total_ratings ?? 1) > 1
              ? (jelly.avg_score ?? jelly.score)
              : jelly.score}
          </span>
          {(jelly.total_ratings ?? 1) > 1 && (
            <span className="text-[9px] font-bold text-white/80 leading-none mt-0.5">
              {jelly.total_ratings} notas
            </span>
          )}
        </div>

        {/* Audience badge */}
        {jelly.audience && jelly.audience !== "all" && (
          <div className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-0.5">
            <span className="text-[10px] font-bold text-white">{jelly.audience === "male" ? "♂" : "♀"}</span>
          </div>
        )}

        {/* Double-tap heart */}
        {heartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg width="90" height="90" fill="#e8363a" viewBox="0 0 24 24"
              style={{ filter: "drop-shadow(0 4px 12px rgba(232,54,58,0.5))", animation: "heartPop 0.7s ease-out forwards" }}>
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
        )}
      </div>

      {/* ── "Creado por" bar ── */}
      <div className="bg-[#2a2a2a] px-4 py-2 flex items-center justify-between">
        <p className="text-xs text-[#aaa]">
          Creado por{" "}
          <Link href={`/profile/${username}`}>
            <span className="font-black text-white">{username}</span>
          </Link>
        </p>
        {jelly.category && <CategoryBadge category={jelly.category} />}
      </div>

      {/* ── Friend ratings strip ── */}
      {(jelly.friendRatings?.length ?? 0) > 0 && (
        <div className="px-4 py-2 bg-[#eaf8f7] border-t border-[#c8eceb] flex items-center gap-2">
          <svg width="13" height="13" fill="none" stroke="#5bbcb3" strokeWidth={2} viewBox="0 0 24 24" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-x-auto scrollbar-none">
            {(jelly.friendRatings ?? []).slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-center gap-1 flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-[#5bbcb3] overflow-hidden flex items-center justify-center text-[9px] font-black text-white flex-shrink-0">
                  {f.avatar_url
                    ? <Image src={f.avatar_url} alt="" width={20} height={20} className="object-cover" unoptimized />
                    : f.username[0].toUpperCase()
                  }
                </div>
                <span className="text-[10px] font-black text-[#3fa49b] truncate max-w-[60px]">{f.username}</span>
                <span
                  className="text-[9px] font-black text-white px-1 py-px rounded-md flex-shrink-0"
                  style={{ backgroundColor: ScoreColor(f.score) }}
                >
                  {f.score}
                </span>
              </div>
            ))}
            {(jelly.friendRatings?.length ?? 0) > 4 && (
              <span className="text-[10px] text-[#5bbcb3] font-bold flex-shrink-0">
                +{(jelly.friendRatings?.length ?? 0) - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Caption ── */}
      {localDescription && (
        <div className="px-4 py-2.5 bg-white border-t border-[#f5f2ee]">
          <p className="text-sm text-[#444] leading-snug">{localDescription}</p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center px-2 py-1.5 bg-white border-t border-[#f5f2ee]">
        {/* Like */}
        <button onClick={toggleLike} className="flex items-center gap-1 px-3 py-2 active:scale-90 transition-transform">
          <svg width="22" height="22"
            fill={liked ? "#e8363a" : "none"}
            stroke={liked ? "#e8363a" : "#c8c3bc"}
            strokeWidth={liked ? 0 : 1.8}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {likes > 0 && <span className="text-xs font-bold" style={{ color: liked ? "#e8363a" : "#c8c3bc" }}>{likes}</span>}
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(true)} className="flex items-center gap-1 px-3 py-2 active:scale-90 transition-transform">
          <svg width="21" height="21" fill="none" stroke="#c8c3bc" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {commentsCount > 0 && <span className="text-xs font-bold text-[#c8c3bc]">{commentsCount}</span>}
        </button>

        {/* ReJelly */}
        <button
          onClick={() => !rejellyDone && setShowRejelly(!showRejelly)}
          className="flex items-center gap-1.5 px-3 py-2 active:scale-90 transition-transform"
        >
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: rejellyDone ? "#f59e0b" : "#c8c3bc" }}>
            Rejelly
          </span>
          {rejellies > 0 && <span className="text-xs font-bold" style={{ color: rejellyDone ? "#f59e0b" : "#c8c3bc" }}>{rejellies}</span>}
        </button>

        {/* Share */}
        <button onClick={() => setShowShare(true)} className="flex items-center gap-1 px-3 py-2 active:scale-90 transition-transform">
          <svg width="21" height="21" fill="none" stroke="#c8c3bc" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
          </svg>
        </button>

        <div className="flex-1" />

        {/* Save */}
        <button onClick={toggleSave} className="flex items-center gap-1 px-3 py-2 active:scale-90 transition-transform">
          <svg width="20" height="20"
            fill={saved ? "#e8363a" : "none"}
            stroke={saved ? "#e8363a" : "#c8c3bc"}
            strokeWidth={1.8} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </button>
      </div>

      {/* ── ReJelly panel ── */}
      {showRejelly && (
        <div className="mx-4 mb-3 p-4 bg-[#f8f5f1] rounded-2xl border border-[#e8e3dd]">
          <p className="text-xs font-black text-[#2a2a2a] mb-3 uppercase tracking-wide">
            Tu nota para <span className="text-[#e8363a]">{jelly.title}</span>
          </p>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl font-black w-10 text-center" style={{ color: ScoreColor(rejellyScore) }}>
              {rejellyScore}
            </span>
            <input type="range" min={1} max={10} value={rejellyScore}
              onChange={e => setRejellyScore(Number(e.target.value))} className="flex-1" />
          </div>
          {/* Optional comment */}
          <textarea
            value={rejellyComment}
            onChange={e => setRejellyComment(e.target.value)}
            placeholder="Agrega un comentario... (opcional)"
            maxLength={300}
            rows={2}
            className="w-full bg-white rounded-xl px-3 py-2 text-sm text-[#2a2a2a] placeholder:text-[#bbb] outline-none border border-[#e8e3dd] resize-none mb-3"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowRejelly(false)}
              className="flex-1 py-2.5 rounded-xl border border-[#e0dbd4] text-xs font-bold text-[#999]">
              Cancelar
            </button>
            <button onClick={submitRejelly}
              className="flex-1 py-2.5 rounded-xl bg-[#e8363a] text-xs font-black text-white uppercase tracking-wide">
              ReJelly
            </button>
          </div>
        </div>
      )}

      {/* ── Comments Sheet ── */}
      {showComments && (
        <CommentsSheet
          jellyId={jelly.id}
          jellyTitle={jelly.title}
          currentUserId={currentUserId}
          canonicalId={jelly.canonical_id}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentsCount(c => c + 1)}
          onCommentDeleted={() => setCommentsCount(c => Math.max(0, c - 1))}
        />
      )}

      {/* ── Action Sheet ── */}
      {showActions && (
        <ActionSheet
          jelly={jelly}
          isOwner={isOwner}
          onClose={() => setShowActions(false)}
          onDeleted={() => setDeleted(true)}
          onEdit={() => setShowEdit(true)}
        />
      )}

      {/* ── Share Sheet ── */}
      {showShare && (
        <ShareSheet
          jelly={{ ...jelly, title: localTitle }}
          currentUserId={currentUserId}
          onClose={() => setShowShare(false)}
          onToast={(msg) => toast.show(msg)}
        />
      )}

      {/* ── Edit Sheet ── */}
      {showEdit && (
        <EditSheet
          jelly={{ ...jelly, title: localTitle, description: localDescription }}
          onClose={() => setShowEdit(false)}
          onSaved={(t, d) => { setLocalTitle(t); setLocalDescription(d); }}
        />
      )}

      {/* ── Image Viewer ── */}
      {showViewer && jelly.photo_url && (
        <ImageViewer
          src={jelly.photo_url}
          title={jelly.title}
          score={jelly.score}
          username={username}
          onClose={() => setShowViewer(false)}
        />
      )}
    </article>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "AHORA";
  if (mins < 60) return `${mins} MIN`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HR`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} D`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} MES`;
  return `${Math.floor(months / 12)} AÑO`;
}
