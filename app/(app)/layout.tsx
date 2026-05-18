import BottomNav from "@/components/BottomNav";
import { ToastProvider } from "@/components/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="max-w-[480px] mx-auto min-h-dvh bg-[#f2f1ed] relative">
        <main style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
