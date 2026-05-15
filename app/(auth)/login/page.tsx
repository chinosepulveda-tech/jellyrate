"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
    } else {
      router.push("/feed");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Logo */}
      <div className="text-center mb-2">
        <h1 className="text-5xl font-black tracking-tight">
          <span className="text-[#e8363a]">Jelly</span><span className="text-[#2a2a2a]">Rate</span>
        </h1>
        <p className="mt-2 text-xs font-black text-[#999] uppercase tracking-widest">Rate anything. Trust your people.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-[#999] uppercase tracking-widest">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="w-full rounded-xl bg-white border border-[#e0dbd4] px-4 py-3.5 text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-[#999] uppercase tracking-widest">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-xl bg-white border border-[#e0dbd4] px-4 py-3.5 text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors text-sm"
          />
        </div>

        {error && (
          <p className="text-xs text-[#e8363a] font-bold text-center uppercase tracking-wide">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#e8363a] py-4 text-sm font-black text-white uppercase tracking-widest disabled:opacity-50 transition-opacity active:scale-[0.98] mt-2"
        >
          {loading ? "Entrando..." : "LOGIN"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#d5d0ca]" />
        <span className="text-xs font-black text-[#bbb] uppercase">o</span>
        <div className="flex-1 h-px bg-[#d5d0ca]" />
      </div>

      {/* Google */}
      <button
        onClick={async () => {
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
        }}
        className="w-full rounded-xl bg-white border border-[#e0dbd4] py-3.5 text-xs font-black text-[#2a2a2a] uppercase tracking-widest flex items-center justify-center gap-3 active:bg-[#f5f5f5] transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        Continuar con Google
      </button>

      {/* Sign up link */}
      <p className="text-center text-xs font-black text-[#999] uppercase tracking-widest">
        ¿Sin cuenta?{" "}
        <Link href="/signup" className="text-[#e8363a]">
          Crear una
        </Link>
      </p>
    </div>
  );
}
