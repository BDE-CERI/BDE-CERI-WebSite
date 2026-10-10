"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type TotpFactor = { id: string; friendly_name?: string; status: string; created_at?: string };
export default function MfaSettings({ required, recommended, english = false }: { required: boolean; recommended: boolean; english?: boolean }) {
  const router = useRouter();
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [disableId, setDisableId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const l = (fr: string, en: string) => english ? en : fr;
  const load = useCallback(async () => {
    const { data, error: loadError } = await createClient().auth.mfa.listFactors();
    if (loadError) setError(l("La liste des facteurs n’a pas pu être chargée.", "Could not load authentication factors."));
    else setFactors(data.totp as TotpFactor[]);
    setLoaded(true);
  }, [english]);
  useEffect(() => { void load(); }, [load]);
  const verified = factors.filter(factor => factor.status === "verified");

  const startEnrollment = async () => {
    setPending(true); setError(""); setNotice("");
    try {
      const result = await createClient().auth.mfa.enroll({ factorType: "totp", friendlyName: "BDE CERI · Authy compatible" });
      if (result.error) throw result.error;
      setFactorId(result.data.id); setQr(result.data.totp.qr_code); setSecret(result.data.totp.secret); setCode("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : l("La configuration n’a pas pu démarrer.", "Could not start setup.")); }
    finally { setPending(false); }
  };
  const enable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const result = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
      if (result.error) throw result.error;
      setQr(""); setSecret(""); setFactorId(""); setCode(""); setNotice(l("L’authentification à deux facteurs est activée.", "Two-factor authentication is enabled."));
      await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : l("Code incorrect. Réessayez.", "Incorrect code. Try again.")); }
    finally { setPending(false); }
  };
  const disable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId: disableId });
      if (challenge.error) throw challenge.error;
      const verifiedCode = await supabase.auth.mfa.verify({ factorId: disableId, challengeId: challenge.data.id, code });
      if (verifiedCode.error) throw verifiedCode.error;
      const removed = await supabase.auth.mfa.unenroll({ factorId: disableId });
      if (removed.error) throw removed.error;
      setDisableId(""); setCode(""); setNotice(l("Le facteur a été supprimé.", "The factor has been removed."));
      await load(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : l("Le facteur n’a pas pu être supprimé.", "Could not remove the factor.")); }
    finally { setPending(false); }
  };

  return <section aria-labelledby="account-mfa-title" className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-7">
    <div className="mb-5 flex items-start gap-3"><span aria-hidden="true" className="material-symbols-outlined rounded-xl bg-tertiary/10 p-2 text-xl text-tertiary">security</span><div><h3 id="account-mfa-title" className="font-headline text-lg font-bold">{l("Authentification à deux facteurs", "Two-factor authentication")}</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">{l("Utilisez Authy ou une autre application générant des codes TOTP.", "Use Authy or another app that generates TOTP codes.")}</p></div></div>
    {required ? <p className="mb-4 rounded-xl border border-error/20 bg-error/5 p-3 text-sm leading-6">{l("Obligatoire pour accéder aux outils d’administration du site.", "Required to access site administration tools.")}</p> : recommended && <p className="mb-4 rounded-xl border border-tertiary/20 bg-tertiary/5 p-3 text-sm leading-6">{l("Fortement recommandé pour les vice-présidences.", "Strongly recommended for vice presidents.")}</p>}
    {notice && <p role="status" className="mb-4 rounded-xl border border-tertiary/20 bg-tertiary/5 p-3 text-sm">{notice}</p>}{error && <p role="alert" className="mb-4 rounded-xl border border-error/20 bg-error/5 p-3 text-sm leading-6 text-error">{error}</p>}
    {!loaded ? <p role="status" className="text-sm text-on-surface-variant">{l("Chargement…", "Loading…")}</p> : verified.length ? <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-4"><span className="inline-flex items-center gap-2 text-sm font-semibold"><span aria-hidden="true" className="material-symbols-outlined text-tertiary">verified_user</span>{l("Application vérifiée", "Authenticator verified")}</span><span className="text-xs text-on-surface-variant">{verified[0].friendly_name || "TOTP"}</span></div>{!required && <button type="button" onClick={() => { setDisableId(verified[0].id); setCode(""); setError(""); }} className="rounded-xl border border-error/25 px-4 py-2.5 text-sm font-semibold text-error hover:bg-error/5">{l("Désactiver l’authentification à deux facteurs", "Turn off two-factor authentication")}</button>}{disableId && <form onSubmit={disable} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4"><label htmlFor="disable-totp-code" className="block text-sm font-semibold">{l("Confirmez avec un code de votre application", "Confirm with a code from your authenticator")}</label><input id="disable-totp-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" required className="mt-3 w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-center tracking-[.35em]" /><div className="mt-3 flex gap-2"><button disabled={pending} className="rounded-xl bg-error px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{l("Confirmer la désactivation", "Confirm disable")}</button><button type="button" onClick={() => setDisableId("")} className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-semibold">{l("Annuler", "Cancel")}</button></div></form>}</div> : <div className="space-y-4">{factorId ? <><p className="text-sm leading-6">{l("Scannez le QR code avec Authy ou une application TOTP, puis confirmez le code.", "Scan the QR code with Authy or another TOTP app, then confirm its code.")}</p>{qr && <img src={qr} alt={l("QR code de configuration", "Setup QR code")} className="size-44 rounded-xl bg-white p-2" />}<p className="text-xs text-on-surface-variant">{l("Clé de configuration manuelle", "Manual setup key")}</p><code className="block break-all rounded-lg bg-surface-container-lowest p-3 text-sm">{secret}</code><form onSubmit={enable} className="space-y-3"><label htmlFor="enable-totp-code" className="block text-sm font-semibold">{l("Code de vérification", "Verification code")}</label><input id="enable-totp-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" required className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-center tracking-[.35em]" /><button disabled={pending} className="rounded-xl bg-tertiary px-4 py-2.5 text-sm font-bold text-on-tertiary disabled:opacity-50">{l("Activer le facteur", "Enable authenticator")}</button></form></> : <><p className="text-sm leading-6 text-on-surface-variant">{l("Aucune application TOTP vérifiée n’est liée à ce compte.", "No verified TOTP authenticator is linked to this account.")}</p><button type="button" onClick={() => void startEnrollment()} disabled={pending} className="rounded-xl bg-tertiary px-4 py-2.5 text-sm font-bold text-on-tertiary disabled:opacity-50">{pending ? l("Préparation…", "Preparing…") : l("Configurer Authy / TOTP", "Set up Authy / TOTP")}</button></>}</div>}
  </section>;
}
