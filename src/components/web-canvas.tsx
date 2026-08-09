import { useEffect, useRef } from "react";

const T = {
  hold: 180,
  dropEnd: 760,
  webEnd: 1760,
  spiderIn: 1700,
  spiderHold: 2350,
  webFade: 2380,
  end: 3100,
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function cssColor(el: HTMLElement, name: string) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export function WebCanvas({ running }: { running: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

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
      if (!start) start = now;
      const t = running ? now - start : 0;
      const cx = w / 2;
      const cy = h * 0.44;
      const R = Math.min(w * 0.44, h * 0.3);

      ctx.clearRect(0, 0, w, h);
      if (!running) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const webFadeK = 1 - clamp01((t - T.webFade) / 520) * 0.78;

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

      // 2. Web build
      if (t > T.dropEnd) {
        const wp = clamp01((t - T.dropEnd) / (T.webEnd - T.dropEnd));
        const pts: Array<Array<[number, number]>> = [];
        for (let s = 0; s < SPOKES; s++) {
          const a = (s / SPOKES) * Math.PI * 2 - Math.PI / 2;
          // threads are "shot" outward: fast, staggered, slight overshoot snap
          const delay = (s % 3) * 0.045 + Math.floor(s / 3) * 0.012;
          const stagger = clamp01((wp - delay) / 0.3);
          const shot = easeOut(stagger);
          const len = R * shot;
          const ring: Array<[number, number]> = [];
          for (let r = 1; r <= RINGS; r++) {
            const rr = R * (r / RINGS);
            ring.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
          }
          pts.push(ring);

          if (stagger <= 0) continue;
          ctx.globalAlpha = 0.72 * webFadeK;
          ctx.strokeStyle = s % 3 === 0 ? RED_DIM : "rgba(255,255,255,0.45)";
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
          ctx.stroke();

          // travelling head of the thread
          if (stagger < 1) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = RED;
            ctx.shadowBlur = 10;
            ctx.shadowColor = RED;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * len, cy + Math.sin(a) * len, 1.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }

        for (let r = 0; r < RINGS; r++) {
          const rp = clamp01((wp - 0.22 - r * 0.07) / 0.24);
          if (rp <= 0) continue;
          const count = Math.floor(SPOKES * easeInOut(rp));
          ctx.globalAlpha = (r === RINGS - 1 ? 0.35 : 0.55) * webFadeK;
          ctx.strokeStyle = r === 1 ? RED_DIM : "rgba(255,255,255,0.38)";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          for (let s = 0; s < count; s++) {
            const a = pts[s]![r]!;
            const b = pts[(s + 1) % SPOKES]![r]!;
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
        ctx.globalAlpha = 0.9 * webFadeK * clamp01((wp - 0.5) / 0.4);
        ctx.fillStyle = BLUE;
        for (let s = 0; s < SPOKES; s += 5) {
          const p = pts[s]![2]!;
          ctx.beginPath();
          ctx.arc(p[0], p[1], 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // 3. Geometric spider
      if (t > T.spiderIn) {
        const inP = easeOut(clamp01((t - T.spiderIn) / 320));
        const outP = clamp01((t - T.spiderHold) / 380);
        const alpha = inP * (1 - outP);
        const scale = (0.86 + 0.14 * inP) * (1 + outP * 0.5);
        const u = R * 0.2 * scale;
        const breathe = 1 + Math.sin(t / 260) * 0.02;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(breathe, 1 / breathe);
        ctx.globalAlpha = alpha;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.shadowBlur = 16 * alpha;
        ctx.shadowColor = RED;

        // organic body: tapered abdomen + small cephalothorax
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(0, u * 0.55, u * 0.42, u * 0.78, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = RED;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -u * 0.55, u * 0.3, u * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 8 curved, tapering legs (bezier arcs)
        const legs: Array<[number, number, number, number]> = [
          // [anchorY, reach, lift, footDrop]
          [-0.6, 1.9, -1.35, 0.35],
          [-0.3, 2.25, -0.85, 0.95],
          [0.05, 2.2, -0.25, 1.5],
          [0.4, 1.8, 0.35, 1.85],
        ];
        for (const side of [-1, 1]) {
          legs.forEach(([ay, reach, lift, footDrop], i) => {
            const sway = Math.sin(t / 300 + i * 0.7 + (side > 0 ? 0 : 1.4)) * u * 0.05;
            const ax = side * u * 0.26;
            const ay0 = u * ay;
            const kx = side * u * reach * 0.62;
            const ky = u * lift + sway;
            const fx = side * u * reach;
            const fy = u * footDrop + sway;
            ctx.strokeStyle = i === 1 ? RED_DIM : "rgba(255,255,255,0.78)";
            ctx.lineWidth = 1.15;
            ctx.beginPath();
            ctx.moveTo(ax, ay0);
            ctx.quadraticCurveTo(kx, ky, side * u * reach * 0.88, ky + u * 0.35);
            ctx.stroke();
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(side * u * reach * 0.88, ky + u * 0.35);
            ctx.quadraticCurveTo(fx * 1.06, (ky + fy) / 2 + u * 0.3, fx * 0.98, fy);
            ctx.stroke();
          });
        }
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
  }, [running]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}