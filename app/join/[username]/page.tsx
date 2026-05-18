"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface InviterProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  total_jellies: number;
}

export default function JoinPage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [inviter, setInviter] = useState<InviterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      // Fetch inviter profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("username", params.username)
        .single();

      if (!profile) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Jellyrate count
      const { count } = await supabase
        .from("jellyrates")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);

      setInviter({ ...profile, total_jellies: count ?? 0 });

      // If already logged in → auto-follow and redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("follows").upsert({
          follower_id: user.id,
          following_id: profile.id,
          status: "accepted",
        });
        router.replace("/feed");
        return;
      }

      setLoading(false);
    }
    load();
  }, [params.username]);

  function handleJoin() {
    localStorage.setItem("invite_from", params.username);
    router.push("/signup");
  }

  function handleLogin() {
    localStorage.setItem("invite_from", params.username);
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#f2f1ed] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e8363a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-dvh bg-[#f2f1ed] flex flex-col items-center justify-center px-6 gap-5">
        <h1 className="text-4xl font-black">
          <span className="text-[#e8363a]">Jelly</span><span className="text-[#2a2a2a]">Rate</span>
        </h1>
        <p className="text-sm text-[#999] text-center">El link de invitación no es válido.</p>
        <Link href="/signup">
          <button className="px-8 py-3.5 rounded-2xl bg-[#e8363a] text-sm font-black text-white uppercase tracking-widest">
            Crear cuenta
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f2f1ed] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <h1 className="text-5xl font-black tracking-tight mb-10">
        <span className="text-[#e8363a]">Jelly</span><span className="text-[#2a2a2a]">Rate</span>
      </h1>

      {/* Inviter card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#e8e3dd] overflow-hidden mb-6">
        {/* Teal header stripe */}
        <div className="bg-[#5bbcb3] px-6 pt-6 pb-10 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-white/30 overflow-hidden flex items-center justify-center font-black text-3xl text-white border-4 border-white/50">
            {inviter?.avatar_url
              ? <Image src={inviter.avatar_url} alt="" width={80} height={80} className="object-cover" unoptimized />
              : (inviter?.username?.[0] ?? "?").toUpperCase()
            }
          </div>
          <div className="text-center">
            <p className="font-black text-white text-lg uppercase tracking-widest">
              {inviter?.username}
            </p>
            {inviter?.full_name && (
              <p className="text-white/70 text-sm">{inviter.full_name}</p>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="-mt-6 mx-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-[#f0ede8]">
          <p className="text-sm text-[#2a2a2a] text-center leading-relaxed">
            <span className="font-black text-[#e8363a]">{inviter?.username}</span> te invita a JellyRate —
            donde las recomendaciones de tus amigos son lo que importa.
          </p>
          {(inviter?.total_jellies ?? 0) > 0 && (
            <p className="text-xs text-[#aaa] text-center mt-2">
              Ya tiene {inviter?.total_jellies} JellyRate{inviter?.total_jellies !== 1 ? "s" : ""} publicados
            </p>
          )}
        </div>

        <div className="px-5 py-5 flex flex-col gap-3">
          <button
            onClick={handleJoin}
            className="w-full py-4 rounded-2xl bg-[#e8363a] text-sm font-black text-white uppercase tracking-widest active:scale-[0.98] transition-transform"
          >
            Unirme a JellyRate
          </button>
          <button
            onClick={handleLogin}
            className="w-full py-3.5 rounded-2xl border border-[#e0dbd4] text-sm font-black text-[#777] uppercase tracking-widest active:scale-[0.98] transition-transform"
          >
            Ya tengo cuenta — Entrar
          </button>
        </div>
      </div>

      {/* Tagline */}
      <p className="text-xs text-[#aaa] text-center max-w-xs leading-relaxed">
        Califica lo que probaste. Ve qué le parece a tu gente. Confía en quienes conoces.
      </p>
    </div>
  );
}
