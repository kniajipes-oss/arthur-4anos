import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { WebCanvas } from "@/components/web-canvas";

const WHATSAPP_KENIA = "5531994980214";
const WHATSAPP_LUCIANO = "5531985060034";
// WHATSAPP_DESTINO: número padrão desta versão do convite (Kênia).
// Links com ?de=luciano enviam para o Luciano.
const WHATSAPP_DESTINO = WHATSAPP_KENIA;
const CONFIRM_MESSAGE =
  "Oi! Recebi o convite do aniversário do Arthur e quero confirmar minha presença. ❤️";

function whatsappDestino() {
  const de = new URLSearchParams(window.location.search).get("de")?.toLowerCase();
  return de === "luciano" ? WHATSAPP_LUCIANO : WHATSAPP_DESTINO;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arthur faz 4 — Convite" },
      {
        name: "description",
        content:
          "Convite interativo do aniversário de 4 anos do Arthur: 19 de dezembro de 2026, sábado, 12h, em BH.",
      },
      { property: "og:title", content: "Arthur faz 4 — Convite" },
      {
        property: "og:description",
        content: "Toque para lançar a teia. Arthur faz 4! Sábado, 19/12, 12h.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content: "https://arthur-4anos.lovable.app/og.jpg",
      },
      { property: "og:image:secure_url", content: "https://arthur-4anos.lovable.app/og.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "640" },
      { property: "og:image:alt", content: "Arthur faz 4! — convite com teia de aranha" },
      { property: "og:url", content: "https://arthur-4anos.lovable.app/" },
      { property: "og:site_name", content: "Arthur faz 4" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content: "https://arthur-4anos.lovable.app/og.jpg",
      },
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
  const venueAt = useRef(0);
  const confirmArmed = useRef(false);
  useEffect(() => {
    if (stage === "venue") venueAt.current = Date.now();
    confirmArmed.current = false;
  }, [stage]);

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

  // Each inner screen gets its own browser-history entry, so the phone's native
  // back gesture moves to the previous screen instead of leaving the invite.
  const resetting = useRef(false);
  const resetInvite = useCallback(() => {
    setStarted(false);
    setShowText(false);
    setStage("idle");
  }, []);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      confirmArmed.current = false;
      if (resetting.current) {
        resetting.current = false;
        resetInvite();
        return;
      }
      const s = (e.state as { inviteStage?: Stage } | null)?.inviteStage;
      setRipples([]);
      busy.current = false;
      setStage(s ?? "tease");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [resetInvite]);

  const advance = (x: number, y: number, next: Stage) => {
    if (busy.current) return;
    busy.current = true;
    const depth = ((window.history.state as { inviteDepth?: number } | null)?.inviteDepth ?? 0) + 1;
    window.history.pushState(
      { ...(window.history.state ?? {}), inviteStage: next, inviteDepth: depth },
      "",
    );
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    window.setTimeout(() => setStage(next), 420);
    window.setTimeout(() => {
      setRipples((r) => r.filter((p) => p.id !== id));
      busy.current = false;
    }, 950);
  };

  const goBack = () => {
    if (busy.current) return;
    const s = window.history.state as { inviteStage?: Stage } | null;
    if (s?.inviteStage) window.history.back();
    else setStage(stage === "venue" ? "date" : "tease");
  };

  const restart = () => {
    const d = (window.history.state as { inviteDepth?: number } | null)?.inviteDepth ?? 0;
    if (d > 0) {
      resetting.current = true;
      window.history.go(-d);
    } else resetInvite();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (stage === "idle") return start();
    if (stage === "tease") return advance(e.clientX, e.clientY, "date");
    if (stage === "date") return advance(e.clientX, e.clientY, "venue");
  };

  const confirm = (e: React.MouseEvent) => {
    // only a deliberate tap/keypress that started on the button itself, after the screen settled
    if (!e.isTrusted || !confirmArmed.current || Date.now() - venueAt.current < 700) return;
    if (stage !== "venue") return;
    confirmArmed.current = false;
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
          dim ? "opacity-85" : "opacity-100"
        } ${stage === "tease" || stage === "date" ? "animate-web-touch-hint" : ""}`}
      >
<WebCanvas key={stage === "confirmed" ? "end" : "open"} running={started} heart={stage === "confirmed"} />
      </div>

      {ripples.map((r) => (
        <WebRipple key={r.id} x={r.x} y={r.y} />
      ))}

      {(stage === "date" || stage === "venue") && (
        <button
          type="button"
          aria-label="Voltar"
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={goBack}
          className="animate-hint-pulse absolute left-0 z-20 flex items-center p-4 text-foreground/60 transition-colors active:text-foreground"
          style={{ top: "max(env(safe-area-inset-top), 0.6rem)" }}
        >
          <span className="text-[0.62rem] font-light uppercase tracking-[0.3em]">← VOLTAR</span>
        </button>
      )}

      {(stage === "tease" || stage === "date") && (
        <button
          type="button"
          aria-label="Avançar"
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={() => {
            if (busy.current) return;
            advance(
              window.innerWidth / 2,
              window.innerHeight / 2,
              stage === "tease" ? "date" : "venue",
            );
          }}
          className="animate-hint-pulse absolute right-4 z-20 flex items-center p-4 text-foreground/75 transition-colors active:text-foreground"
          style={{ bottom: "max(env(safe-area-inset-bottom), 3rem)" }}
        >
          <span className="text-[0.62rem] font-light uppercase tracking-[0.3em]">PRÓXIMO →</span>
        </button>
      )}

      {!started && (
        <div className="absolute inset-x-0 top-[8%] flex flex-col items-center px-8">
          <span className="animate-thread-breathe h-[22svh] w-[1.5px] bg-gradient-to-b from-transparent via-web-red/60 to-web-red-bright" />
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
              Sábado • 12h
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
              className="animate-reveal-up mt-1 text-[1rem] leading-relaxed text-foreground/80"
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
              19 de dezembro • 12h
            </p>
          </div>

          <button
            onClick={confirm}
            onPointerDown={(e) => {
              e.stopPropagation();
              confirmArmed.current = true;
            }}
            onPointerCancel={() => {
              confirmArmed.current = false;
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" || e.key === " ") confirmArmed.current = true;
            }}
            style={{ animationDelay: "380ms" }}
            className="animate-reveal-up group relative w-full max-w-[16.5rem] overflow-hidden rounded-full border border-web-red/55 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--web-red)_18%,transparent),color-mix(in_oklab,var(--web-blue)_22%,transparent))] px-7 py-4 text-[0.72rem] font-light tracking-[0.3em] text-foreground/95 uppercase shadow-[0_0_20px_color-mix(in_oklab,var(--web-red)_20%,transparent)] transition-all active:scale-[0.97]"
          >
            Confirmar presença
          </button>
        </div>
      )}

      {stage === "confirmed" && (
        <div className="animate-settle-in absolute inset-x-0 top-[72%] flex -translate-y-1/2 flex-col items-center px-8 text-center">
          <p
            className="animate-reveal-up font-display text-[clamp(1.6rem,8.5vw,2.4rem)] leading-[1.2] font-bold tracking-[0.05em] text-foreground"
            style={{ animationDelay: "3200ms" }}
          >
            PRESENÇA <span className="text-web-red-bright">CONFIRMADA!</span>
          </p>
          <p
            className="animate-reveal-up mt-4 text-[0.8rem] font-medium tracking-[0.34em] text-foreground/80 uppercase"
            style={{ animationDelay: "3500ms" }}
          >
            Até lá!
          </p>
        </div>
      )}

      {stage === "confirmed" && (
        <button
          type="button"
          aria-label="Ver convite novamente"
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={restart}
          className="animate-hint-pulse absolute inset-x-0 z-20 flex justify-center p-4 text-foreground/60 transition-colors active:text-foreground"
          style={{ bottom: "max(env(safe-area-inset-bottom), 0.6rem)" }}
        >
          <span className="text-[0.62rem] font-light uppercase tracking-[0.3em]">← VER CONVITE NOVAMENTE</span>
        </button>
      )}
    </main>
  );
}
