"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
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

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user: _authUser } } = await supabase.auth.getUser();
      if (!_authUser) { router.push("/login"); return; }
      setUserId(_authUser?.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", _authUser?.id)
        .single();

      if (data) {
        setUsername(data.username ?? "");
        setFullName(data.full_name ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url);
      }
    }
    load();
  }, []);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError(null);

    try {
      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `avatars/${userId}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("jellyrates")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from("jellyrates").getPublicUrl(path);
        newAvatarUrl = publicUrl;
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          username,
          full_name: fullName || null,
          bio: bio || null,
          avatar_url: newAvatarUrl,
        })
        .eq("id", userId);

      if (updateErr) throw updateErr;

      setSuccess(true);
      setTimeout(() => router.back(), 1000);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const displayAvatar = avatarPreview || avatarUrl;

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
            EDITAR PERFIL
          </h1>
        </div>
        <ZigzagBorder />
      </header>

      <div className="px-4 py-6 flex flex-col gap-5">
        {/* Avatar picker */}
        <div className="flex flex-col items-center gap-3">
          <button onClick={() => fileRef.current?.click()} className="relative">
            <div className="w-24 h-24 rounded-full bg-[#ece8e3] border-4 border-white shadow-md overflow-hidden flex items-center justify-center font-black text-3xl text-[#999]"
              style={{ boxShadow: '0 0 0 2px #e0dbd4' }}>
              {displayAvatar ? (
                <Image src={displayAvatar} alt="" width={96} height={96} className="object-cover" />
              ) : (
                (username[0] ?? "?").toUpperCase()
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#e8363a] flex items-center justify-center border-2 border-white">
              <svg width="12" height="12" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
          </button>
          <p className="text-xs text-[#e8363a] font-bold uppercase tracking-widest">Cambiar foto</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-[#999] uppercase tracking-widest">Usuario</label>
          <div className="flex items-center bg-white border border-[#e0dbd4] rounded-xl px-4 py-3 gap-2 focus-within:border-[#e8363a] transition-colors">
            <span className="text-[#bbb] font-bold">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              maxLength={30}
              className="flex-1 text-sm text-[#2a2a2a] bg-transparent"
              placeholder="tunombre"
            />
          </div>
        </div>

        {/* Full name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-[#999] uppercase tracking-widest">Nombre completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={60}
            className="w-full bg-white border border-[#e0dbd4] rounded-xl px-4 py-3 text-sm text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors"
            placeholder="Tu nombre"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-[#999] uppercase tracking-widest">Biografía</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            rows={3}
            className="w-full bg-white border border-[#e0dbd4] rounded-xl px-4 py-3 text-sm text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors resize-none"
            placeholder="Cuéntanos sobre ti..."
          />
          <p className="text-xs text-[#bbb] text-right">{bio.length}/150</p>
        </div>

        {error &&<p className="text-sm text-[#e8363a] font-bold text-center">{error}</p>}
        {success && <p className="text-sm text-[#22c55e] font-bold text-center uppercase tracking-wide">¡Guardado! ✓</p>}

        <button
          onClick={handleSave}
          disabled={saving || !username.trim()}
          className="w-full py-4 rounded-2xl bg-[#e8363a] font-black text-white text-sm uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
