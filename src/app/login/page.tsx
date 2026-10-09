import { login } from "./actions";
import { signInWithGoogle } from "./google-actions";
import { getDictionary } from "@/locales/dictionaries";
import { getGoogleAuthReadiness, type GoogleAuthErrorCode } from "@/utils/google-auth";
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
  const [dict, params, googleReady] = await Promise.all([getDictionary(), searchParams, getGoogleAuthReadiness()]);
  const english = dict.profil.title === "My Account";
  const l = (fr: string, en: string) => english ? en : fr;
  const googleErrors: Record<GoogleAuthErrorCode, string> = {
    google_not_configured: l("La connexion Google n’est pas encore configurée pour cet espace. Utilisez votre adresse e-mail et votre mot de passe.", "Google sign-in is not configured for this workspace yet. Use your email and password."),
    google_cancelled: l("La connexion Google a été annulée. Vous pouvez réessayer.", "Google sign-in was cancelled. You can try again."),
    google_failed: l("La connexion Google n’a pas abouti. Réessayez ou utilisez votre mot de passe.", "Google sign-in could not be completed. Try again or use your password."),
    google_invalid_flow: l("Cette demande de connexion a expiré ou n’est plus valide. Recommencez depuis cette page.", "This sign-in request has expired or is no longer valid. Start again from this page."),
    google_access_denied: l("Ce compte Google ne donne pas accès à un profil BDE existant. Connectez-vous avec votre compte BDE pour associer Google dans les paramètres.", "This Google account does not grant access to an existing BDE profile. Sign in with your BDE account to link Google in settings."),
    google_account_mismatch: l("Le compte connecté a changé pendant l’association. Connectez-vous à nouveau avec votre compte BDE.", "The signed-in account changed during linking. Sign in again with your BDE account."),
    google_linking_disabled: l("L’association Google doit être activée par l’administrateur de l’authentification. Votre connexion par mot de passe reste disponible.", "Google account linking must be enabled by the authentication administrator. Password sign-in remains available."),
    google_session_expired: l("Votre session a expiré. Connectez-vous à nouveau avant d’associer Google.", "Your session has expired. Sign in again before linking Google."),
  };
  const errorMessage = params.error && Object.prototype.hasOwnProperty.call(googleErrors, params.error)
    ? googleErrors[params.error as GoogleAuthErrorCode]
    : params.error ? dict.login.error : "";

  return (
    <div className="relative flex min-h-[calc(100vh-200px)] flex-grow items-center justify-center overflow-hidden px-4 pb-12 pt-24">
      <div className="cyber-gradient absolute inset-0 -z-10" />
      <div className="glass-card relative w-full max-w-md rounded-2xl p-6 shadow-2xl sm:p-8">
        <div className="mb-8 flex justify-center">
          <span aria-hidden="true" className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
        </div>
        <h1 className="mb-2 text-center font-headline text-3xl font-bold text-on-surface">{dict.login.title}</h1>
        <p className="mb-8 text-center font-body text-sm text-on-surface-variant">{l("Accès réservé aux membres disposant d’un compte BDE.", "For BDE members with an existing account.")}</p>

        {errorMessage && <div role="alert" className="mb-6 flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm font-medium text-error"><span aria-hidden="true" className="material-symbols-outlined text-lg">error</span><span>{errorMessage}</span></div>}

        <form action={signInWithGoogle}>
          <button type="submit" disabled={!googleReady} aria-describedby="google-login-help" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3A12 12 0 1 1 32.6 14l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5Z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 32.6 14l5.7-5.7A20 20 0 0 0 6.3 14.7Z" />
              <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.4-5.2l-6.2-5.2a12 12 0 0 1-18.6-5.7L6 33a20 20 0 0 0 18 11Z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2A20 20 0 0 0 44 24c0-1.2-.1-2.4-.4-3.5Z" />
            </svg>
            {l("Se connecter avec Google", "Sign in with Google")}
          </button>
          <p id="google-login-help" className="mt-3 text-center text-xs leading-relaxed text-on-surface-variant">{googleReady ? l("Utilisez le compte Google associé à votre compte BDE.", "Use the Google account linked to your BDE account.") : l("La connexion Google nécessite encore une configuration. La connexion par mot de passe est disponible.", "Google sign-in still needs to be configured. Password sign-in is available.")}</p>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-on-surface-variant"><span className="h-px flex-1 bg-outline-variant/20" /><span>{l("ou avec votre mot de passe", "or with your password")}</span><span className="h-px flex-1 bg-outline-variant/20" /></div>

        <form className="space-y-6" action={login}>
          <div className="space-y-2">
            <label htmlFor="email" className="font-label text-xs uppercase tracking-wider text-on-surface-variant">{dict.login.email}</label>
            <input id="email" name="email" type="email" autoComplete="username" required className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-on-surface transition-colors focus:border-primary focus:ring-0" placeholder="admin@bdeceri.fr" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="font-label text-xs uppercase tracking-wider text-on-surface-variant">{dict.login.password}</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-on-surface transition-colors focus:border-primary focus:ring-0" placeholder="••••••••" />
          </div>
          <button type="submit" className="min-h-12 w-full rounded-lg bg-primary py-3 font-bold text-on-primary transition-all hover:shadow-[0_0_20px_rgba(188,199,222,0.2)] active:scale-[0.98]">{dict.login.submit}</button>
        </form>
      </div>
    </div>
  );
}
