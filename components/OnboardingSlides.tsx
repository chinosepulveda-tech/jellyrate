"use client";

import { useState, useRef, useEffect, CSSProperties, ReactNode } from "react";

// ─── palette & typography ───────────────────────────────────────────────────
const JR = {
  red: "#e8363a",
  dark: "#2a2a2a",
  cream: "#f2f1ed",
  beige: "#e8e3dd",
  teal: "#5bbcb3",
  red2: "#c92a2e",
  ink: "#1a1a1a",
} as const;

// fontDisplay se usa para headings + wordmark — Archivo variable weight 900
// fontWordmark añade font-stretch:expanded para replicar el ancho del Claude Design
const fontDisplay = "var(--font-archivo), 'Archivo', system-ui, sans-serif";
const fontBody = "var(--font-archivo), 'Archivo', 'Helvetica Neue', system-ui, sans-serif";
const fontMono = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace";

const CONTROLS_H = 128;

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

function ScoreChip({
  value,
  color = JR.red,
  fg = "#fff",
  size = "md",
  rotate = 0,
}: {
  value: string | number;
  color?: string;
  fg?: string;
  size?: "xl" | "lg" | "md" | "sm";
  rotate?: number;
}) {
  const dims =
    size === "xl"
      ? { w: 86, fz: 36, bw: 3 }
      : size === "lg"
      ? { w: 60, fz: 24, bw: 2.5 }
      : size === "sm"
      ? { w: 32, fz: 13, bw: 2 }
      : { w: 44, fz: 18, bw: 2 };

  return (
    <div
      style={{
        width: dims.w,
        height: dims.w,
        borderRadius: 999,
        background: color,
        color: fg,
        fontFamily: fontDisplay,
        fontWeight: 900,
        fontSize: dims.fz,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "-0.04em",
        border: `${dims.bw}px solid ${JR.ink}`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        flexShrink: 0,
      }}
    >
      {value}
    </div>
  );
}

