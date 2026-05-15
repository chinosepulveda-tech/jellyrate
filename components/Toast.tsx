"use client";

import { useEffect, useState, createContext, useContext, useCallback, useRef } from "react";

interface ToastItem {
  id: number;
  message: string;
  icon?: string;
  type?: "default" | "success" | "error";
}

interface ToastContextValue {
  show: (message: string, icon?: string, type?: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, icon = "✓", type: ToastItem["type"] = "default") => {
    const id = ++toastCounter;
    setToasts(prev => [...prev.slice(-2), { id, message, icon, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-safe top-4 left-1/2 -translate-x-1/2 z-[500] flex flex-col items-center gap-2 pointer-events-none w-full max-w-[340px] px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md text-sm font-black uppercase tracking-wide
              animate-[slideDown_0.25s_ease-out]
              ${t.type === "error" ? "bg-[#e8363a] text-white" : t.type === "success" ? "bg-[#16a34a] text-white" : "bg-[#2a2a2a]/90 text-white"}`}
            style={{ animation: "slideDown 0.25s ease-out" }}
          >
            <span className="text-base">{t.icon}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
