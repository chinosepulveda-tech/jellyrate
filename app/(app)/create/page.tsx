"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Step = "photo" | "rate" | "details" | "posting";
type Audience = "all" | "male" | "female";

const CATEGORIES = ["🍽️ Comida", "🎬 Película", "🍷 Bebida", "📍 Lugar", "🎵 Música", "📦 Producto", "📚 Libro", "✈️ Viaje", "💊 Servicio", "🎮 Juego"];

function ScoreColor(score: number) {
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "#f59e0b";
  if (score >= 4) return "#f97316";
  return "#e8363a";
}

function ScoreLabel(score: number) {
  if (score >= 9) return "¡Increíble!";
  if (score >= 8) return "Muy bueno";
  if (score >= 7) return "Bueno";
  if (score >= 6) return "Aceptable";
  if (score >= 5) return "Regular";
  if (score >= 4) return "Mala";
  if (score >= 3) return "Muy mala";
  return "Terrible";
}

export default function CreatePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("photo");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [score, setScore] = useState(7);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "followers">("public");
  const [audience, setAudience] = useState<Audience>("all");
  const [error, setError] = useState<string | null>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStep("rate");
  }

  async function handlePost() {
    if (!photoFile) return;
    setStep("posting");
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("No autenticado");

      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("jellyrates")
        .upload(path, photoFile, { contentType: photoFile.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("jellyrates")
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from("jellyrates").insert({
        user_id: user.id,
        photo_url: publicUrl,
        score,
        title: title || `Mi calificación: ${score}/10`,
        description: description || null,
        category: category || null,
        place_name: placeName || null,
        audience,
        privacy,
      });

      if (insertError) throw insertError;

      router.push("/feed");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al publicar");
      setStep("details");
    }
  }

  const goBack = () => {
    if (step === "photo") router.back();
    else if (step === "rate") setStep("photo");
    else if (step === "details") setStep("rate");
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#f2f1ed]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button onClick={goBack} className="text-[#999] text-sm font-semibold w-16">
            {step === "photo" ? "Cancelar" : "← Atrás"}
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a]">
            {step === "photo" ? "Nueva Nota" : step === "rate" ? "Tu Nota" : step === "details" ? "Detalles" : "Publicando..."}
          </h1>
          <div className="w-16" />
        </div>
        {/* Zigzag */}
        <div className="h-2" style={{
          backgroundImage: `linear-gradient(135deg, #e8e3dd 25%, transparent 25%) -8px 0,
            linear-gradient(225deg, #e8e3dd 25%, transparent 25%) -8px 0,
            linear-gradient(315deg, #e8e3dd 25%, transparent 25%),
            linear-gradient(45deg, #e8e3dd 25%, transparent 25%)`,
          backgroundSize: '16px 16px',
          backgroundColor: '#f2f1ed',
        }} />
      </header>

      {/* Step: Photo */}
      {step === "photo" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-square max-w-xs rounded-3xl border-2 border-dashed border-[#d5d0ca] flex flex-col items-center justify-center gap-4 bg-white active:border-[#e8363a] transition-colors cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#f0ede8] flex items-center justify-center">
              <svg width="28" height="28" fill="none" stroke="#e8363a" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-black text-[#2a2a2a] uppercase tracking-wide">Elige una foto</p>
              <p className="text-sm text-[#999] mt-1">Toca para abrir la cámara o librería</p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <p className="text-xs text-[#bbb] text-center">
            Foto de lo que quieres calificar — un plato, un producto, un lugar...
          </p>
        </div>
      )}

      {/* Step: Rate */}
      {step === "rate" && photoPreview && (
        <div className="flex-1 flex flex-col">
          <div className="relative aspect-square bg-[#f0ede8]">
            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
            {/* Live score badge */}
            <div
              className="absolute bottom-0 left-0 flex flex-col items-center justify-center shadow-2xl transition-colors"
              style={{
                backgroundColor: ScoreColor(score),
                width: 64, height: 64,
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <span className="text-3xl font-black text-white leading-none">{score}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center px-6 gap-6 bg-white">
            <div className="text-center">
              <p className="text-6xl font-black" style={{ color: ScoreColor(score) }}>{score}</p>
              <p className="text-lg font-black text-[#999] uppercase tracking-widest mt-1">{ScoreLabel(score)}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-[#bbb]">1</span>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-black text-[#bbb]">10</span>
            </div>

            <button
              onClick={() => setStep("details")}
              className="w-full py-4 rounded-2xl bg-[#e8363a] font-black text-white text-base uppercase tracking-widest active:scale-[0.98] transition-transform"
            >
              Continuar {score}/10 →
            </button>
          </div>
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && photoPreview && (
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Mini preview */}
          <div className="flex items-start gap-3 px-4 py-4 border-b border-[#e8e3dd] bg-white">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={photoPreview} alt="Preview" fill className="object-cover" />
              <div
                className="absolute bottom-0 left-0 w-7 h-7 flex items-center justify-center text-xs font-black text-white"
                style={{
                  backgroundColor: ScoreColor(score),
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                }}
              >
                {score}
              </div>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-[#999] uppercase font-bold tracking-wider">Tu nota</p>
              <p className="text-3xl font-black" style={{ color: ScoreColor(score) }}>{score}/10</p>
              <p className="text-xs font-black uppercase tracking-widest text-[#999]">{ScoreLabel(score)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 px-4 py-5">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#999] uppercase tracking-widest">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Qué estás calificando?"
                maxLength={80}
                className="w-full bg-white border border-[#e0dbd4] rounded-xl px-4 py-3 text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors text-sm"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#999] uppercase tracking-widest">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(category === cat ? "" : cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      category === cat
                        ? "bg-[#e8363a] border-[#e8363a] text-white"
                        : "bg-white border-[#e0dbd4] text-[#777]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#999] uppercase tracking-widest">Para quién es</label>
              <div className="flex gap-2">
                {([
                  { value: "all", label: "Todos" },
                  { value: "male", label: "♂ Hombres" },
                  { value: "female", label: "♀ Mujeres" },
                ] as { value: Audience; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAudience(value)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-colors uppercase tracking-wide ${
                      audience === value
                        ? "bg-[#5bbcb3] border-[#5bbcb3] text-white"
                        : "bg-white border-[#e0dbd4] text-[#777]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#999] uppercase tracking-widest">Comentario</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Por qué esta nota? (opcional)"
                maxLength={300}
                rows={3}
                className="w-full bg-white border border-[#e0dbd4] rounded-xl px-4 py-3 text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors text-sm resize-none"
              />
            </div>

            {/* Place */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#999] uppercase tracking-widest">Lugar (opcional)</label>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Nombre del lugar o ciudad"
                className="w-full bg-white border border-[#e0dbd4] rounded-xl px-4 py-3 text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors text-sm"
              />
            </div>

            {/* Privacy */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#999] uppercase tracking-widest">Visibilidad</label>
              <div className="flex gap-2">
                {[["public", "🌍 Todos"], ["followers", "👥 Seguidores"]].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPrivacy(val as "public" | "followers")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                      privacy === val
                        ? "bg-[#e8363a] border-[#e8363a] text-white"
                        : "bg-white border-[#e0dbd4] text-[#777]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-[#e8363a] text-center font-semibold">{error}</p>}

            <button
              onClick={handlePost}
              disabled={!title.trim()}
              className="w-full py-4 rounded-2xl bg-[#e8363a] font-black text-white text-sm uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              Publicar JellyRate ⚡
            </button>
          </div>
        </div>
      )}

      {/* Step: Posting */}
      {step === "posting" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-[#e8363a] flex items-center justify-center animate-pulse">
            <span className="text-3xl">⚡</span>
          </div>
          <p className="font-black uppercase tracking-widest text-[#2a2a2a]">Publicando...</p>
        </div>
      )}
    </div>
  );
}