function Avatar({
  initials,
  color,
  size = 40,
  ring = JR.ink,
  rotate = 0,
}: {
  initials: string;
  color: string;
  size?: number;
  ring?: string;
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
        border: `2px solid ${ring}`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function PhotoPlaceholder({
  label,
  height = 220,
  tone = "#cfc8bd",
}: {
  label: string;
  height?: number;
  tone?: string;
}) {
  return (
    <div
      style={{
        height,
        width: "100%",
        position: "relative",
        overflow: "hidden",
        background: `repeating-linear-gradient(45deg, ${tone} 0 12px, ${tone}aa 12px 24px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `2.5px solid ${JR.ink}`,
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          fontFamily: fontMono,
          fontSize: 10,
          color: JR.ink,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          background: JR.cream,
          padding: "4px 8px",
          border: `1.5px solid ${JR.ink}`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function JellyBadge({
  children,
  color = JR.red,
  size = 150,
  rotate = -8,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  rotate?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        border: `3.5px solid ${JR.ink}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        color: "#fff",
        textAlign: "center",
        padding: "0 14%",
        transform: `rotate(${rotate}deg)`,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function ScoreBar({ value = 8.7, max = 10 }: { value?: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          height: 14,
          background: JR.cream,
          border: `2px solid ${JR.ink}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            background: JR.red,
            borderRight: `2px solid ${JR.ink}`,
          }}
        />
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${((i + 1) / 10) * 100}%`,
              width: 1,
              background: JR.ink,
              opacity: 0.25,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: fontMono,
          fontSize: 9,
          marginTop: 6,
          color: JR.ink,
          opacity: 0.6,
          letterSpacing: "0.1em",
        }}
      >
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

// ─── slides ──────────────────────────────────────────────────────────────────

function Slide1() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: JR.cream,
        color: JR.ink,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "20px 28px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Eyebrow dot={JR.red}>Bienvenido</Eyebrow>
        <Eyebrow color={JR.ink}>01 / 04</Eyebrow>
      </div>

      <div style={{ ...chevronStrip(JR.beige, JR.cream), height: 28, flexShrink: 0 }} />

      <div
        style={{
          flex: 1,
          padding: "40px 28px 32px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontFamily: fontDisplay,
              fontWeight: 900,
              fontStretch: "expanded",
              fontSize: 104,
              lineHeight: 0.84,
              letterSpacing: "-0.055em",
              color: JR.ink,
            }}
          >
            JELLY
          </div>
          <div
            style={{
              fontFamily: fontDisplay,
              fontWeight: 900,
              fontStretch: "expanded",
              fontSize: 104,
              lineHeight: 0.84,
              letterSpacing: "-0.055em",
              color: JR.red,
              marginTop: 6,
            }}
          >
            RATE.
          </div>
          <div style={{ position: "absolute", top: 130, right: -6 }}>
            <JellyBadge color={JR.red} size={134} rotate={9}>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 46,
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                }}
              >
                9.4
              </div>
              <div
                style={{
                  fontFamily: fontBody,
                  fontWeight: 900,
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  marginTop: 6,
                }}
              >
                SEGÚN ANA
              </div>
            </JellyBadge>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ marginTop: 32 }}>
          <Eyebrow color={JR.red}>● La premisa</Eyebrow>
          <p
            style={{
              fontFamily: fontBody,
              fontWeight: 800,
              fontSize: 24,
              lineHeight: 1.15,
              color: JR.ink,
              letterSpacing: "-0.015em",
              margin: "14px 0 0",
              maxWidth: 320,
            }}
          >
            Las únicas notas que importan son las de{" "}
            <span style={{ color: JR.red }}>la gente que conoces</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Slide2() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: JR.cream,
        color: JR.ink,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* dark panel */}
      <div
        style={{
          background: JR.ink,
          color: "#fff",
          position: "relative",
          padding: "60px 28px 36px",
          overflow: "hidden",
        }}
      >
        <Eyebrow color="#fff" dot="#666">
          Lo de siempre
        </Eyebrow>

        <div
          style={{
            fontFamily: fontDisplay,
            fontWeight: 900,
            fontSize: 54,
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
            marginTop: 18,
            color: "#666",
            position: "relative",
            display: "inline-block",
          }}
        >
          ALGORITMOS.
          <div
            style={{
              position: "absolute",
              left: -6,
              right: -6,
              top: "52%",
              height: 6,
              background: JR.red,
              transform: "rotate(-2deg)",
            }}
          />
        </div>

        <br />

        <div
          style={{
            fontFamily: fontDisplay,
            fontWeight: 900,
            fontSize: 54,
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
            marginTop: 12,
            color: "#666",
            position: "relative",
            display: "inline-block",
          }}
        >
          DESCONOCIDOS.
          <div
            style={{
              position: "absolute",
              left: -6,
              right: -6,
              top: "52%",
              height: 6,
              background: JR.red,
              transform: "rotate(1.5deg)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 28,
            opacity: 0.45,
            transform: "rotate(-2deg) translateX(-12px)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: "#3a3a3a",
                border: "2px solid #555",
                height: 60,
                padding: 8,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ height: 6, background: "#555", width: "70%" }} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <div style={{ height: 4, background: "#555", width: "40%" }} />
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: "#555",
                    fontFamily: fontDisplay,
                    fontSize: 9,
                    color: "#888",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ?.?
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...chevronStrip(JR.beige, JR.cream), height: 24, flexShrink: 0 }} />

      {/* light panel */}
      <div
        style={{
          flex: 1,
          padding: "32px 28px 36px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Eyebrow color={JR.red} dot={JR.red}>
          Lo que sí funciona
        </Eyebrow>

        <div
          style={{
            fontFamily: fontDisplay,
            fontWeight: 900,
            fontSize: 64,
            lineHeight: 0.88,
            letterSpacing: "-0.05em",
            marginTop: 14,
            color: JR.ink,
          }}
        >
          TU GENTE.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 22,
            alignItems: "center",
            paddingLeft: 4,
          }}
        >
          {[
            { i: "AN", c: JR.red, r: -8 },
            { i: "JL", c: JR.teal, r: 5 },
            { i: "MR", c: JR.ink, r: -4 },
            { i: "SO", c: "#e8a83a", r: 7 },
            { i: "DV", c: JR.red2, r: -6 },
          ].map((a, idx) => (
            <div key={idx} style={{ marginLeft: idx === 0 ? 0 : -10 }}>
              <Avatar initials={a.i} color={a.c} size={48} rotate={a.r} />
            </div>
          ))}
          <div
            style={{
              marginLeft: 12,
              fontFamily: fontBody,
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: "0.16em",
              color: JR.ink,
              textTransform: "uppercase",
            }}
          >
            +28 más
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <p
          style={{
            fontFamily: fontBody,
            fontWeight: 700,
            fontSize: 18,
            lineHeight: 1.25,
            color: JR.ink,
            margin: 0,
            maxWidth: 320,
            letterSpacing: "-0.005em",
          }}
        >
          Las recomendaciones que de verdad usas vienen de quienes te conocen.
          Acá las tienes todas en un lugar.
        </p>
      </div>
    </div>
  );
}

