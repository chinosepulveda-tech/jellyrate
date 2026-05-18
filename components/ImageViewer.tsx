"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ScoreColor, ScoreLabel } from "@/components/JellyCard";

interface Props {
  src: string;
  title: string;
  score: number;
  username: string;
  onClose: () => void;
}

export default function ImageViewer({ src, title, score, username, onClose }: Props) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-10"
        onClick={e => e.stopPropagation()}>
        <div className="flex flex-col">
          <span className="font-black text-xs uppercase tracking-widest text-white/70">@{username}</span>
          <span className="font-black text-sm text-white truncate max-w-[240px]">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm"
        >
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image */}
      <div className="w-full max-w-[480px] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} className="w-full h-auto max-h-[80vh] object-contain" />
      </div>

      {/* Score bar */}
      <div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-md"
        style={{ backgroundColor: `${ScoreColor(score)}cc` }}
        onClick={e => e.stopPropagation()}
      >
        <span className="text-4xl font-black text-white leading-none">{score}</span>
        <div>
          <p className="text-xs font-black text-white/80 uppercase tracking-widest">Score</p>
          <p className="text-base font-black text-white">{ScoreLabel(score)}</p>
        </div>
      </div>
    </div>
  );
}
