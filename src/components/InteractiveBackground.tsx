"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

export default function InteractiveBackground() {
  const [Canvas, setCanvas] = useState<ComponentType | null>(null);
  const lights = useRef<Array<HTMLSpanElement | null>>([]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    let active = true;
    const loadCanvas = () => {
      if (!media.matches) { setCanvas(null); return; }
      void import("./InteractiveBackgroundCanvas").then(module => {
        if (active) setCanvas(() => module.default);
      });
    };
    loadCanvas();
    media.addEventListener("change", loadCanvas);
    return () => { active = false; media.removeEventListener("change", loadCanvas); };
  }, []);
  useEffect(() => {
    const routes = ["ambient-light--one", "ambient-light--two", "ambient-light--three"];
    lights.current.forEach(light => {
      if (!light) return;
      light.classList.remove(...routes);
      light.classList.add(routes[Math.floor(Math.random() * routes.length)]);
      light.style.animationDuration = `${50 + Math.random() * 15}s`;
      light.style.animationDelay = `${Math.random() * 25}s`;
    });
  }, []);
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    {Canvas
      ? <Canvas />
      : <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(123,208,255,0.08),transparent_55%),linear-gradient(135deg,rgba(188,199,222,0.025),transparent_60%)]" />}
    <span ref={element => { lights.current[0] = element; }} className="ambient-light ambient-light--one" />
    <span ref={element => { lights.current[1] = element; }} className="ambient-light ambient-light--one" />
    <span ref={element => { lights.current[2] = element; }} className="ambient-light ambient-light--one" />
  </div>;
}
