import { login } from "./actions";
import { getDictionary } from "@/locales/dictionaries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion à l’espace BDE",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const dict = await getDictionary();
  const params = await searchParams;

  return (
    <div className="flex-grow flex items-center justify-center min-h-[calc(100vh-200px)] pt-24 pb-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 cyber-gradient -z-10"></div>

      <div className="glass-card max-w-md w-full rounded-2xl p-8 shadow-2xl relative">
        <div className="flex justify-center mb-8">
          <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            admin_panel_settings
          </span>
        </div>

        <h1 className="font-headline text-3xl font-bold text-center text-on-surface mb-2">
          {dict.login.title}
        </h1>
        <p className="font-body text-center text-on-surface-variant mb-8">
          Restricted access.
        </p>

        {params.error && (
          <div className="bg-error-container/20 text-error px-4 py-3 rounded-lg mb-6 text-sm font-medium flex items-center gap-2 border border-error/30">
            <span className="material-symbols-outlined text-lg">error</span>
            {dict.login.error}
          </div>
        )}

        <form className="space-y-6" action={login}>
          <div className="space-y-2">
            <label className="font-label text-xs uppercase tracking-wider text-on-surface-variant">
              {dict.login.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:ring-0 focus:border-primary transition-colors px-4 py-3 rounded-lg"
              placeholder="admin@bdeceri.fr"
            />
          </div>

          <div className="space-y-2">
            <label className="font-label text-xs uppercase tracking-wider text-on-surface-variant">
              {dict.login.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:ring-0 focus:border-primary transition-colors px-4 py-3 rounded-lg"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(188,199,222,0.2)] transition-all active:scale-[0.98]"
          >
            {dict.login.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
