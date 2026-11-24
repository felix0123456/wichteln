"use client";

import React, { useEffect, useRef } from "react";

interface Flake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
  isStar: boolean;
  rotation: number;
  spin: number;
}

export default function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const flakeCount = Math.min(Math.floor(width / 28), 46);
    const flakes: Flake[] = [];

    for (let i = 0; i < flakeCount; i++) {
      const isStar = i % 5 === 0;
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: isStar ? Math.random() * 2.2 + 2.8 : Math.random() * 2 + 1.1,
        speed: Math.random() * 0.6 + 0.25,
        wind: Math.random() * 0.28 - 0.14,
        opacity: isStar ? Math.random() * 0.22 + 0.14 : Math.random() * 0.3 + 0.16,
        isStar,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.008,
      });
    }

    const drawCrystal = (x: number, y: number, r: number, rot: number, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = `rgba(181, 132, 40, ${alpha})`;
      ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        if (f.isStar) {
          drawCrystal(f.x, f.y, f.radius, f.rotation, f.opacity);
          f.rotation += f.spin;
        } else {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(197, 183, 154, ${f.opacity})`;
          ctx.fill();
        }

        f.y += f.speed;
        f.x += f.wind;

        if (f.y > height + 8) {
          f.y = -8;
          f.x = Math.random() * width;
        }
        if (f.x > width + 8) {
          f.x = -8;
        } else if (f.x < -8) {
          f.x = width + 8;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