function StepCard({
  n,
  label,
  title,
  color,
  fg = "#fff",
  rotate = 0,
  children,
}: {
  n: string;
  label: string;
  title: string;
  color: string;
  fg?: string;
  rotate?: number;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        background: color,
        color: fg,
        border: `2.5px solid ${JR.ink}`,
        padding: "18px 18px 18px 22px",
        display: "flex",
        alignItems: "center",
        gap: 18,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        position: "relative",
      }}
    >
      <div
        style={{
          fontFamily: fontDisplay,
          fontWeight: 900,
          fontSize: 72,
          lineHeight: 0.82,
          letterSpacing: "-0.06em",
          minWidth: 60,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontBody,
            fontWeight: 900,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: fontDisplay,
            fontWeight: 900,
            fontSize: 26,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            marginTop: 4,
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ width: 64, height: 64, flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Slide3() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: JR.cream,
        color: JR.ink,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "20px 28px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Eyebrow dot={JR.red}>Cómo funciona</Eyebrow>
        <Eyebrow color={JR.ink}>03 / 04</Eyebrow>
      </div>

      <div style={{ ...chevronStrip(JR.beige, JR.cream), height: 24, flexShrink: 0 }} />

      <div
        style={{
          flex: 1,
          padding: "28px 24px 28px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontWeight: 900,
            fontSize: 38,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            color: JR.ink,
            marginBottom: 22,
          }}
        >
          Tres pasos.
          <br />
          <span style={{ color: JR.red }}>Cero ciencia.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <StepCard n="1" label="Captura" title="Tómale una foto." color={JR.red} rotate={-1.5}>
            <svg viewBox="0 0 64 64" width="100%" height="100%">
              <rect x="6" y="16" width="52" height="40" fill="none" stroke="#fff" strokeWidth="3" />
              <rect x="22" y="10" width="20" height="10" fill="none" stroke="#fff" strokeWidth="3" />
              <circle cx="32" cy="36" r="10" fill="none" stroke="#fff" strokeWidth="3" />
              <circle cx="32" cy="36" r="3" fill="#fff" />
              <circle cx="50" cy="22" r="2" fill="#fff" />
            </svg>
          </StepCard>

          <StepCard n="2" label="Califica" title="Nota del 1 al 10." color={JR.ink} fg="#fff" rotate={1}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                height: "100%",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 28,
                  lineHeight: 1,
                  color: JR.red,
                  letterSpacing: "-0.04em",
                  textAlign: "right",
                }}
              >
                8.7
              </div>
              <div
                style={{
                  height: 8,
                  background: "#444",
                  position: "relative",
                  overflow: "hidden",
                  border: "1.5px solid #fff",
                }}
              >
                <div
                  style={{ position: "absolute", inset: 0, width: "87%", background: JR.red }}
                />
              </div>
            </div>
          </StepCard>

          <StepCard n="3" label="Comparte" title="Tu red la ve." color={JR.teal} fg={JR.ink} rotate={-0.5}>
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              {[
                { i: "AN", c: JR.red, top: 0, left: 0 },
                { i: "JL", c: JR.ink, top: 6, left: 26 },
                { i: "MR", c: "#e8a83a", top: 28, left: 12 },
              ].map((a, idx) => (
                <div key={idx} style={{ position: "absolute", top: a.top, left: a.left }}>
                  <Avatar initials={a.i} color={a.c} size={32} />
                </div>
              ))}
            </div>
          </StepCard>
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            marginTop: 20,
            padding: "14px 16px",
            background: JR.cream,
            border: `2.5px solid ${JR.ink}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <ScoreChip value="8.7" color={JR.red} size="lg" />
          <div
            style={{
              fontFamily: fontBody,
              fontWeight: 800,
              fontSize: 13,
              lineHeight: 1.25,
              color: JR.ink,
              letterSpacing: "-0.005em",
            }}
          >
            La nota que ves en cada post es el{" "}
            <span style={{ color: JR.red }}>promedio de tu círculo</span>. No del mundo entero.
          </div>
        </div>
      </div>
    </div>
  );
}

function FriendRow({
  initials,
  color,
  score,
  name,
  note,
}: {
  initials: string;
  color: string;
  score: string;
  name: string;
  note: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
      <Avatar initials={initials} color={color} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ fontFamily: fontDisplay, fontSize: 14, letterSpacing: "-0.02em", color: JR.ink }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: fontBody,
            fontWeight: 600,
            fontSize: 11,
            color: JR.ink,
            opacity: 0.6,
            marginTop: 2,
          }}
        >
          {note}
        </div>
      </div>
      <ScoreChip value={score} color={JR.red} size="md" />
    </div>
  );
}

function Slide4() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: JR.cream,
        color: JR.ink,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "20px 28px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Eyebrow dot={JR.teal}>La gracia</Eyebrow>
        <Eyebrow color={JR.ink}>04 / 04</Eyebrow>
      </div>

      <div style={{ ...chevronStrip(JR.beige, JR.cream), height: 24, flexShrink: 0 }} />

      <div
        style={{
          flex: 1,
          padding: "18px 22px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontWeight: 900,
            fontSize: 26,
            lineHeight: 0.95,
            letterSpacing: "-0.035em",
            color: JR.ink,
          }}
        >
          Esto es lo que <span style={{ color: JR.red }}>ves</span> en cada post.
        </div>

        {/* mock post card */}
        <div style={{ background: "#fff", border: `2.5px solid ${JR.ink}`, position: "relative" }}>
          <div
            style={{
              padding: "10px 12px",
              borderBottom: `2px solid ${JR.ink}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Avatar initials="AN" color={JR.red} size={28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fontDisplay, fontSize: 13, letterSpacing: "-0.02em" }}>
                Ana Fuentes
              </div>
              <div
                style={{
                  fontFamily: fontMono,
                  fontSize: 9,
                  color: JR.ink,
                  opacity: 0.55,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: 1,
                }}
              >
                Hace 2 horas · Pizza
              </div>
            </div>
            <div
              style={{
                fontFamily: fontDisplay,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: JR.red,
                border: `1.5px solid ${JR.red}`,
                padding: "3px 7px",
              }}
            >
              9.1
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <PhotoPlaceholder label="foto del lugar" height={130} tone="#d9bfa3" />
            <div style={{ position: "absolute", top: -18, right: 14, zIndex: 2 }}>
              <JellyBadge color={JR.red} size={86} rotate={-7}>
                <div
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 30,
                    lineHeight: 0.85,
                    letterSpacing: "-0.04em",
                  }}
                >
                  8.7
                </div>
                <div
                  style={{
                    fontFamily: fontBody,
                    fontWeight: 900,
                    fontSize: 7,
                    letterSpacing: "0.2em",
                    marginTop: 2,
                  }}
                >
                  PROMEDIO
                </div>
              </JellyBadge>
            </div>
          </div>

          <div style={{ padding: "10px 14px 12px" }}>
            <div
              style={{ fontFamily: fontDisplay, fontSize: 20, letterSpacing: "-0.03em", color: JR.ink }}
            >
              Pizza El Forno
            </div>
            <div
              style={{
                fontFamily: fontBody,
                fontWeight: 600,
                fontSize: 11,
                color: JR.ink,
                opacity: 0.65,
                marginTop: 2,
                letterSpacing: "0.02em",
              }}
            >
              Providencia · $$ · Napolitana
            </div>
            <div style={{ marginTop: 12 }}>
              <ScoreBar value={8.7} />
            </div>
          </div>
        </div>

        {/* friends */}
        <div
          style={{
            background: JR.cream,
            border: `2.5px solid ${JR.ink}`,
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              paddingBottom: 6,
              borderBottom: `1.5px dashed ${JR.ink}`,
            }}
          >
            <Eyebrow color={JR.ink}>Lo que dice tu círculo</Eyebrow>
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 10,
                color: JR.ink,
                opacity: 0.6,
                letterSpacing: "0.1em",
              }}
            >
              3 DE 5
            </div>
          </div>
          <FriendRow initials="AN" color={JR.red} name="Ana" note='"mejor masa del barrio"' score="9.1" />
          <div style={{ height: 1, background: JR.beige }} />
          <FriendRow initials="JL" color={JR.teal} name="Julián" note='"buena pero cara"' score="7.8" />
          <div style={{ height: 1, background: JR.beige }} />
          <FriendRow initials="MR" color="#e8a83a" name="Marisol" note='"volvería mañana"' score="9.2" />
        </div>
      </div>
    </div>
  );
}

