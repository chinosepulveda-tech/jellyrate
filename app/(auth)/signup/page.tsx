"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import OnboardingSlides from "@/components/OnboardingSlides";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError(null);

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
    } else {
      setShowOnboarding(true);
    }
  }

  if (showOnboarding) {
    return (
      <OnboardingSlides
        onComplete={() => {
          router.push("/feed");
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Logo */}
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight">
          <span className="text-[#e8363a]">Jelly</span><span className="text-[#2a2a2a]">Rate</span>
        </h1>
        <p className="mt-2 text-xs font-black text-[#999] uppercase tracking-widest">
          {step === 1 ? "SIGN UP" : "ELIGE TU USUARIO"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[#e8363a]" />
        <div className={`flex-1 h-1.5 rounded-full transition-colors ${step === 2 ? "bg-[#e8363a]" : "bg-[#d5d0ca]"}`} />
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {step === 1 ? (
          <>
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
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                className="w-full rounded-xl bg-white border border-[#e0dbd4] px-4 py-3.5 text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-[#999] uppercase tracking-widest">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full rounded-xl bg-white border border-[#e0dbd4] px-4 py-3.5 text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-[#999] uppercase tracking-widest">Username</label>
              <div className="flex items-center bg-white border border-[#e0dbd4] rounded-xl px-4 py-3.5 gap-2 focus-within:border-[#e8363a] transition-colors">
                <span className="text-[#bbb] font-bold text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                  placeholder="tunombre"
                  required
                  className="flex-1 text-sm text-[#2a2a2a] placeholder:text-[#ccc]"
                />
              </div>
              <p className="text-xs text-[#bbb] font-semibold">Solo letras, números, puntos y guiones bajos</p>
            </div>
          </>
        )}

        {error && <p className="text-xs text-[#e8363a] font-black text-center uppercase tracking-wide">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#e8363a] py-4 text-sm font-black text-white uppercase tracking-widest disabled:opacity-50 active:scale-[0.98] transition-all mt-2"
        >
          {loading ? "Creando cuenta..." : step === 1 ? "SIGUIENTE →" : "CREAR CUENTA"}
        </button>

        {step === 2 && (
          <button type="button" onClick={() => setStep(1)} className="text-xs font-black text-[#999] text-center uppercase tracking-widest">
            ← Volver
          </button>
        )}
      </form>

      <p className="text-center text-xs font-black text-[#999] uppercase tracking-widest">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#e8363a]">LOGIN</Link>
      </p>
    </div>
  );
}
