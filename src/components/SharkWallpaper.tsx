"use client";

import React, { useEffect, useState } from "react";

interface SharkWallpaperProps {
  opacity?: number;
}

const SharkWallpaper: React.FC<SharkWallpaperProps> = ({ opacity = 0.04 }) => {
  const [bgStyle, setBgStyle] = useState<React.CSSProperties>({ opacity: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = "/logos/requin.png";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Define the tile size (spacing)
      const tileSize = 250;
      // Define the shark size (miniature)
      const sharkSize = 50;

      canvas.width = tileSize;
      canvas.height = tileSize;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Draw the shark centered in the tile
        const pos = (tileSize - sharkSize) / 2;
        ctx.drawImage(img, pos, pos, sharkSize, sharkSize);

        const dataUrl = canvas.toDataURL();
        setBgStyle({
          backgroundImage: `url(${dataUrl})`,
          backgroundRepeat: "repeat",
          opacity: opacity,
        });
      }
    };
  }, [opacity]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={bgStyle}
      />
      {/* Subtle blend with the page theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-transparent to-surface/20"></div>
    </div>
  );
};

export default SharkWallpaper;