// ─── slide registry ───────────────────────────────────────────────────────────

const SLIDES = [
  { id: "s1", component: Slide1 },
  { id: "s2", component: Slide2 },
  { id: "s3", component: Slide3 },
  { id: "s4", component: Slide4 },
];

// ─── OnboardingSlides (main export) ──────────────────────────────────────────

export default function OnboardingSlides({ onComplete }: { onComplete: () => void }) {
  const [idx, setIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);

  const W = 390;
  const H = 812; // matches iOS frame inner body height
  const slideAreaH = H - CONTROLS_H;

  const last = SLIDES.length - 1;

  const goNext = () => {
    if (idx < last) setIdx(idx + 1);
    else finish();
  };
  const goPrev = () => setIdx((i) => Math.max(0, i - 1));
  const finish = () => {
    try {
      localStorage.setItem("onboarding_done", "true");
    } catch (_) {}
    onComplete();
  };

  // Pointer / touch swipe — on slide area only
  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    startX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (startX.current == null) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    let dx = x - startX.current;
    if (idx === 0 && dx > 0) dx *= 0.35;
    if (idx === last && dx < 0) dx *= 0.35;
    setDragX(dx);
  };
  const onUp = () => {
    if (startX.current == null) return;
    const threshold = W * 0.18;
    if (dragX < -threshold && idx < last) setIdx(idx + 1);
    else if (dragX > threshold && idx > 0) setIdx(idx - 1);
    setDragX(0);
    startX.current = null;
  };

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const isLast = idx === last;
  const translate = -idx * W + dragX;

  return (
    // Full-screen backdrop
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: JR.ink,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* outer shell — flex column so controls never overlap slides */}
      <div
        style={{
          width: W,
          height: H,
          background: JR.cream,
          display: "flex",
          flexDirection: "column",
          userSelect: "none",
          fontFamily: fontBody,
          color: JR.ink,
        }}
      >
        {/* ── slide area (swipeable) ── */}
        <div
          style={{
            width: W,
            height: slideAreaH,
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
            touchAction: "pan-y",
          }}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        >
          {/* slide rail */}
          <div
            style={{
              display: "flex",
              width: W * SLIDES.length,
              height: "100%",
              transform: `translateX(${translate}px)`,
              transition: dragX === 0 ? "transform 380ms cubic-bezier(.32,.72,.28,1)" : "none",
            }}
          >
            {SLIDES.map((s) => {
              const C = s.component;
              return (
                <div key={s.id} style={{ width: W, height: "100%", flexShrink: 0 }}>
                  <C />
                </div>
              );
            })}
          </div>

          {/* skip — anchored top-right over the slide */}
          <button
            onClick={finish}
            style={{
              position: "absolute",
              top: 18,
              right: 22,
              background: "transparent",
              border: "none",
              fontFamily: fontBody,
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: JR.ink,
              opacity: 0.55,
              cursor: "pointer",
              padding: 6,
              zIndex: 5,
            }}
          >
            Saltar
          </button>
        </div>

        {/* ── controls bar — own row, never overlaps ── */}
        <div
          style={{
            height: CONTROLS_H,
            flexShrink: 0,
            padding: "20px 24px 24px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: JR.cream,
            borderTop: `1.5px solid ${JR.beige}`,
          }}
        >
          {/* dots */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            {SLIDES.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setIdx(i)}
                style={{
                  height: 8,
                  width: i === idx ? 28 : 8,
                  borderRadius: 999,
                  background: i === idx ? JR.red : JR.beige,
                  border: `2px solid ${JR.ink}`,
                  transition: "width 220ms ease, background 220ms ease",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={goNext}
            style={{
              width: "100%",
              height: 56,
              background: JR.red,
              color: "#fff",
              border: `2.5px solid ${JR.ink}`,
              fontFamily: fontDisplay,
              fontWeight: 900,
              fontSize: 17,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: `4px 4px 0 0 ${JR.ink}`,
              transform: "translateY(0)",
              transition: "transform 80ms ease, box-shadow 80ms ease",
            }}
            onMouseDown={(e) => {
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
            {isLast ? "Empezar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
