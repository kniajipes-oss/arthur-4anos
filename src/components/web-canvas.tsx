import { useEffect, useRef } from "react";

const T = {
  hold: 300,
  dropEnd: 950,
  webEnd: 1750,
  spiderIn: 1750,
  spiderHold: 2350,
  webFade: 2450,
  end: 3200,
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

      const webFadeK = 1 - clamp01((t - T.webFade) / 600) * 0.72;

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
          const stagger = clamp01((wp - (s % 4) * 0.06) / 0.55);
          const len = R * easeOut(stagger);
          const ring: Array<[number, number]> = [];
          for (let r = 1; r <= RINGS; r++) {
            const rr = R * (r / RINGS);
            ring.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
          }
          pts.push(ring);

          ctx.globalAlpha = 0.7 * webFadeK;
          ctx.strokeStyle = s % 3 === 0 ? RED_DIM : "rgba(255,255,255,0.45)";
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
          ctx.stroke();
        }

        for (let r = 0; r < RINGS; r++) {
          const rp = clamp01((wp - 0.3 - r * 0.13) / 0.4);
          if (rp <= 0) continue;
          const count = Math.floor(SPOKES * easeInOut(rp));
          ctx.globalAlpha = (r === RINGS - 1 ? 0.35 : 0.55) * webFadeK;
          ctx.strokeStyle = r === 1 ? RED_DIM : "rgba(255,255,255,0.38)";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          for (let s = 0; s < count; s++) {
            const a = pts[s][r];
            const b = pts[(s + 1) % SPOKES][r];
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
          const p = pts[s][2];
          ctx.beginPath();
          ctx.arc(p[0], p[1], 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // 3. Geometric spider
      if (t > T.spiderIn) {
        const inP = easeOut(clamp01((t - T.spiderIn) / 380));
        const outP = clamp01((t - T.spiderHold) / 420);
        const alpha = inP * (1 - outP);
        const scale = (0.86 + 0.14 * inP) * (1 + outP * 0.5);
        const u = R * 0.2 * scale;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = alpha;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.shadowBlur = 18 * alpha;
        ctx.shadowColor = RED;

        // body: two stacked diamonds
        ctx.strokeStyle = "rgba(255,255,255,0.92)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -u * 0.95);
        ctx.lineTo(u * 0.4, 0);
        ctx.lineTo(0, u * 1.35);
        ctx.lineTo(-u * 0.4, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = RED;
        ctx.beginPath();
        ctx.moveTo(0, -u * 1.5);
        ctx.lineTo(u * 0.26, -u * 1.05);
        ctx.lineTo(0, -u * 0.7);
        ctx.lineTo(-u * 0.26, -u * 1.05);
        ctx.closePath();
        ctx.stroke();

        // 8 angular legs
        const legs = [
          [-0.5, 1.1, -1.5],
          [-0.15, 1.35, -0.8],
          [0.2, 1.35, -0.1],
          [0.55, 1.15, 0.6],
        ];
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1;
        for (const side of [-1, 1]) {
          for (const [oy, reach, drop] of legs) {
            const kneeX = side * u * reach * 1.05;
            const kneeY = u * oy - u * 1.15;
            ctx.beginPath();
            ctx.moveTo(side * u * 0.32, u * oy);
            ctx.lineTo(kneeX, kneeY);
            ctx.lineTo(side * u * reach * 1.75, kneeY + u * (1.4 + drop * 0.4));
            ctx.stroke();
          }
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