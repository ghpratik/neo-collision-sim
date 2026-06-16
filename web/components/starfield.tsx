"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number;
  radius: number;
  twinkle: number;
};

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationId = 0;

    const STAR_COUNT = Math.min(280, Math.floor((width * height) / 6000));

    let stars: Star[] = [];

    const seedStars = () => {
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2,
        radius: Math.random() * 1.4 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
      }));
    };
    seedStars();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      seedStars();
    };
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        star.twinkle += 0.02 * star.z;
        const alpha = 0.4 + Math.sin(star.twinkle) * 0.35;
        // slow drift to feel like floating through space
        star.x -= star.z * 0.12;
        if (star.x < -2) star.x = width + 2;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * star.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${alpha})`;
        ctx.fill();
      }
      animationId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
