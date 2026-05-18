"use client";

export default function MessagesPage() {
  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* Header */}
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

      {/* Coming soon */}
      <div className="flex flex-col items-center justify-center py-32 px-6 gap-5">
        <div className="w-20 h-20 rounded-3xl bg-white border border-[#e0dbd4] flex items-center justify-center">
          <svg width="36" height="36" fill="none" stroke="#ddd" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-black uppercase tracking-wide text-[#2a2a2a]">Mensajes — Próximamente</p>
          <p className="text-sm text-[#999] mt-1.5 max-w-[240px] leading-snug">
            Podrás chatear con tus amigos y compartir JellyRates directamente.
          </p>
        </div>
      </div>
    </div>
  );
}
