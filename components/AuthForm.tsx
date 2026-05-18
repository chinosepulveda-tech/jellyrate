"use client";

import { useState, CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import OnboardingSlides from "@/components/OnboardingSlides";

// ─── tokens ─────────────────────────────────────────────────────────────────
const JR = {
  red: "#e8363a",
  ink: "#1a1a1a",
  dark: "#2a2a2a",
  cream: "#f2f1ed",
  beige: "#e8e3dd",
  teal: "#5bbcb3",
} as const;

const fontDisplay = "var(--font-archivo), 'Archivo', system-ui, sans-serif";
const fontBody =
  "var(--font-archivo), 'Archivo', 'Helvetica Neue', system-ui, sans-serif";

// ─── chevron pattern ─────────────────────────────────────────────────────────
function chevronStrip(color = JR.beige, bg = JR.cream): CSSProperties {
  return {
    backgroundImage: [
      `linear-gradient(135deg, ${color} 25%, transparent 25%)`,
      `linear-gradient(225deg, ${color} 25%, transparent 25%)`,
      `linear-gradient(315deg, ${color} 25%, transparent 25%)`,
      `linear-gradient(45deg,  ${color} 25%, transparent 25%)`,
    ].join(", "),
    backgroundPosition: "-8px 0, -8px 0, 0 0, 0 0",
    backgroundSize: "16px 16px",
    backgroundColor: bg,
  };
}

// ─── atoms ───────────────────────────────────────────────────────────────────
function Eyebrow({
  children,
  color = JR.dark,
  dot,
}: {
  children: ReactNode;
  color?: string;
  dot?: string;
}) {
  return (
    <div
      style={{
        fontFamily: fontBody,
        fontWeight: 900,
        fontSize: 11,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {dot && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: dot,
            display: "inline-block",
          }}
        />
      )}
      {children}
    </div>
  );
}

function Avatar({
  initials,
  color,
  size = 26,
  rotate = 0,
}: {
  initials: string;
  color: string;
  size?: number;
  rotate?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        color: "#fff",
        fontFamily: fontDisplay,
        fontWeight: 900,
        fontSize: size * 0.42,
        letterSpacing: "-0.02em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid ${JR.ink}`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontFamily: fontBody,
          fontWeight: 900,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: JR.ink,
          opacity: 0.7,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        style={{
          width: "100%",
          height: 46,
          background: "#fff",
          border: `2.5px solid ${JR.ink}`,
          padding: "0 14px",
          fontFamily: fontBody,
          fontWeight: 700,
          fontSize: 15,
          color: JR.ink,
          outline: "none",
          boxSizing: "border-box",
          letterSpacing: "-0.005em",
          borderRadius: 0,
        }}
      />
    </div>
  );
}

function GoogleGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c.71-2.13 2.56-3.97 4.6-3.97z"
      />
    </svg>
  );
}

