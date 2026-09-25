import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { WebCanvas } from "@/components/web-canvas";

const WHATSAPP_KENIA = "5531994980214";
const WHATSAPP_LUCIANO = "5531985060034";
// Destinatário padrão. Links com ?de=luciano enviam para o Luciano.
const WHATSAPP_DESTINO_PADRAO = WHATSAPP_KENIA;
const CONFIRM_MESSAGE =
  "Oi! Recebi o convite do aniversário do Arthur. Meu nome é [NOME] e confirmo minha presença no dia 19/12 às 12h. ❤️";

function whatsappDestino() {
  const de = new URLSearchParams(window.location.search).get("de")?.toLowerCase();
  return de === "luciano" ? WHATSAPP_LUCIANO : WHATSAPP_DESTINO_PADRAO;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arthur faz 4 — Convite" },
      {
        name: "description",
        content:
          "Convite interativo do aniversário de 4 anos do Arthur: 19 de dezembro de 2026, sábado, 12h, Molecada Kids.",
      },
      { property: "og:title", content: "Arthur faz 4 — Convite" },
      {
        property: "og:description",
        content: "Toque para lançar a teia. Arthur faz 4! Sábado, 19/12, 12h.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Stage = "idle" | "opening" | "tease" | "date" | "venue" | "confirmed";
type Ripple = { id: number; x: number; y: number };

function WebRipple({ x, y }: { x: number; y: number }) {
  const spokes = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  return (
    <svg
      className="animate-web-ripple pointer-events-none absolute h-[150vmax] w-[150vmax]"
      style={{ left: x, top: y }}
      viewBox="-100 -100 200 200"
      aria-hidden="true"
    >
      {spokes.map((a, i) => (
        <line
          key={i}
          x1={0}
          y1={0}
          x2={Math.cos(a) * 100}
          y2={Math.sin(a) * 100}
          stroke={i % 3 === 0 ? "var(--web-red-bright)" : "var(--web-blue)"}
          strokeWidth={0.18}
          opacity={i % 3 === 0 ? 0.8 : 0.9}
        />
      ))}
      {[18, 36, 58, 82].map((r, i) => (
        <circle
          key={r}
          r={r}
          fill="none"
          stroke={i % 2 ? "var(--web-red)" : "var(--web-blue)"}
          strokeWidth={0.22}
        />
      ))}
      <circle r={1.4} fill="var(--web-red-bright)" />
    </svg>
  );
}

function Index() {
  const [started, setStarted] = useState(false);
  const [showText, setShowText] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const busy = useRef(false);

  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
    setStage("opening");
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const id = window.setTimeout(() => setShowText(true), 2950);
    return () => window.clearTimeout(id);
  }, [started]);

  useEffect(() => {
    if (!showText || stage !== "opening") return;
    const id = window.setTimeout(() => setStage("tease"), 1300);
    return () => window.clearTimeout(id);
  }, [showText, stage]);

  const advance = (x: number, y: number, next: Stage) => {
    if (busy.current) return;
    busy.current = true;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    window.setTimeout(() => setStage(next), 420);
    window.setTimeout(() => {
      setRipples((r) => r.filter((p) => p.id !== id));
      busy.current = false;
    }, 950);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (stage === "idle") return start();
    if (stage === "tease") return advance(e.clientX, e.clientY, "date");
    if (stage === "date") return advance(e.clientX, e.clientY, "venue");
  };

  const confirm = (e: React.MouseEvent) => {
    advance(e.clientX, e.clientY, "confirmed");
    window.open(
      `https://wa.me/${whatsappDestino()}?text=${encodeURIComponent(CONFIRM_MESSAGE)}`,
      "_blank",
    );
  };

  const dim = stage === "date" || stage === "venue";

  return (
    <main
      onPointerDown={onPointerDown}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        if (stage === "idle") start();
        else if (stage === "tease") advance(cx, cy, "date");
        else if (stage === "date") advance(cx, cy, "venue");
      }}
      role={stage === "idle" || stage === "tease" || stage === "date" ? "button" : undefined}
      tabIndex={0}
      aria-label={stage === "idle" ? "Toque para lançar a teia" : "Toque para revelar"}
      className="relative flex h-[100svh] min-h-[100svh] w-full touch-none select-none items-center justify-center overflow-hidden bg-web-ink font-body outline-none"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 1.25rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)",
      }}
    >
      {/* blue night atmosphere */}
      <div className="bg-night-atmosphere pointer-events-none absolute inset-0" />

      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          dim ? "opacity-20" : "opacity-100"
        }`}
      >
        <WebCanvas key={stage === "confirmed" ? "end" : "open"} running={started} />
      </div>

      {ripples.map((r) => (
        <WebRipple key={r.id} x={r.x} y={r.y} />
      ))}

      {!started && (
        <div className="absolute inset-x-0 top-[8%] flex flex-col items-center px-8">
          <span className="animate-thread-breathe h-[22svh] w-px bg-gradient-to-b from-transparent via-web-red/60 to-web-red-bright" />
          <span className="animate-hint-pulse mt-6 text-center text-[0.68rem] font-light tracking-[0.38em] text-foreground/75 uppercase">
            Toque para lançar a teia
          </span>
        </div>
      )}

      {showText && (stage === "opening" || stage === "tease") && (
        <div
          key="hero"
          className={`animate-settle-in absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-8 text-center transition-opacity duration-300 ${
            ripples.length ? "opacity-0" : "opacity-100"
          }`}
        >
          <h1
            className="animate-reveal-up font-display text-[clamp(2.2rem,12.5vw,4.6rem)] leading-none font-bold tracking-[0.04em] text-foreground"
            style={{ textShadow: "0 2px 18px color-mix(in oklab, var(--web-deep) 80%, transparent)" }}
          >
            ARTHUR
          </h1>
          <span
            className="animate-reveal-up mt-5 h-px w-20 bg-web-red-bright"
            style={{ animationDelay: "140ms" }}
          />
          <p
            className="animate-reveal-up mt-5 font-display text-[clamp(1.5rem,8vw,2.6rem)] font-medium tracking-[0.14em] text-web-red-bright"
            style={{ animationDelay: "240ms" }}
          >
            FAZ 4!
          </p>
        </div>
      )}

      {stage === "tease" && (
        <p
          className={`animate-reveal-up absolute inset-x-0 bottom-[12svh] px-8 text-center text-[0.7rem] font-light tracking-[0.36em] text-foreground/80 uppercase transition-opacity duration-300 ${
            ripples.length ? "opacity-0" : ""
          }`}
        >
          <span className="animate-hint-pulse inline-block">A teia tem mais a revelar...</span>
        </p>
      )}

      {stage === "date" && (
        <>
          <div className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <p className="animate-reveal-up mb-6 text-[0.7rem] font-light tracking-[0.34em] text-foreground/70 uppercase">
              Meu aniversário está chegando...
            </p>
            <p
              className="animate-reveal-up font-display text-[clamp(3rem,17vw,4.4rem)] leading-none font-bold text-foreground"
              style={{ animationDelay: "180ms" }}
            >
              19
            </p>
            <p
              className="animate-reveal-up mt-3 font-display text-[clamp(1.1rem,6vw,1.6rem)] font-medium tracking-[0.12em] text-foreground"
              style={{ animationDelay: "260ms" }}
            >
              DE DEZEMBRO
            </p>
            <p
              className="animate-reveal-up mt-2 text-[0.8rem] tracking-[0.3em] text-foreground/60"
              style={{ animationDelay: "320ms" }}
            >
              2026
            </p>
            <p
              className="animate-reveal-up mt-8 text-[0.85rem] font-medium tracking-[0.34em] text-web-red-bright uppercase"
              style={{ animationDelay: "400ms" }}
            >
              Sábado • 12h00
            </p>
          </div>
        </>
      )}

      {stage === "venue" && (
        <div className="animate-fade-in absolute inset-0 flex flex-col items-center justify-between px-7 pt-[9svh] pb-[8svh] text-center">
          <p className="animate-reveal-up font-display text-[clamp(1.5rem,7.5vw,2.2rem)] leading-[1.2] font-medium tracking-[0.04em] text-foreground">
            Vem comemorar
            <br />
            <span className="text-web-red-bright">comigo?</span>
          </p>

          <div className="flex flex-col items-center">
            <p
              className="animate-reveal-up font-display text-[clamp(1.4rem,7vw,2rem)] font-bold tracking-[0.06em] text-foreground"
              style={{ animationDelay: "120ms" }}
            >
              MOLECADA KIDS
            </p>
            <p
              className="animate-reveal-up mt-4 text-[1rem] leading-relaxed text-foreground/80"
              style={{ animationDelay: "200ms" }}
            >
              Rua Flor das Cobras, 226
              <br />
              Jardim Alvorada • BH
            </p>
            <span className="my-6 h-px w-16 bg-web-red/70" />
            <p
              className="animate-reveal-up text-[0.8rem] font-medium tracking-[0.3em] text-web-red-bright uppercase"
              style={{ animationDelay: "280ms" }}
            >
              19 de dezembro • 12h00
            </p>
          </div>

          <button
            onClick={confirm}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ animationDelay: "380ms" }}
            className="animate-reveal-up group relative w-full max-w-[20rem] overflow-hidden rounded-full border border-web-red/80 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--web-red)_28%,transparent),color-mix(in_oklab,var(--web-blue)_35%,transparent))] px-8 py-6 text-[0.78rem] font-medium tracking-[0.3em] text-foreground uppercase shadow-[0_0_36px_color-mix(in_oklab,var(--web-red)_35%,transparent)] transition-all active:scale-[0.97]"
          >
            Confirmar presença
          </button>
        </div>
      )}

      {stage === "confirmed" && (
        <div className="animate-settle-in absolute inset-x-0 top-[72%] flex -translate-y-1/2 flex-col items-center px-8 text-center">
          <p
            className="animate-reveal-up font-display text-[clamp(1.6rem,8.5vw,2.4rem)] leading-[1.2] font-bold tracking-[0.05em] text-foreground"
            style={{ animationDelay: "2600ms" }}
          >
            <span className="text-web-red-bright">ATÉ LÁ!</span>
          </p>
          <span className="animate-reveal-up mt-4 text-xl" style={{ animationDelay: "2900ms" }}>
            ❤️
          </span>
        </div>
      )}
    </main>
  );
}
