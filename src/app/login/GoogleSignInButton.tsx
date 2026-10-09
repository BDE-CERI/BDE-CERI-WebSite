"use client";

import { useFormStatus } from "react-dom";

export default function GoogleSignInButton({ english = false }: { english?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} aria-describedby="google-login-help" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-highest disabled:cursor-wait disabled:opacity-50">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3A12 12 0 1 1 32.6 14l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5Z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 32.6 14l5.7-5.7A20 20 0 0 0 6.3 14.7Z" />
        <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.4-5.2l-6.2-5.2a12 12 0 0 1-18.6-5.7L6 33a20 20 0 0 0 18 11Z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2A20 20 0 0 0 44 24c0-1.2-.1-2.4-.4-3.5Z" />
      </svg>
      {pending ? (english ? "Opening Google…" : "Ouverture de Google…") : (english ? "Sign in with Google" : "Se connecter avec Google")}
    </button>
  );
}
