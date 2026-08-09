import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { WebCanvas } from "@/components/web-canvas";

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

function Index() {
  const [started, setStarted] = useState(false);
  const [showText, setShowText] = useState(false);

  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const id = window.setTimeout(() => setShowText(true), 1720);
    return () => window.clearTimeout(id);
  }, [started]);

  return (
    <main
      onPointerDown={start}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && start()}
      role="button"
      tabIndex={0}
      aria-label="Toque para lançar a teia"
      className="relative flex min-h-screen w-full touch-none select-none items-center justify-center overflow-hidden bg-web-ink outline-none"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--web-blue)_22%,transparent),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_40%,var(--web-ink)_100%)]" />

      <WebCanvas running={started} />

      {!started && (
        <div className="absolute bottom-24 flex flex-col items-center gap-4">
          <span className="h-10 w-px bg-gradient-to-b from-transparent to-web-red/70" />
          <span className="animate-hint-pulse text-[0.62rem] font-light tracking-[0.42em] text-foreground/70 uppercase">
            Toque para lançar a teia
          </span>
        </div>
      )}

      {showText && (
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-8 text-center">
          <h1
            className="animate-reveal-up font-display text-[clamp(2.75rem,17vw,5rem)] leading-[0.92] tracking-[0.02em] text-foreground"
            style={{ textShadow: "0 0 34px color-mix(in oklab, var(--web-red) 45%, transparent)" }}
          >
            ARTHUR
          </h1>
          <span
            className="animate-reveal-up mt-5 h-px w-24 bg-web-red"
            style={{ animationDelay: "180ms" }}
          />
          <p
            className="animate-reveal-up mt-5 font-display text-[clamp(1.5rem,9vw,2.5rem)] tracking-[0.16em] text-web-red-bright"
            style={{ animationDelay: "300ms" }}
          >
            FAZ 4!
          </p>
        </div>
      )}
    </main>
  );
}
