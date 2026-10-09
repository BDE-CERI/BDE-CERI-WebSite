import { login } from "./actions";
import { signInWithGoogle } from "./google-actions";
import GoogleSignInButton from "./GoogleSignInButton";
import { getEventLoginReturnPath } from "@/utils/login-return";
import { getDictionary } from "@/locales/dictionaries";
import type { GoogleAuthErrorCode } from "@/utils/google-auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion à l’espace BDE",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const [dict, params] = await Promise.all([getDictionary(), searchParams]);
  const english = dict.profil.title === "My Account";
  const returnPath = getEventLoginReturnPath(params.next, "/");
  const l = (fr: string, en: string) => english ? en : fr;
  const googleErrors: Record<GoogleAuthErrorCode, string> = {
    google_not_configured: l("La connexion Google n’est pas encore configurée pour cet espace. Utilisez votre adresse e-mail et votre mot de passe.", "Google sign-in is not configured for this workspace yet. Use your email and password."),
    google_origin_not_configured: l("Le domaine du site n’est pas configuré pour la connexion Google. Le BR doit vérifier l’adresse de retour.", "This site domain is not configured for Google sign-in. The executive board needs to check the return address."),
    google_provider_disabled: l("La connexion Google doit être activée par le BR dans Supabase.", "The executive board needs to enable Google sign-in in Supabase."),
    google_signups_open: l("Pour autoriser Google aux comptes BDE existants, le BR doit désactiver les inscriptions publiques dans Supabase.", "To allow Google sign-in for existing BDE accounts, the executive board must disable public sign-ups in Supabase."),
    google_service_unavailable: l("Le service de connexion Google est momentanément indisponible. Réessayez dans quelques instants.", "The Google sign-in service is temporarily unavailable. Please try again in a moment."),
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
          <input type="hidden" name="next" value={returnPath} />
          <GoogleSignInButton english={english} />
          <p id="google-login-help" className="mt-3 text-center text-xs leading-relaxed text-on-surface-variant">{l("Utilisez le compte Google associé à votre compte BDE. Si nécessaire, liez-le d’abord depuis les paramètres de votre compte.", "Use the Google account linked to your BDE account. If needed, link it first in your account settings.")}</p>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-on-surface-variant"><span className="h-px flex-1 bg-outline-variant/20" /><span>{l("ou avec votre mot de passe", "or with your password")}</span><span className="h-px flex-1 bg-outline-variant/20" /></div>

        <form action={login}>
          <input type="hidden" name="next" value={returnPath} />
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="font-label text-xs uppercase tracking-wider text-on-surface-variant">{dict.login.email}</label>
              <input id="email" name="email" type="email" autoComplete="username" required className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-on-surface transition-colors focus:border-primary focus:ring-0" placeholder="admin@bdeceri.fr" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="font-label text-xs uppercase tracking-wider text-on-surface-variant">{dict.login.password}</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-on-surface transition-colors focus:border-primary focus:ring-0" placeholder="••••••••" />
            </div>
            <button type="submit" className="min-h-12 w-full rounded-lg bg-primary py-3 font-bold text-on-primary transition-all hover:shadow-[0_0_20px_rgba(188,199,222,0.2)] active:scale-[0.98]">{dict.login.submit}</button>
          </div>
        </form>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          {l("Accès réservé aux membres autorisés du BDE CERI.", "Restricted to authorized BDE CERI members.")}
        </p>
      </div>
    </div>
  );
}
