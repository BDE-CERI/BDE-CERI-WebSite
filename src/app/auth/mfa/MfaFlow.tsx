"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function MfaFlow({ next, english = false }: { next: string; english?: boolean }) {
  const router = useRouter();
  const started = useRef(false);
  const [phase, setPhase] = useState<"loading" | "enroll" | "challenge" | "error">("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const l = (fr: string, en: string) => english ? en : fr;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const supabase = createClient();
        const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.mfa.listFactors(),
        ]);
        if (assuranceError || factorsError) throw assuranceError || factorsError;
        const verified = factors.totp.find(item => item.status === "verified");
        if (verified && assurance.currentLevel === "aal2") { router.replace(next); return; }
        if (verified) { setFactorId(verified.id); setPhase("challenge"); return; }
        const enrollment = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "BDE CERI · Authy compatible" });
        if (enrollment.error) throw enrollment.error;
        setFactorId(enrollment.data.id); setQr(enrollment.data.totp.qr_code); setSecret(enrollment.data.totp.secret); setPhase("enroll");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : l("Impossible de charger la vérification à deux facteurs.", "Could not load two-factor verification."));
        setPhase("error");
      }
    })();
  }, [next, router]);

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6,8}$/.test(code)) { setError(l("Saisissez le code à usage unique de votre application.", "Enter the one-time code from your authenticator app.")); return; }
    setPending(true); setError("");
    try {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const result = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
      if (result.error) throw result.error;
      router.replace(next); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : l("Le code n’a pas pu être vérifié. Réessayez.", "The code could not be verified. Try again."));
    } finally { setPending(false); }
  };

  return <main className="mx-auto flex min-h-[65vh] w-full max-w-lg items-center px-4 py-16"><section className="w-full rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-xl sm:p-8">
    <span aria-hidden="true" className="material-symbols-outlined rounded-2xl bg-tertiary/10 p-3 text-3xl text-tertiary">enhanced_encryption</span>
    <h1 className="mt-5 font-headline text-2xl font-bold">{l("Vérification en deux étapes", "Two-step verification")}</h1>
    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{l("Le bureau doit confirmer son identité avec un code Authy ou une autre application TOTP avant d’ouvrir l’administration.", "Board members must confirm their identity with an Authy or other TOTP app code before opening the admin area.")}</p>
    {phase === "loading" && <p role="status" className="mt-6 text-sm text-on-surface-variant">{l("Préparation de la vérification…", "Preparing verification…")}</p>}
    {phase === "error" && <div role="alert" className="mt-6 rounded-xl border border-error/20 bg-error/5 p-4 text-sm leading-6 text-error">{error}<p className="mt-2 text-xs">{l("Vous pouvez actualiser la page ou contacter un administrateur.", "Refresh the page or contact an administrator.")}</p></div>}
    {phase === "enroll" && <div className="mt-6 space-y-4"><p className="text-sm leading-6">{l("Scannez ce QR code dans Authy (ou une application compatible TOTP), puis saisissez le code affiché.", "Scan this QR code in Authy (or another TOTP app), then enter the code it displays.")}</p>{qr && <img src={qr} alt={l("QR code de configuration de l’authentification", "Authentication setup QR code")} className="mx-auto size-48 rounded-xl bg-white p-3" />}<p className="text-xs text-on-surface-variant">{l("Si vous ne pouvez pas scanner le code, saisissez cette clé dans l’application :", "If you cannot scan the QR code, enter this key in the app:")}</p><code className="block break-all rounded-xl bg-surface-container-lowest p-3 text-center text-sm font-bold tracking-wider">{secret}</code></div>}
    {phase === "challenge" && <p className="mt-6 text-sm leading-6">{l("Saisissez le code à six chiffres de votre application Authy ou TOTP.", "Enter the six-digit code from your Authy or TOTP app.")}</p>}
    {(phase === "enroll" || phase === "challenge") && <form onSubmit={verify} className="mt-5 space-y-4"><label className="block text-sm font-semibold" htmlFor="totp-code">{l("Code de vérification", "Verification code")}</label><input id="totp-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" required className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-center text-xl tracking-[.35em]" />{error && <p role="alert" className="text-sm text-error">{error}</p>}<button disabled={pending} className="w-full rounded-xl bg-tertiary px-4 py-3 text-sm font-bold text-on-tertiary disabled:opacity-60">{pending ? l("Vérification…", "Verifying…") : l("Vérifier et continuer", "Verify and continue")}</button></form>}
  </section></main>;
}
