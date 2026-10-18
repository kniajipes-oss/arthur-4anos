import { useEffect, useRef } from "react";

// ~4s opening: line → web → spider (visible pause) → text
const S = 1.6;
const T = {
  hold: 30,
  dropEnd: 430 * S,
  webEnd: 1220 * S,
  spiderIn: 1150 * S,
  spiderHold: 1620 * S + 150,
  webFade: 1660 * S + 150,
  end: 2600 * S,
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function cssColor(el: HTMLElement, name: string) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export function WebCanvas({ running, heart = false, transitionPulse = 0 }: { running: boolean; heart?: boolean; transitionPulse?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pulseAt = useRef<number | null>(null);

  // A visual-only signal: never restart the existing canvas animation clock.
  useEffect(() => {
    if (!transitionPulse || heart || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    pulseAt.current = performance.now();
  }, [transitionPulse, heart]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const root = document.documentElement;
    const RED = cssColor(root, "--web-red-bright") || "#e03";
    const RED_DIM = cssColor(root, "--web-red") || "#a01";
    const BLUE = cssColor(root, "--web-blue") || "#123";

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const SPOKES = 12;
    const RINGS = 4;
    let raf = 0;
    let start = 0;

    const withAlpha = (color: string, a: number) => {
      ctx.save();
      ctx.globalAlpha = a;
      return color;
    };

    const draw = (now: number) => {
      if (!running) {
        start = 0;
        raf = requestAnimationFrame(draw);
        return;
      }
      if (!start) start = now;
      const t = now - start;
      const cx = w / 2;
      const cy = h * 0.44;
      const R = Math.min(w * 0.44, h * 0.3);

      ctx.clearRect(0, 0, w, h);
      if (!running) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // opening only: main threads slightly thicker/more defined, easing back after the opening
      const openBoost = heart ? 1 : 1 + 0.45 * (1 - clamp01((t - T.end) / 700));
      const webFadeK = 1 - clamp01((t - T.webFade) / 520) * (heart ? 0.55 : 0.38);
      const pulseProgress = pulseAt.current === null ? 1 : clamp01((now - pulseAt.current) / 520);
      const pulseAlpha = heart ? 0 : Math.sin(Math.PI * pulseProgress) * 0.3;

      // 1. Descending thread
      if (t > T.hold) {
        const p = easeOut(clamp01((t - T.hold) / (T.dropEnd - T.hold)));
        const y = cy * p;
        const tail = Math.max(0, y - h * 0.55 * (1 - p * 0.6));
        const grad = ctx.createLinearGradient(cx, tail, cx, y);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, RED);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.1;
        ctx.globalAlpha = t > T.webEnd ? webFadeK * 0.5 : 1;
        ctx.beginPath();
        ctx.moveTo(cx, tail);
        ctx.lineTo(cx, y);
        ctx.stroke();

        if (p < 1) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = RED;
          ctx.shadowBlur = 14;
          ctx.shadowColor = RED;
          ctx.beginPath();
          ctx.arc(cx, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      }

      // spider morph: the web threads themselves gather into the spider
      const morphIn = heart ? 0 : easeInOut(clamp01((t - T.spiderIn) / 300));
      const morphOut = clamp01((t - T.spiderHold) / 240);
      const m = morphIn * (1 - morphOut);
      const u = R * 0.2;
      // spoke index -> [side, kneeX, kneeY, footX, footY] (units of u)
      const LEG: Record<number, [number, number, number, number, number]> = {
        2: [1, 1.35, -1.9, 2.5, -0.6],
        3: [1, 1.6, -1.35, 3.05, 0.35],
        4: [1, 1.6, -0.7, 3.0, 1.35],
        5: [1, 1.35, -0.1, 2.4, 2.2],
        10: [-1, 1.35, -1.9, 2.5, -0.6],
        9: [-1, 1.6, -1.35, 3.05, 0.35],
        8: [-1, 1.6, -0.7, 3.0, 1.35],
        7: [-1, 1.35, -0.1, 2.4, 2.2],
      };
      const mix = (a: number, b: number, k: number) => a + (b - a) * k;

      // 2. Web build
      if (t > T.dropEnd) {
        const wp = clamp01((t - T.dropEnd) / (T.webEnd - T.dropEnd));
        const pts: Array<Array<[number, number]>> = [];
        for (let s = 0; s < SPOKES; s++) {
          const jitter = Math.sin(s * 12.9898) * 0.06;
          const a = (s / SPOKES) * Math.PI * 2 - Math.PI / 2 + jitter;
          const lenK = 0.9 + ((Math.sin(s * 78.233) + 1) / 2) * 0.14;
          // threads are "shot" outward: fast, staggered, slight overshoot snap
          const delay = (s % 3) * 0.05 + Math.floor(s / 3) * 0.02;
          const stagger = clamp01((wp - delay) / 0.34);
          const shot = easeOut(stagger);
          const len = R * lenK * shot;
          const ring: Array<[number, number]> = [];
          for (let r = 1; r <= RINGS; r++) {
            const rr = R * lenK * (r / RINGS) * (1 + Math.sin(s * 3.1 + r) * 0.035);
            ring.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
          }
          pts.push(ring);

          if (stagger <= 0) continue;
          const ex = cx + Math.cos(a) * len;
          const ey = cy + Math.sin(a) * len;
          const leg = LEG[s];
          const sway = Math.sin(t / 320 + s * 0.7) * u * 0.05 * m;

          if (leg && m > 0.001) {
            const [side, kx, ky, fx, fy] = leg;
            const fX = cx + side * u * fx;
            const fY = cy + u * fy + sway;
            const kX = cx + side * u * kx;
            const kY = cy + u * ky + sway;
            const mx = (cx + ex) / 2;
            const my = (cy + ey) / 2;
            ctx.globalAlpha = Math.min(1, Math.max(0.72 * webFadeK, 0.85 * m) * openBoost);
            ctx.strokeStyle = s % 3 === 0 ? RED : s === 4 || s === 8 ? RED_DIM : "rgba(255,255,255,0.72)";
            ctx.lineWidth = mix(0.7, 1.1, m) * openBoost;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo(mix(mx, kX, m), mix(my, kY, m), mix(ex, fX, m), mix(ey, fY, m));
            ctx.stroke();
          } else {
            ctx.globalAlpha = 0.72 * webFadeK * (1 - m * 0.9) * (s % 3 === 0 ? openBoost : 1);
            ctx.strokeStyle = s % 3 === 0 ? RED : s % 3 === 1 ? RED_DIM : "rgba(255,255,255,0.42)";
            ctx.lineWidth = s % 3 === 0 ? 1.05 * openBoost : 0.55;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(mix(ex, cx, m * 0.7), mix(ey, cy, m * 0.7));
            ctx.stroke();
            // Restroke the exact same path and width. Only its local luminosity
            // changes; no new threads, dots, shadows or geometry are introduced.
            if (pulseAlpha > 0.001 && m < 0.001 && wp >= 1 && (s === 0 || s === 3 || s === 9)) {
              const center = -0.22 + pulseProgress * 1.44;
              const glow = ctx.createLinearGradient(cx, cy, ex, ey);
              const transparentRed = "color-mix(in oklab, " + RED + " 0%, transparent)";
              glow.addColorStop(0, transparentRed);
              glow.addColorStop(clamp01(center - 0.22), transparentRed);
              glow.addColorStop(clamp01(center), RED);
              glow.addColorStop(clamp01(center + 0.22), transparentRed);
              glow.addColorStop(1, transparentRed);
              ctx.save();
              ctx.globalAlpha = pulseAlpha;
              ctx.strokeStyle = glow;
              ctx.stroke();
              ctx.restore();
            }
          }

          // travelling head of the thread
          if (stagger < 1) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = RED;
            ctx.shadowBlur = 10;
            ctx.shadowColor = RED;
            ctx.beginPath();
            ctx.arc(ex, ey, 1.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }

        for (let r = 0; r < RINGS; r++) {
          const rp = clamp01((wp - 0.2 - r * 0.06) / 0.26);
          if (rp <= 0) continue;
          const count = Math.floor(SPOKES * easeInOut(rp));
          ctx.globalAlpha = Math.min(1, (r === RINGS - 1 ? 0.6 : 0.78) * webFadeK * (1 - m) * openBoost);
          if (ctx.globalAlpha <= 0.002) continue;
          ctx.strokeStyle = r === 1 || r === 3 ? RED_DIM : "rgba(214,224,245,0.5)";
          ctx.lineWidth = 0.85 * openBoost;
          ctx.beginPath();
          for (let s = 0; s < count; s++) {
            const a = pts[s]?.[r];
            const b = pts[(s + 1) % SPOKES]?.[r];
            if (!a || !b) continue;
            const mx = (a[0] + b[0]) / 2;
            const my = (a[1] + b[1]) / 2;
            const qx = mx + (cx - mx) * 0.12;
            const qy = my + (cy - my) * 0.12;
            ctx.moveTo(a[0], a[1]);
            ctx.quadraticCurveTo(qx, qy, b[0], b[1]);
          }
          ctx.stroke();
        }

        // sparse blue accents
        ctx.globalAlpha = 0.9 * webFadeK * clamp01((wp - 0.5) / 0.4) * (1 - m);
        ctx.fillStyle = BLUE;
        for (let s = 0; s < SPOKES; s += 5) {
          const p = pts[s]?.[2];
          if (!p) continue;
          ctx.beginPath();
          ctx.arc(p[0], p[1], 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // 3b. Heart traced by a thread of the web (closing screen)
      if (heart && t > T.webFade) {
        const hp = easeInOut(clamp01((t - T.webFade) / 900));
        const k = R / 30;
        const N = 120;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = RED;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        let lx = 0, ly = 0;
        for (let i = 0; i <= N * hp; i++) {
          const a = (i / N) * Math.PI * 2;
          const x = 16 * Math.pow(Math.sin(a), 3) * k;
          const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * k;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          lx = x; ly = y;
        }
        ctx.stroke();
        if (hp < 1) {
          ctx.fillStyle = RED;
          ctx.beginPath();
          ctx.arc(lx, ly, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // 3. Spider body drawn from the same threads
      if (m > 0.001) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = m;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.shadowBlur = 14 * m;
        ctx.shadowColor = RED;

        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(0, u * 0.55, u * 0.42 * m, u * 0.78 * m, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = RED;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -u * 0.55, u * 0.3 * m, u * 0.42 * m, 0, 0, Math.PI * 2);
        ctx.stroke();

        // small red accents on the spider
        ctx.fillStyle = RED;
        ctx.globalAlpha = m;
        for (const dx of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(dx * u * 0.14, -u * 0.68, 1.5 * m, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, u * 0.55, 1.8 * m, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      void withAlpha;
    };
  }, [running, heart]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}