"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { JellyRate } from "@/lib/types";
import { ScoreColor } from "@/components/JellyCard";

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

export default function ExplorePage() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [hot, setHot] = useState<JellyRate[]>([]);
  const [results, setResults] = useState<JellyRate[]>([]);
  const [loading, setLoading] = useState(false);
  const isSearching = query.trim().length > 0;

  useEffect(() => {
    async function loadHot() {
      const { data } = await supabase
        .from("jellyrates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);
      setHot(data ?? []);
    }
    loadHot();
  }, []);

  async function handleSearch(q: string) {
    setQuery(q);
    if (!q.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from("jellyrates")
      .select("*")
      .ilike("title", `%${q}%`)
      .limit(40);
    setResults(data ?? []);
    setLoading(false);
  }

  const displayed = isSearching ? results : hot;

  return (
    <div className="bg-[#f2f1ed] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur shadow-sm">
        <div className="px-4 pt-3.5 pb-2">
          <h1 className="font-black text-sm uppercase tracking-widest text-[#e8363a] text-center mb-3">SEARCH</h1>

          {/* Search field */}
          <div className="flex items-center bg-white border border-[#e0dbd4] rounded-xl px-4 py-2.5 gap-2 focus-within:border-[#e8363a] transition-colors">
            <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="SEARCH PEOPLE, JELLYRATES OR #"
              className="flex-1 text-xs text-[#2a2a2a] placeholder:text-[#ccc] uppercase tracking-wider font-bold"
            />
          </div>
        </div>
        <ZigzagBorder />
      </header>

      {/* "What's Hot" label */}
      {!isSearching && (
        <div className="px-4 pt-5 pb-3 text-center">
          <p className="font-black text-lg uppercase tracking-widest text-[#bbb]">WHAT&apos;S HOT</p>
        </div>
      )}

      {/* Grid — 4 columns like the original */}
      {loading ? (
        <div className="grid grid-cols-4 gap-px bg-[#e8e3dd] p-px">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#f0ede8] animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-[#999] text-xs font-black uppercase tracking-widest">
            {isSearching ? "Sin resultados" : "Sin JellyRates aún"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-px bg-[#e8e3dd]">
          {displayed.map(jelly => (
            <div key={jelly.id} className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
              {jelly.photo_url ? (
                <Image src={jelly.photo_url} alt={jelly.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#ccc] text-[10px] text-center p-1">
                  {jelly.title}
                </div>
              )}
              {/* Score badge — top-left */}
              <div
                className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center text-xs font-black text-white shadow-md"
                style={{
                  backgroundColor: ScoreColor(jelly.score),
                  borderBottomRightRadius: 8,
                }}
              >
                {jelly.score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
