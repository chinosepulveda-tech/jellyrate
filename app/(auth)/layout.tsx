export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#f2f1ed] px-6">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
