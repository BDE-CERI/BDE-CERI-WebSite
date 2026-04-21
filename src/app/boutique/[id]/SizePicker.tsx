"use client";

import React, { useState } from "react";

export default function SizePicker({ sizes }: { sizes: string[] }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  if (!sizes || sizes.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">straighten</span>
        Tailles disponibles
      </h3>
      <div className="flex flex-wrap gap-3">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => setSelectedSize(size)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all border-2 ${
              selectedSize === size
                ? "bg-primary border-primary text-on-primary shadow-lg scale-110"
                : "bg-surface-container-high border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      {selectedSize && (
        <p className="text-[10px] text-primary font-bold uppercase tracking-wider animate-in fade-in slide-in-from-left-2 transition-all">
          Taille sélectionnée : {selectedSize}
        </p>
      )}
    </section>
  );
}
