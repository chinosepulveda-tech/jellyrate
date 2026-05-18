"use client";

import { useState, useEffect, useRef, CSSProperties, ReactNode } from "react";
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

// ─── StepBar — progress indicator for signup ─────────────────────────────────
function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {[1, 2].map((n) => (
        <div
          key={n}
          style={{
            flex: 1,
            height: 4,
            background: n <= step ? JR.red : JR.beige,
            border: `1.5px solid ${JR.ink}`,
            transition: "background 250ms ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── username availability status ─────────────────────────────────────────────
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "short";

function UsernameHint({ status }: { status: UsernameStatus }) {
  if (status === "idle") return null;

  const configs = {
    checking: { text: "Verificando...", color: JR.ink, opacity: 0.45 },
    available: { text: "✓ Disponible", color: JR.teal, opacity: 1 },
    taken: { text: "✗ Ya está tomado", color: JR.red, opacity: 1 },
    short: { text: "Mínimo 3 caracteres", color: JR.ink, opacity: 0.45 },
  };

  const cfg = configs[status];
  return (
    <div
      style={{
        fontFamily: fontBody,
        fontWeight: 800,
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: cfg.color,
        opacity: cfg.opacity,
        marginTop: 6,
      }}
    >
      {cfg.text}
    </div>
  );
}

// ─── primary CTA button ───────────────────────────────────────────────────────
function CTAButton({
  onClick,
  disabled,
  label,
}: {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 56,
        background: disabled ? "#ccc" : JR.red,
        color: disabled ? "#888" : "#fff",
        border: `2.5px solid ${JR.ink}`,
        fontFamily: fontDisplay,
        fontWeight: 900,
        fontSize: 16,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : `4px 4px 0 0 ${JR.ink}`,
        transform: "translateY(0)",
        transition: "transform 80ms ease, box-shadow 80ms ease, background 150ms ease",
        borderRadius: 0,
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translate(2px, 2px)";
        e.currentTarget.style.boxShadow = `2px 2px 0 0 ${JR.ink}`;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `4px 4px 0 0 ${JR.ink}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        if (!disabled) e.currentTarget.style.boxShadow = `4px 4px 0 0 ${JR.ink}`;
      }}
    >
      {label}
    </button>
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
  const [signupStep, setSignupStep] = useState<1 | 2>(1);

  // step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // step 2 field
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isSignup = mode === "signup";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── username availability check (debounced 450ms) ─────────────────────────
  useEffect(() => {
    if (!isSignup || signupStep !== 2) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const clean = username.trim();
    if (!clean) { setUsernameStatus("idle"); return; }
    if (clean.length < 3) { setUsernameStatus("short"); return; }

    setUsernameStatus("checking");

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", clean)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, isSignup, signupStep]);

  // ── switch mode → reset signup state ─────────────────────────────────────
  function switchMode(m: "login" | "signup") {
    setMode(m);
    setSignupStep(1);
    setError(null);
    setUsername("");
    setUsernameStatus("idle");
  }

  // ── step 1 submit ─────────────────────────────────────────────────────────
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSignup) {
      if (!name.trim()) { setError("Ingresa tu nombre."); return; }
      if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
      setSignupStep(2);
    } else {
      setLoading(true);
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError("Email o contraseña incorrectos.");
        setLoading(false);
      } else {
        router.push("/feed");
        router.refresh();
      }
    }
  }

  // ── step 2 submit (create account) ───────────────────────────────────────
  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (usernameStatus !== "available") return;
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          full_name: name.trim(),
        },
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setShowOnboarding(true);
    }
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  // ── onboarding ────────────────────────────────────────────────────────────
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

  // ── shared shell ──────────────────────────────────────────────────────────
  const isStep2 = isSignup && signupStep === 2;

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
          padding: "max(44px, calc(20px + env(safe-area-inset-top, 0px))) 28px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Eyebrow dot={JR.red}>
          {isStep2 ? "Elige tu usuario" : "Bienvenido"}
        </Eyebrow>
        {!isStep2 && (
          <Eyebrow color={JR.dark}>
            {isSignup ? "Crear cuenta" : "Iniciar sesión"}
          </Eyebrow>
        )}
      </div>

      {/* chevron */}
      <div style={{ ...chevronStrip(JR.beige, JR.cream), height: 24, flexShrink: 0 }} />

      {/* hero */}
      <div style={{ padding: "24px 28px 14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
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
          Descubre lo que realmente opina{" "}
          <span style={{ color: JR.red }}>la gente en la que confías</span>.
        </div>

      </div>

      {/* ── form area ── */}
      <div
        style={{
          flex: 1,
          padding: "14px 28px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* segmented toggle — hidden on step 2 */}
        {!isStep2 && (
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
                <div key={opt.key} style={{ display: "contents" }}>
                  {i > 0 && (
                    <div style={{ width: 2.5, background: JR.ink, flexShrink: 0 }} />
                  )}
                  <button
                    type="button"
                    onClick={() => switchMode(opt.key)}
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
                </div>
              );
            })}
          </div>
        )}

        {/* step progress bar — only signup */}
        {isSignup && <StepBar step={signupStep} />}

        {/* ── STEP 1: login / signup base fields ── */}
        {!isStep2 && (
          <form onSubmit={handleStep1} style={{ display: "contents" }}>
            {isSignup && (
              <FormField label="Nombre" value={name} onChange={setName} placeholder="Tu nombre" />
            )}
            <FormField label="Email" value={email} onChange={setEmail} placeholder="tu@email.com" type="email" />
            <FormField label="Contraseña" value={password} onChange={setPassword} placeholder="••••••••" type="password" />

            {!isSignup && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6, marginBottom: 4 }}>
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

            <CTAButton
              label={
                loading ? "Entrando..." : isSignup ? "Siguiente →" : "Entrar"
              }
              disabled={loading}
            />
          </form>
        )}

        {/* ── STEP 2: username picker ── */}
        {isStep2 && (
          <form onSubmit={handleStep2} style={{ display: "contents" }}>
            {/* username field */}
            <div style={{ marginBottom: 4 }}>
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
                Usuario
              </div>

              {/* input with @ prefix */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 46,
                  background: "#fff",
                  border: `2.5px solid ${
                    usernameStatus === "available"
                      ? JR.teal
                      : usernameStatus === "taken"
                      ? JR.red
                      : JR.ink
                  }`,
                  transition: "border-color 200ms ease",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    fontFamily: fontBody,
                    fontWeight: 700,
                    fontSize: 15,
                    color: JR.ink,
                    opacity: 0.4,
                    paddingLeft: 14,
                    paddingRight: 2,
                    userSelect: "none",
                  }}
                >
                  @
                </span>
                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "")
                    )
                  }
                  placeholder="tunombre"
                  autoFocus
                  maxLength={20}
                  style={{
                    flex: 1,
                    height: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: fontBody,
                    fontWeight: 700,
                    fontSize: 15,
                    color: JR.ink,
                    letterSpacing: "-0.005em",
                    paddingRight: 14,
                  }}
                />
              </div>

              <UsernameHint status={usernameStatus} />

              <div
                style={{
                  fontFamily: fontBody,
                  fontWeight: 600,
                  fontSize: 10,
                  color: JR.ink,
                  opacity: 0.4,
                  marginTop: 6,
                  letterSpacing: "0.04em",
                }}
              >
                Solo letras, números, puntos y guiones bajos
              </div>
            </div>

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
                  padding: "8px 0",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ flex: 1, minHeight: 16 }} />

            <CTAButton
              label={loading ? "Creando cuenta..." : "Crear cuenta"}
              disabled={
                loading ||
                usernameStatus !== "available"
              }
            />

            {/* back link */}
            <button
              type="button"
              onClick={() => { setSignupStep(1); setError(null); }}
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
                opacity: 0.5,
                padding: "12px 0 4px",
                alignSelf: "center",
              }}
            >
              ← Volver
            </button>
          </form>
        )}

        {/* divider + Google — solo en step 1 */}
        {!isStep2 && (
          <>
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
          </>
        )}

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
          <a href="/terms" style={{ textDecoration: "underline", color: "inherit" }}>
            Términos
          </a>{" "}
          y la{" "}
          <a href="/privacy" style={{ textDecoration: "underline", color: "inherit" }}>
            Política de Privacidad
          </a>
          .
        </div>
      </div>
    </div>
  );
}
