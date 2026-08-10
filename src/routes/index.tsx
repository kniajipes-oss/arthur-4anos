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
      className="relative flex h-[100svh] min-h-[100svh] w-full touch-none select-none items-center justify-center overflow-hidden bg-web-ink outline-none"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 1.25rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--web-blue)_22%,transparent),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_40%,var(--web-ink)_100%)]" />

      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          stage === "info" || stage === "confirm" ? "opacity-25" : "opacity-100"
        }`}
      >
        <WebCanvas key={stage === "confirmed" ? "end" : "open"} running={started} />
      </div>

      {!started && (
        <div className="absolute inset-x-0 top-[8%] flex flex-col items-center px-8">
          <span className="animate-thread-breathe h-[22svh] w-px bg-gradient-to-b from-transparent via-web-red/60 to-web-red-bright" />
          <span className="animate-hint-pulse mt-6 text-center text-[0.68rem] font-light tracking-[0.38em] text-foreground/70 uppercase">
            Toque para lançar a teia
          </span>
        </div>
      )}

      {showText && (stage === "opening" || stage === "pull") && (
        <div className="animate-settle-in absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-6 text-center">
          <h1
            className="animate-reveal-up font-display text-[clamp(3.2rem,20vw,6.5rem)] leading-[0.88] tracking-[0.05em] text-foreground"
            style={{ textShadow: "0 0 34px color-mix(in oklab, var(--web-red) 45%, transparent)" }}
          >
            ARTHUR
          </h1>
          <span
            className="animate-reveal-up mt-4 h-px w-24 bg-web-red-bright"
            style={{ animationDelay: "140ms" }}
          />
          <p
            className="animate-reveal-up mt-4 font-display text-[clamp(2rem,11vw,3.4rem)] tracking-[0.16em] text-web-red-bright"
            style={{ animationDelay: "240ms" }}
          >
            FAZ 4!
          </p>
        </div>
      )}

      {stage === "pull" && (
        <div
          className="animate-reveal-up absolute inset-x-0 bottom-[10svh] flex flex-col items-center gap-4 py-4"
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
          <div className="relative h-px w-[60vw] max-w-64 bg-gradient-to-r from-transparent via-foreground/25 to-transparent">
            <span
              className="absolute top-1/2 left-4 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-web-red-bright shadow-[0_0_12px_var(--web-red-bright)] transition-transform"
              style={{ transform: `translate(${pull * 150}px,-50%)` }}
            />
          </div>
          <span className="animate-drift-x text-[0.64rem] font-light tracking-[0.38em] text-foreground/70 uppercase">
            Puxe a teia →
          </span>
        </div>
      )}

      {stage === "info" && (
        <div className="animate-fade-in absolute inset-0 flex flex-col items-center justify-between px-7 py-[7svh] text-center">
          <div className="animate-reveal-up flex flex-col items-center">
            <h2 className="font-display text-[clamp(2.4rem,13vw,3.6rem)] leading-[0.9] tracking-[0.05em] text-foreground">
              Arthur <span className="text-web-red-bright">faz 4!</span>
            </h2>
            <span className="mt-5 h-px w-16 bg-web-red-bright/80" />
          </div>

          <div className="flex w-full flex-col items-center gap-[5svh]">
            <div className="animate-reveal-up" style={{ animationDelay: "120ms" }}>
              <p className="font-display text-[clamp(1.9rem,9vw,2.6rem)] leading-tight tracking-[0.06em] text-foreground">
                19 de dezembro
                <br />
                de 2026
              </p>
              <p className="mt-3 text-[0.78rem] tracking-[0.3em] text-web-red-bright uppercase">
                Domingo • 12h00
              </p>
            </div>

            <span className="h-px w-20 bg-web-red/60" />

            <div className="animate-reveal-up" style={{ animationDelay: "240ms" }}>
              <p className="font-display text-[clamp(1.7rem,8vw,2.3rem)] tracking-[0.07em] text-foreground">
                Molecada Kids
              </p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-foreground/75">
                Rua Flor das Cobras, 226
                <br />
                Jardim Alvorada • BH
              </p>
            </div>
          </div>

          <div
            className="animate-reveal-up flex w-full flex-col items-center gap-4 py-3"
            style={{ animationDelay: "360ms" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              dragRef.current = e.clientX;
            }}
            onPointerMove={(e) => {
              if (dragRef.current === null) return;
              const d = Math.max(0, e.clientX - dragRef.current);
              setPull(Math.min(1, d / 120));
              if (d > 110) {
                dragRef.current = null;
                setPull(0);
                setStage("confirm");
              }
            }}
            onPointerUp={() => {
              dragRef.current = null;
              setPull(0);
            }}
            onClick={() => setStage("confirm")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setStage("confirm")}
          >
            <div className="relative h-px w-[60vw] max-w-64 bg-gradient-to-r from-transparent via-foreground/25 to-transparent">
              <span
                className="absolute top-1/2 left-4 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-web-red-bright shadow-[0_0_12px_var(--web-red-bright)] transition-transform"
                style={{ transform: `translate(${pull * 150}px,-50%)` }}
              />
            </div>
            <span className="animate-drift-x text-[0.64rem] font-light tracking-[0.38em] text-foreground/70 uppercase">
              Puxe a teia →
            </span>
          </div>
        </div>
      )}

      {stage === "confirm" && (
        <div className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center gap-[7svh] px-8 text-center">
          <p className="animate-reveal-up font-display text-[clamp(2rem,10vw,3rem)] leading-[1.05] tracking-[0.08em] text-foreground">
            Vem comemorar
            <br />
            comigo?
          </p>
          <button
            onClick={confirm}
            style={{ animationDelay: "160ms" }}
            className="animate-reveal-up w-full max-w-[19rem] rounded-full border border-web-red/70 bg-web-red/10 px-8 py-5 text-[0.72rem] font-medium tracking-[0.3em] text-web-red-bright uppercase transition-all active:scale-[0.98] hover:bg-web-red/20 hover:shadow-[0_0_32px_color-mix(in_oklab,var(--web-red)_45%,transparent)]"
          >
            Confirmar presença
          </button>
        </div>
      )}

      {stage === "confirmed" && (
        <div className="animate-settle-in absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-8 text-center">
          <p className="animate-reveal-up font-display text-[clamp(2.2rem,12vw,3.4rem)] leading-[1.02] tracking-[0.08em] text-foreground">
            Presença
            <br />
            <span className="text-web-red-bright">confirmada!</span>
          </p>
          <span
            className="animate-reveal-up mt-5 text-2xl"
            style={{ animationDelay: "220ms" }}
          >
            ❤️
          </span>
        </div>
      )}
    </main>
  );
}