// ─── AuthForm ─────────────────────────────────────────────────────────────────
export default function AuthForm({
  initialMode = "login",
}: {
  initialMode?: "login" | "signup";
}) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isSignup = mode === "signup";

  // ── submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignup) {
      // Auto-generate username from email
      const autoUsername = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, "");

      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: autoUsername,
            full_name: name,
          },
        },
      });

      if (err) {
        setError(err.message);
        setLoading(false);
      } else {
        setShowOnboarding(true);
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (err) {
        setError("Email o contraseña incorrectos.");
        setLoading(false);
      } else {
        router.push("/feed");
        router.refresh();
      }
    }
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  // ── Onboarding ────────────────────────────────────────────────────────────
  if (showOnboarding) {
    return (
      <OnboardingSlides
        onComplete={() => {
          router.push("/feed");
          router.refresh();
        }}
      />
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: JR.cream,
        display: "flex",
        flexDirection: "column",
        fontFamily: fontBody,
        color: JR.ink,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* status row */}
      <div
        style={{
          padding:
            "max(44px, calc(20px + env(safe-area-inset-top, 0px))) 28px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Eyebrow dot={JR.red}>Bienvenido</Eyebrow>
        <Eyebrow color={JR.dark}>
          {isSignup ? "Crear cuenta" : "Iniciar sesión"}
        </Eyebrow>
      </div>

      {/* chevron */}
      <div
        style={{ ...chevronStrip(JR.beige, JR.cream), height: 24, flexShrink: 0 }}
      />

      {/* hero */}
      <div style={{ padding: "24px 28px 14px" }}>
        {/* wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 0,
          }}
        >
          <span
            style={{
              fontFamily: fontDisplay,
              fontWeight: 900,
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: JR.red,
            }}
          >
            Jelly
          </span>
          <span
            style={{
              fontFamily: fontDisplay,
              fontWeight: 900,
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: JR.ink,
            }}
          >
            Rate.
          </span>
        </div>

        {/* tagline */}
        <div
          style={{
            marginTop: 14,
            textAlign: "center",
            fontFamily: fontBody,
            fontWeight: 800,
            fontSize: 16,
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
            maxWidth: 300,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Lo bueno es lo que{" "}
          <span style={{ color: JR.red }}>recomienda tu gente</span>.
        </div>

        {/* social proof */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginTop: 14,
          }}
        >
          <div style={{ display: "flex" }}>
            {[
              { i: "AN", c: JR.red, r: -6 },
              { i: "JL", c: JR.teal, r: 4 },
              { i: "MR", c: "#e8a83a", r: -3 },
              { i: "SO", c: JR.ink, r: 5 },
            ].map((a, idx) => (
              <div key={idx} style={{ marginLeft: idx === 0 ? 0 : -8 }}>
                <Avatar initials={a.i} color={a.c} size={26} rotate={a.r} />
              </div>
            ))}
          </div>
          <div
            style={{
              fontFamily: fontBody,
              fontWeight: 900,
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: JR.ink,
              opacity: 0.7,
            }}
          >
            +28 amigos ya están adentro
          </div>
        </div>
      </div>

      {/* form area */}
      <div
        style={{
          flex: 1,
          padding: "14px 28px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* segmented toggle */}
        <div
          style={{
            display: "flex",
            border: `2.5px solid ${JR.ink}`,
            background: JR.cream,
            marginBottom: 16,
          }}
        >
          {(
            [
              { key: "login", label: "Entrar" },
              { key: "signup", label: "Crear cuenta" },
            ] as const
          ).map((opt, i) => {
            const active = mode === opt.key;
            return (
              <>
                {i > 0 && (
                  <div
                    key={`div-${i}`}
                    style={{ width: 2.5, background: JR.ink, flexShrink: 0 }}
                  />
                )}
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setMode(opt.key);
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    height: 40,
                    border: "none",
                    background: active ? JR.red : "transparent",
                    color: active ? "#fff" : JR.ink,
                    fontFamily: fontDisplay,
                    fontWeight: 900,
                    fontSize: 12,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "background 200ms ease, color 200ms ease",
                  }}
                >
                  {opt.label}
                </button>
              </>
            );
          })}
        </div>

        {/* fields */}
        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          {isSignup && (
            <FormField
              label="Nombre"
              value={name}
              onChange={setName}
              placeholder="Tu nombre"
            />
          )}
          <FormField
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="tu@email.com"
            type="email"
          />
          <FormField
            label="Contraseña"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            type="password"
          />

          {!isSignup && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: -6,
                marginBottom: 4,
              }}
            >
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: fontBody,
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: JR.ink,
                  opacity: 0.6,
                  padding: 4,
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {error && (
            <div
              style={{
                fontFamily: fontBody,
                fontWeight: 900,
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: JR.red,
                textAlign: "center",
                marginBottom: 8,
                padding: "8px 0",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ flex: 1, minHeight: 8 }} />

          {/* primary CTA */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 56,
              background: loading ? "#c0282b" : JR.red,
              color: "#fff",
              border: `2.5px solid ${JR.ink}`,
              fontFamily: fontDisplay,
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: `4px 4px 0 0 ${JR.ink}`,
              transform: "translateY(0)",
              transition: "transform 80ms ease, box-shadow 80ms ease",
              borderRadius: 0,
              opacity: loading ? 0.7 : 1,
            }}
            onMouseDown={(e) => {
              if (loading) return;
              e.currentTarget.style.transform = "translate(2px, 2px)";
              e.currentTarget.style.boxShadow = `2px 2px 0 0 ${JR.ink}`;
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `4px 4px 0 0 ${JR.ink}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `4px 4px 0 0 ${JR.ink}`;
            }}
          >
            {loading
              ? isSignup
                ? "Creando cuenta..."
                : "Entrando..."
              : isSignup
              ? "Crear cuenta"
              : "Entrar"}
          </button>
        </form>

        {/* divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "14px 0 12px",
          }}
        >
          <div style={{ flex: 1, height: 2, background: JR.beige }} />
          <div
            style={{
              fontFamily: fontBody,
              fontWeight: 900,
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: JR.ink,
              opacity: 0.5,
            }}
          >
            o
          </div>
          <div style={{ flex: 1, height: 2, background: JR.beige }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          style={{
            width: "100%",
            height: 52,
            background: "#fff",
            color: JR.ink,
            border: `2.5px solid ${JR.ink}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            cursor: "pointer",
            fontFamily: fontDisplay,
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            borderRadius: 0,
          }}
        >
          <GoogleGlyph />
          <span>Continuar con Google</span>
        </button>

        {/* footer */}
        <div
          style={{
            fontFamily: fontBody,
            fontWeight: 600,
            fontSize: 10,
            color: JR.ink,
            opacity: 0.55,
            textAlign: "center",
            padding: `14px 8px calc(18px + env(safe-area-inset-bottom, 0px))`,
            lineHeight: 1.5,
            letterSpacing: "0.02em",
          }}
        >
          Al continuar aceptas los{" "}
          <a
            href="/terms"
            style={{ textDecoration: "underline", color: "inherit" }}
          >
            Términos
          </a>{" "}
          y la{" "}
          <a
            href="/privacy"
            style={{ textDecoration: "underline", color: "inherit" }}
          >
            Política de Privacidad
          </a>
          .
        </div>
      </div>
    </div>
  );
}
