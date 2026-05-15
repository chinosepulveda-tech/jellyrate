"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

const settingsTiles = [
  {
    href: "/profile/settings/friends",
    color: "#5bbcb3",
    label: "BUSCAR Y\nINVITAR AMIGOS",
    icon: (
      <svg width="28" height="28" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    href: "/profile/edit",
    color: "#c8b96a",
    label: "EDITAR\nPERFIL",
    icon: (
      <svg width="28" height="28" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    href: "/profile/settings/notifications",
    color: "#f0a440",
    label: "NOTIFI-\nCACIONES",
    icon: (
      <svg width="28" height="28" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    href: "/profile/settings/privacy",
    color: "#e8363a",
    label: "PRIVACI-\nDAD",
    icon: (
      <svg width="28" height="28" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
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
            CONFIGURACIÓN
          </h1>
        </div>
        <ZigzagBorder />
      </header>

      <div className="px-4 pt-5 pb-10">
        {/* 2×2 tile grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {settingsTiles.map(tile => (
            <Link key={tile.href} href={tile.href}>
              <div
                className="aspect-square rounded-2xl flex flex-col items-start justify-end p-4 gap-3 active:opacity-80 transition-opacity"
                style={{ backgroundColor: tile.color }}
              >
                <div className="opacity-80">{tile.icon}</div>
                <p className="text-sm font-black text-white leading-tight whitespace-pre-line uppercase tracking-wide">
                  {tile.label}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Separator */}
        <div className="h-px bg-[#e0dbd4] mx-2 mb-4" />

        {/* Support button */}
        <Link href="/profile/settings/support">
          <div className="w-full py-4 flex items-center justify-center rounded-2xl bg-[#d6d2cc] mb-3 active:opacity-80 transition-opacity">
            <span className="font-black text-sm uppercase tracking-widest text-[#4a4a4a]">SOPORTE</span>
          </div>
        </Link>

        {/* Log out button */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 flex items-center justify-center rounded-2xl bg-[#e8363a] active:opacity-80 transition-opacity"
        >
          <span className="font-black text-sm uppercase tracking-widest text-white">CERRAR SESIÓN</span>
        </button>
      </div>
    </div>
  );
}
