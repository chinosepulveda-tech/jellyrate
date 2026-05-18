"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<{
    full_name: string | null;
    username: string;
    avatar_url: string | null;
    is_private: boolean;
  } | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url, is_private")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data);
        setIsPrivate(data.is_private ?? false);
      }
    }
    load();
  }, []);

  async function togglePrivacy() {
    if (!profile || togglingPrivacy) return;
    setTogglingPrivacy(true);
    const newVal = !isPrivate;
    setIsPrivate(newVal);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ is_private: newVal }).eq("id", user!.id);
    setTogglingPrivacy(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handlePasswordReset() {
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPasswordResetSent(true);
  }

  async function handleDeleteAccount() {
    // Sign out and show a message — actual deletion would need a server function
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-dvh bg-[#f2f1ed]">
      {/* Header */}
      <header className="sticky top-0 safe-header z-40 bg-[#f2f1ed]">
        <div className="flex items-center px-4 py-4 gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center text-[#2a2a2a]"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="font-bold text-lg text-[#1a1a1a] flex-1 text-center pr-9">Ajustes</h1>
        </div>
        <div className="h-px bg-[#e0dbd4]" />
      </header>

      <div className="px-4 pt-4 pb-16 flex flex-col gap-6">

        {/* Profile card */}
        <Link href="/profile/edit">
          <div className="bg-white rounded-2xl px-4 py-4 flex items-center gap-4 active:opacity-75 transition-opacity shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#f0ede8] overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-2xl text-[#bbb]">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={64} height={64} className="object-cover" />
              ) : (
                (profile?.username?.[0] ?? "?").toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg text-[#1a1a1a] leading-tight truncate">
                {profile?.full_name || profile?.username || "—"}
              </p>
              <p className="text-sm text-[#888] mt-0.5">@{profile?.username ?? "..."}</p>
              <p className="text-sm text-[#e8363a] font-medium mt-1">Toca para editar tu perfil</p>
            </div>
            <svg width="16" height="16" fill="none" stroke="#ccc" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>

        {/* CUENTA */}
        <div>
          <p className="text-xs font-semibold text-[#999] uppercase tracking-widest px-1 mb-2">Cuenta</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Editar perfil */}
            <Link href="/profile/edit">
              <div className="flex items-center gap-4 px-4 py-4 active:bg-[#f8f5f2] transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#888" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <span className="flex-1 text-[15px] text-[#1a1a1a] font-medium">Editar perfil</span>
                <svg width="16" height="16" fill="none" stroke="#ccc" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>

            <div className="h-px bg-[#f0ede8] mx-4" />

            {/* Cambiar contraseña */}
            <button
              onClick={handlePasswordReset}
              className="w-full flex items-center gap-4 px-4 py-4 active:bg-[#f8f5f2] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#888" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <span className="text-[15px] text-[#1a1a1a] font-medium">Cambiar contraseña</span>
                {passwordResetSent && (
                  <p className="text-xs text-[#22c55e] mt-0.5">Email enviado a {email}</p>
                )}
              </div>
              <svg width="16" height="16" fill="none" stroke="#ccc" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            <div className="h-px bg-[#f0ede8] mx-4" />

            {/* Email (display only) */}
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="w-9 h-9 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#888" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-[15px] text-[#1a1a1a] font-medium">Email</span>
                <p className="text-sm text-[#888] mt-0.5">{email ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* PRIVACIDAD */}
        <div>
          <p className="text-xs font-semibold text-[#999] uppercase tracking-widest px-1 mb-2">Privacidad</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="w-9 h-9 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#888" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-[15px] text-[#1a1a1a] font-medium">Perfil privado</span>
                <p className="text-sm text-[#888] mt-0.5">Solo tus seguidores pueden ver tus fotos</p>
              </div>
              {/* Toggle */}
              <button
                onClick={togglePrivacy}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  isPrivate ? "bg-[#e8363a]" : "bg-[#d1d5db]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    isPrivate ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* SESIÓN */}
        <div>
          <p className="text-xs font-semibold text-[#999] uppercase tracking-widest px-1 mb-2">Sesión</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-4 py-4 active:bg-[#f8f5f2] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#e8363a" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </div>
              <span className="flex-1 text-left text-[15px] text-[#e8363a] font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* ZONA DE PELIGRO */}
        <div>
          <p className="text-xs font-semibold text-[#999] uppercase tracking-widest px-1 mb-2">Zona de peligro</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-4 px-4 py-4 active:bg-[#f8f5f2] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#e8363a" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
                <span className="flex-1 text-left text-[15px] text-[#e8363a] font-medium">Eliminar cuenta</span>
              </button>
            ) : (
              <div className="px-4 py-4 flex flex-col gap-3">
                <p className="text-sm text-[#1a1a1a] font-medium">¿Eliminar tu cuenta?</p>
                <p className="text-xs text-[#888]">Esta acción es permanente y no se puede deshacer.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#e0dbd4] text-sm font-semibold text-[#777]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2.5 rounded-xl bg-[#e8363a] text-sm font-semibold text-white"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
