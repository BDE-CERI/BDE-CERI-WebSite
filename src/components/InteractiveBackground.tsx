"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000, radius: 180 };
    const isDark = theme === "dark";
    const baseAlpha = isDark ? 0.25 : 0.4;
    const particleBaseSize = isDark ? 1.2 : 1.5;
    const colorRGB = isDark ? "123, 208, 255" : "0, 107, 179"; // Deeper blue in light mode

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      density: number;
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = particleBaseSize;
        this.density = Math.random() * 30 + 5;
        this.color = `rgba(${colorRGB}, ${baseAlpha})`;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
          // Repulsion logic ("style champ de force qui repousse")
          this.x -= directionX;
          this.y -= directionY;
          
          // Elevation and Brightness ("se relève et s'éclaire")
          const force = (maxDistance - distance) / maxDistance;
          const alpha = baseAlpha + (force * (isDark ? 0.6 : 0.4));
          this.color = `rgba(${colorRGB}, ${alpha})`;
          this.size = particleBaseSize + (force * 1.5);
        } else {
          // Smooth return
          if (this.x !== this.baseX) {
            let dx = this.x - this.baseX;
            this.x -= dx / 15;
          }
          if (this.y !== this.baseY) {
            let dy = this.y - this.baseY;
            this.y -= dy / 15;
          }
          this.color = `rgba(${colorRGB}, ${baseAlpha})`;
          this.size = particleBaseSize;
        }
      }
    }

    const init = () => {
      particles = [];
      const spacing = 35;
      const cols = Math.floor(canvas.width / (window.devicePixelRatio || 1) / spacing) + 1;
      const rows = Math.floor(canvas.height / (window.devicePixelRatio || 1) / spacing) + 1;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let x = j * spacing;
          let y = i * spacing;
          particles.push(new Particle(x, y));
        }
      }
    };

    const animate = () => {
      if (document.hidden) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      // Force Field Circle
      if (mouse.x > 0 && mouse.y > 0) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, mouse.radius * 0.5, mouse.x, mouse.y, mouse.radius);
        gradient.addColorStop(0, `rgba(${colorRGB}, 0.0)`);
        gradient.addColorStop(0.5, `rgba(${colorRGB}, ${isDark ? 0.1 : 0.15})`);
        gradient.addColorStop(1, `rgba(${colorRGB}, 0)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
       const rect = canvas.getBoundingClientRect();
       mouse.x = e.clientX - rect.left;
       mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        animate();
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    handleResize();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${theme === 'dark' ? 'opacity-60' : 'opacity-40'}`}
      style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'multiply' }}
    />
  );
};

export default InteractiveBackground;
