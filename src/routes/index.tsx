import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { WebCanvas } from "@/components/web-canvas";

const WHATSAPP_NUMBER = "";
const CONFIRM_MESSAGE =
  "Oi! Confirmo presença no aniversário de 4 anos do Arthur, dia 19/12/2026 às 12h.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arthur faz 4 — Convite" },
      {
        name: "description",
        content:
          "Abertura interativa do convite de aniversário do Arthur: teia, aranha geométrica e uma pequena surpresa visual.",
      },
      { property: "og:title", content: "Arthur faz 4 — Convite" },
      {
        property: "og:description",
        content: "Toque para entrar e ver a teia se formar. Arthur faz 4!",
      },
    ],
  }),
  component: Index,
});

type Stage = "idle" | "opening" | "pull" | "info" | "confirm" | "confirmed";

function Index() {
  const [started, setStarted] = useState(false);
  const [showText, setShowText] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [pull, setPull] = useState(0);
  const dragRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
    setStage("opening");
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const id = window.setTimeout(() => setShowText(true), 1720);
    return () => window.clearTimeout(id);
  }, [started]);

  useEffect(() => {
    if (!showText || stage !== "opening") return;
    const id = window.setTimeout(() => setStage("pull"), 1200);
    return () => window.clearTimeout(id);
  }, [showText, stage]);

  const onPullMove = (x: number) => {
    if (dragRef.current === null) return;
    const d = Math.max(0, x - dragRef.current);
    setPull(Math.min(1, d / 120));
    if (d > 110) {
      dragRef.current = null;
      setPull(0);
      setStage("info");
    }
  };

  const confirm = () => {
    setStage("confirmed");
    if (WHATSAPP_NUMBER) {
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(CONFIRM_MESSAGE)}`,
        "_blank",
      );
    }
  };

  return (
    <main
      onPointerDown={stage === "idle" ? start : undefined}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && start()}
      role={stage === "idle" ? "button" : undefined}
      tabIndex={stage === "idle" ? 0 : -1}
      aria-label="Toque para lançar a teia"
      className="relative flex min-h-screen w-full touch-none select-none items-center justify-center overflow-hidden bg-web-ink outline-none"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--web-blue)_22%,transparent),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_40%,var(--web-ink)_100%)]" />

      {stage !== "info" && (
        <WebCanvas key={stage === "confirmed" ? "end" : "open"} running={started} />
      )}

      {!started && (
        <div className="absolute inset-x-0 top-0 flex flex-col items-center">
          <span className="animate-thread-breathe h-[26vh] w-px bg-gradient-to-b from-transparent via-web-red/60 to-web-red-bright" />
          <span className="animate-hint-pulse mt-6 text-[0.62rem] font-light tracking-[0.42em] text-foreground/70 uppercase">
            Toque para lançar a teia
          </span>
        </div>
      )}

      {showText && stage !== "info" && stage !== "confirmed" && (
        <div className="animate-settle-in absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-10 text-center">
          <h1
            className="animate-reveal-up font-display text-[clamp(3rem,17vw,6rem)] leading-[0.9] tracking-[0.06em] text-foreground"
            style={{ textShadow: "0 0 34px color-mix(in oklab, var(--web-red) 45%, transparent)" }}
          >
            ARTHUR
          </h1>
          <span
            className="animate-reveal-up mt-4 h-px w-24 bg-web-red-bright"
            style={{ animationDelay: "140ms" }}
          />
          <p
            className="animate-reveal-up mt-4 font-display text-[clamp(1.6rem,9vw,3rem)] tracking-[0.18em] text-web-red-bright"
            style={{ animationDelay: "240ms" }}
          >
            FAZ 4!
          </p>
        </div>
      )}

      {stage === "pull" && (
        <div
          className="animate-reveal-up absolute inset-x-0 bottom-16 flex flex-col items-center gap-4"
          onPointerDown={(e) => {
            e.stopPropagation();
            dragRef.current = e.clientX;
          }}
          onPointerMove={(e) => onPullMove(e.clientX)}
          onPointerUp={() => {
            dragRef.current = null;
            setPull(0);
          }}
          onClick={() => setStage("info")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setStage("info")}
        >
          <div className="relative h-px w-56 bg-gradient-to-r from-transparent via-foreground/25 to-transparent">
            <span
              className="absolute top-1/2 left-4 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-web-red-bright shadow-[0_0_12px_var(--web-red-bright)] transition-transform"
              style={{ transform: `translate(${pull * 150}px,-50%)` }}
            />
          </div>
          <span className="animate-drift-x text-[0.6rem] font-light tracking-[0.42em] text-foreground/70 uppercase">
            Puxe a teia →
          </span>
        </div>
      )}

      {stage === "info" && (
        <div className="animate-settle-in absolute inset-0 flex flex-col items-center justify-center gap-8 px-8 text-center">
          <div className="animate-reveal-up">
            <p className="text-[0.6rem] tracking-[0.42em] text-web-red-bright uppercase">Quando</p>
            <p className="mt-3 font-display text-[clamp(1.7rem,8vw,2.6rem)] tracking-[0.08em] text-foreground">
              19 de dezembro de 2026
            </p>
            <p className="mt-1 text-sm tracking-[0.24em] text-foreground/70 uppercase">
              Domingo • 12h00
            </p>
          </div>

          <span className="h-px w-24 bg-web-red/70" />

          <div className="animate-reveal-up" style={{ animationDelay: "140ms" }}>
            <p className="text-[0.6rem] tracking-[0.42em] text-web-red-bright uppercase">Onde</p>
            <p className="mt-3 font-display text-[clamp(1.5rem,7vw,2.2rem)] tracking-[0.08em] text-foreground">
              Molecada Kids
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              Rua Flor das Cobras, 226
              <br />
              Jardim Alvorada, BH
            </p>
          </div>

          <div
            className="animate-reveal-up mt-2 flex flex-col items-center gap-5"
            style={{ animationDelay: "260ms" }}
          >
            <p className="font-display text-[clamp(1.2rem,6vw,1.8rem)] tracking-[0.14em] text-foreground">
              Vem comemorar comigo?
            </p>
            <button
              onClick={confirm}
              className="rounded-full border border-web-red/70 px-8 py-3 text-[0.62rem] font-medium tracking-[0.34em] text-web-red-bright uppercase transition-all hover:bg-web-red/15 hover:shadow-[0_0_28px_color-mix(in_oklab,var(--web-red)_45%,transparent)]"
            >
              Confirmar presença
            </button>
          </div>
        </div>
      )}

      {stage === "confirmed" && (
        <div className="animate-settle-in absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-10 text-center">
          <p className="animate-reveal-up font-display text-[clamp(1.8rem,10vw,3.2rem)] leading-tight tracking-[0.1em] text-foreground">
            Presença
            <br />
            <span className="text-web-red-bright">confirmada!</span>
          </p>
          <span
            className="animate-reveal-up mt-4 text-lg text-web-red-bright"
            style={{ animationDelay: "220ms" }}
          >
            ❤️
          </span>
        </div>
      )}
    </main>
  );
}
