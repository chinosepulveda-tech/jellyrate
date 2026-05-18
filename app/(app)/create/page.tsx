"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

type Step = "photo" | "rate" | "details" | "posting";
type Audience = "all" | "male" | "female";

const CATEGORIES = ["Comida", "Película", "Bebida", "Lugar", "Música", "Producto", "Libro", "Viaje", "Servicio", "Juego"];

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

  const [userId, setUserId] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("photo");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [score, setScore] = useState(7);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [error, setError] = useState<string | null>(null);

  // Load user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
      else router.push("/login");
    });
  }, []);

  // Canonical item linking
  type Suggestion = { id: string; title: string; category: string | null; avg_score: number; total_ratings: number };
  const [canonicalId, setCanonicalId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [linkedItem, setLinkedItem] = useState<Suggestion | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCanonicals = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const { data } = await supabase
      .from("jellyrates")
      .select("id, title, category, score, canonical_id")
      .is("canonical_id", null)
      .ilike("title", `%${q}%`)
      .limit(5);
    if (!data?.length) { setSuggestions([]); setShowSuggestions(false); return; }
    // Get community stats for these canonical posts
    const ids = data.map((d: any) => d.id);
    const { data: statsData } = await supabase.rpc("get_item_stats", { canonical_ids: ids });
    const statsMap: Record<string, { avg_score: number; total_ratings: number }> = {};
    (statsData ?? []).forEach((s: any) => {
      statsMap[s.canonical_key] = { avg_score: Number(s.avg_score), total_ratings: Number(s.total_ratings) };
    });
    const results: Suggestion[] = data.map((d: any) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      avg_score: statsMap[d.id]?.avg_score ?? d.score,
      total_ratings: statsMap[d.id]?.total_ratings ?? 1,
    }));
    setSuggestions(results);
    setShowSuggestions(true);
  }, [supabase]);

  function handleTitleChange(val: string) {
    setTitle(val);
    // Clear link if user edits the title after linking
    if (linkedItem && val !== linkedItem.title) {
      setLinkedItem(null);
      setCanonicalId(null);
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchCanonicals(val), 300);
  }

  function selectSuggestion(s: Suggestion) {
    setTitle(s.title);
    setCanonicalId(s.id);
    setLinkedItem(s);
    if (s.category) setCategory(s.category);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch {
      // If compression fails, use original
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
    setStep("rate");
  }

  async function handlePost() {
    if (!photoFile || !userId) {
      setError(!userId ? "Sesión expirada, vuelve a iniciar sesión" : "Sin foto");
      return;
    }
    setStep("posting");
    setError(null);

    try {
      const ext = photoFile.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("jellyrates")
        .upload(path, photoFile, { contentType: photoFile.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("jellyrates")
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from("jellyrates").insert({
        user_id: userId,
        photo_url: publicUrl,
        score,
        title: title || `Mi calificación: ${score}/10`,
        description: description || null,
        category: category || null,
        place_name: placeName || null,
        audience,
        privacy: "public",
        canonical_id: canonicalId || null,
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
      <header className="sticky top-0 safe-header z-40 bg-white/98 backdrop-blur shadow-sm">
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
            {/* Title with autocomplete */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#999] uppercase tracking-widest">Título *</label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="¿Qué quieres calificar?"
                  maxLength={80}
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-[#2a2a2a] placeholder:text-[#ccc] focus:border-[#e8363a] transition-colors text-sm ${
                    linkedItem ? "border-[#22c55e] pr-10" : "border-[#e0dbd4]"
                  }`}
                />
                {linkedItem && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22c55e]">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </div>
                )}

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0dbd4] rounded-xl shadow-lg z-50 overflow-hidden">
                    <p className="text-[10px] font-black text-[#bbb] uppercase tracking-widest px-3 pt-2.5 pb-1">
                      Ya calificado por la comunidad
                    </p>
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={() => selectSuggestion(s)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-[#f8f5f2] text-left border-t border-[#f0ede8] first:border-0"
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-black text-sm"
                          style={{ backgroundColor: ScoreColor(s.avg_score) }}
                        >
                          {s.avg_score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#2a2a2a] truncate">{s.title}</p>
                          <p className="text-xs text-[#bbb]">
                            {s.total_ratings} {s.total_ratings === 1 ? "nota" : "notas"}
                            {s.category ? ` · ${s.category}` : ""}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-[#e8363a] uppercase tracking-wide">Vincular</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked item banner */}
              {linkedItem && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl">
                  <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  <p className="text-xs text-[#166534] font-semibold flex-1">
                    Vinculado · tu nota se promediará con {linkedItem.total_ratings} existente{linkedItem.total_ratings !== 1 ? "s" : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setLinkedItem(null); setCanonicalId(null); }}
                    className="text-[#16a34a] text-xs font-black"
                  >
                    ✕
                  </button>
                </div>
              )}
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
