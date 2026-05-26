"use client";

import React, { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Evenement error boundary caught:", error);
  }, [error]);

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center px-6 py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-error/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full glass-panel ghost-border rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl relative z-10">
        <div className="w-16 h-16 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto text-error shadow-lg animate-bounce">
          <span className="material-symbols-outlined text-3xl">warning</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold text-on-surface">Une erreur est survenue</h2>
          <p className="text-sm text-on-surface-variant font-body leading-relaxed">
            Impossible de charger les événements à venir. Veuillez vérifier votre connexion internet et réessayer.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="w-full bg-error text-on-error font-bold py-4 rounded-2xl shadow-xl shadow-error/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">sync</span>
            Réessayer
          </button>
          
          <a
            href="/"
            className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            Retourner à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
