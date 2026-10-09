"use client";

import { useEffect } from "react";

export default function MaterialSymbolsStylesheet() {
  useEffect(() => {
    const id = "bde-material-symbols";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.fetchPriority = "low";
    link.onerror = () => document.documentElement.classList.add("material-symbols-ready");
    link.onload = () => {
      void document.fonts.load('24px "Material Symbols Outlined"').then(() => {
        document.documentElement.classList.add("material-symbols-ready");
      }).catch(() => document.documentElement.classList.add("material-symbols-ready"));
    };
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}
