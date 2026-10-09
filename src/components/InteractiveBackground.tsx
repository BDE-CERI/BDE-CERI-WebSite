"use client";

import { useEffect, useState, type ComponentType } from "react";

export default function InteractiveBackground() {
  const [Canvas, setCanvas] = useState<ComponentType | null>(null);
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
  return Canvas
    ? <Canvas />
    : <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(123,208,255,0.08),transparent_55%),linear-gradient(135deg,rgba(188,199,222,0.025),transparent_60%)]" />;
}
