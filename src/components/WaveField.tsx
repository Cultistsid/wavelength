'use client';

import { useEffect, useRef } from 'react';

interface WaveFieldProps {
  /** 0..1, drives amplitude and speed */
  energy?: number;
  className?: string;
}

const COLORS = ['#f2e94e', '#2dd4bf', '#ff5c8a', '#7c6cff'];

// Oscilloscope-style wave field on a canvas. Cheap: four strokes per frame.
export function WaveField({ energy = 0.5, className = '' }: WaveFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const energyRef = useRef(energy);

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let t = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const e = energyRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const mid = h / 2;
      COLORS.forEach((color, i) => {
        const amp = (h * 0.12 + h * 0.22 * e) * (1 - i * 0.15);
        const freq = 0.006 + i * 0.0018;
        const speed = (0.6 + e * 1.4) * (1 + i * 0.25);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y =
            mid +
            Math.sin(x * freq + t * speed + i * 1.7) * amp * Math.sin((x / w) * Math.PI) +
            Math.sin(x * freq * 2.3 - t * speed * 0.7) * amp * 0.25;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = w < 640 ? 8 : 18;
        ctx.shadowColor = color;
        ctx.globalAlpha = 0.85 - i * 0.15;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
      if (!reduce) t += 0.016;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
