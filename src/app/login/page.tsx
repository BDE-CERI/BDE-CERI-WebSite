import { login, loginWithGoogle } from "./actions";
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
          <span
            className="material-symbols-outlined text-primary text-5xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
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
            <span className="material-symbols-outlined text-lg">
              error
            </span>
            {dict.login.error}
          </div>
        )}

        <form className="space-y-6" action={login}>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="font-label text-xs uppercase tracking-wider text-on-surface-variant"
            >
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
            <label
              htmlFor="password"
              className="font-label text-xs uppercase tracking-wider text-on-surface-variant"
            >
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

        <div className="relative flex items-center gap-4 my-8">
          <div className="flex-1 border-t border-outline-variant/30"></div>
          <span className="text-xs uppercase tracking-wider text-on-surface-variant font-label">
            Ou
          </span>
          <div className="flex-1 border-t border-outline-variant/30"></div>
        </div>

        <form action={loginWithGoogle}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 border border-gray-200 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5 shrink-0"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.88 46.98 24.55z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            Continuer avec Google
          </button>
        </form>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Accès réservé aux membres autorisés du BDE CERI.
        </p>
      </div>
    </div>
  );
}
