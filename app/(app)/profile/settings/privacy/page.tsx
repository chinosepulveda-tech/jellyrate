"use client";

import { useEffect, useState } from "react";
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

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, description, value, onToggle }: ToggleRowProps) {
  return (
    <div className="mb-4">
      <p className="text-xs text-[#5bbcb3] font-semibold italic px-1 mb-2 leading-snug">
        {description}
      </p>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-[#d6d2cc] transition-all active:opacity-80"
      >
        <span className="text-sm font-black text-white uppercase tracking-wide">{label}</span>
        <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${value ? "bg-white/30" : ""}`}>
          {value && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
}

export default function PrivacyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isPrivate, setIsPrivate] = useState(false);
  const [isPrivateActivity, setIsPrivateActivity] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);

      const { data } = await supabase
        .from("profiles")
        .select("is_private, is_private_activity")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setIsPrivate(data.is_private ?? false);
        setIsPrivateActivity(data.is_private_activity ?? false);
      }
    }
    load();
  }, []);

  async function updateField(field: string, value: boolean) {
    if (!userId) return;
    await supabase.from("profiles").update({ [field]: value }).eq("id", userId);
  }

  async function togglePrivate() {
    const newVal = !isPrivate;
    setIsPrivate(newVal);
    await updateField("is_private", newVal);
  }

  async function togglePrivateActivity() {
    const newVal = !isPrivateActivity;
    setIsPrivateActivity(newVal);
    await updateField("is_private_activity", newVal);
  }

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
            PRIVACIDAD
          </h1>
        </div>
        <ZigzagBorder />
      </header>

      <div className="px-4 pt-6 pb-10">
        <ToggleRow
          label="CUENTA PRIVADA"
          description="Los usuarios deben solicitar tu aprobación antes de seguirte."
          value={isPrivate}
          onToggle={togglePrivate}
        />

        <ToggleRow
          label="ACTIVIDAD PRIVADA"
          description='Tu actividad (likes, favoritos y nuevos seguimientos) no aparecerá en la sección "ACTIVIDAD" de tus seguidores.'
          value={isPrivateActivity}
          onToggle={togglePrivateActivity}
        />
      </div>
    </div>
  );
}
