"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/feed",
      label: "Feed",
      icon: (active: boolean) => (
        <svg width="24" height="24" fill={active ? "#e8363a" : "none"} stroke={active ? "#e8363a" : "#c8c3bc"} strokeWidth={active ? 2.5 : 1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      href: "/explore",
      label: "Buscar",
      icon: (active: boolean) => (
        <svg width="24" height="24" fill="none" stroke={active ? "#e8363a" : "#c8c3bc"} strokeWidth={active ? 2.5 : 1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
        </svg>
      ),
    },
    {
      href: "/create",
      label: "",
      icon: () => (
        <div className="w-[52px] h-[52px] rounded-2xl bg-[#e8363a] flex items-center justify-center -mt-4 shadow-xl shadow-[#e8363a]/40 active:scale-95 transition-transform">
          <svg width="24" height="24" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      ),
    },
    {
      href: "/messages",
      label: "Mensajes",
      icon: (active: boolean) => (
        <svg width="24" height="24" fill={active ? "#e8363a" : "none"} stroke={active ? "#e8363a" : "#c8c3bc"} strokeWidth={active ? 2.5 : 1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
    {
      href: "/profile",
      label: "Perfil",
      icon: (active: boolean) => (
        <svg width="24" height="24" fill={active ? "#e8363a" : "none"} stroke={active ? "#e8363a" : "#c8c3bc"} strokeWidth={active ? 2.5 : 1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/98 backdrop-blur border-t border-[#ede9e3] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
      <div
        className="flex items-end justify-around px-1 pt-2"
        style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
      >
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href + "/"));
          const isCreate = tab.href === "/create";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 min-w-[44px] relative ${
                isCreate ? "" : active ? "text-[#e8363a]" : "text-[#c8c3bc]"
              }`}
            >
              <div className="relative">
                {tab.icon(active)}
                {/* Unread badge */}
                {"badge" in tab && (tab as any).badge > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e8363a] border-2 border-white flex items-center justify-center">
                    <span className="text-[8px] font-black text-white leading-none">
                      {(tab as any).badge > 9 ? "9+" : (tab as any).badge}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
