"use client";

import React from "react";

interface SharkWallpaperProps {
  opacity?: number;
}

const SharkWallpaper: React.FC<SharkWallpaperProps> = ({ opacity = 0.04 }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      <div
        className="absolute inset-0 bg-repeat transition-opacity duration-1000 ease-in-out"
        style={{ backgroundImage: "url('/logos/requin-tile.webp')", backgroundSize: "250px 250px", opacity }}
      />
      {/* Subtle blend with the page theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-transparent to-surface/20"></div>
    </div>
  );
};

export default SharkWallpaper;
