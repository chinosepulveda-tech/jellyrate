"use client";

import { useRouter } from "next/navigation";

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

const links = [
  { label: "FEEDBACK", href: "mailto:hola@jellyrate.com?subject=Feedback" },
  { label: "CALIFICAR LA APP", href: "#" },
  { label: "POLÍTICA DE PRIVACIDAD", href: "#" },
  { label: "TÉRMINOS DE SERVICIO", href: "#" },
  { label: "SOBRE NOSOTROS", href: "#" },
];

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f2f1ed]">
      <header className="sticky top-0 safe-header z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center px-4 py-3.5 gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8363a]">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a] flex-1 text-center mr-10">
            SOPORTE
          </h1>
        </div>
        <ZigzagBorder />
      </header>

      <div className="px-4 pt-5 pb-10">
        {/* Video tiles */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 aspect-[3/2] rounded-2xl bg-[#e8363a] flex items-center gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-xs font-black text-white uppercase tracking-wide leading-tight">¿POR QUÉ<br/>JELLYRATE?</p>
          </div>
          <div className="flex-1 aspect-[3/2] rounded-2xl bg-[#5bbcb3] flex items-center gap-3 px-4">
            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-xs font-black text-white uppercase tracking-wide leading-tight">¿CÓMO<br/>FUNCIONA?</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          {links.map(link => (
            <a key={link.label} href={link.href}>
              <div className="w-full py-4 flex items-center justify-center rounded-2xl bg-[#d6d2cc] active:opacity-80 transition-opacity">
                <span className="font-black text-xs uppercase tracking-widest text-[#4a4a4a]">{link.label}</span>
              </div>
            </a>
          ))}
        </div>

        <p className="text-center text-xs text-[#bbb] font-semibold mt-8 uppercase tracking-widest">Versión 2.0</p>
      </div>
    </div>
  );
}
