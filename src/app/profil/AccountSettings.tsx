"use client";

import { useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { linkGoogleAccount } from "@/app/login/google-actions";
import type { AccountEmailRequest } from "@/types/account-settings";
import { formatParisDateTime } from "@/utils/paris-time";
import { requestEmailChange } from "./account-actions";
import { AdminForm, ConfirmDialog, EmptyState, Field, inputClass, useAdminWorkspace } from "./AdminUI";

type Props = {
  email: string;
  googleLinked: boolean;
  googleEmail?: string;
  requests: AccountEmailRequest[];
  requestsUnavailable?: boolean;
  googleStatus?: string;
  googleError?: string;
  english?: boolean;
};

function requestStatus(status: AccountEmailRequest["status"], english: boolean) {
  return status === "pending" ? (english ? "Awaiting review" : "En attente du BR")
    : status === "resolved" ? (english ? "Completed" : "Résolue")
      : (english ? "Declined" : "Refusée");
}

function googleErrorMessage(code: string, english: boolean) {
  const messages: Record<string, [string, string]> = {
    google_not_configured: ["La connexion Google n’est pas encore configurée. Votre connexion habituelle reste disponible.", "Google sign-in has not been configured yet. You can still use your usual sign-in method."],
    google_origin_not_configured: ["Le domaine du site n’est pas configuré pour Google. Le BR doit vérifier l’adresse de retour.", "This site domain is not configured for Google. The executive board needs to check the return address."],
    google_provider_disabled: ["La connexion Google doit être activée par le BR dans Supabase.", "The executive board needs to enable Google sign-in in Supabase."],
    google_signups_open: ["Le BR doit désactiver les inscriptions publiques dans Supabase pour autoriser la connexion Google aux comptes existants.", "The executive board must disable public sign-ups in Supabase to allow Google sign-in for existing accounts."],
    google_service_unavailable: ["Le service Google est momentanément indisponible. Réessayez dans quelques instants.", "The Google service is temporarily unavailable. Please try again in a moment."],
    google_cancelled: ["La liaison Google a été annulée. Vous pouvez réessayer lorsque vous le souhaitez.", "Google linking was cancelled. You can try again whenever you are ready."],
    google_failed: ["La liaison Google n’a pas abouti. Réessayez dans quelques instants.", "Google could not be linked. Please try again in a moment."],
    google_invalid_flow: ["Cette demande de liaison a expiré ou n’est plus valide. Relancez-la depuis cette page.", "This linking request has expired or is no longer valid. Start again from this page."],
    google_access_denied: ["La connexion Google est réservée aux comptes membres déjà autorisés. Contactez le BR pour vérifier votre accès.", "Google sign-in is reserved for existing authorized member accounts. Contact the executive board to check your access."],
    google_account_mismatch: ["La session retournée ne correspond pas au compte BDE qui a demandé la liaison. Reconnectez-vous à votre compte BDE puis recommencez.", "The returned session does not match the BDE account that requested linking. Sign in to your BDE account again, then retry."],
    google_linking_disabled: ["La liaison de comptes Google doit être activée par le BR dans les paramètres d’authentification Supabase.", "The executive board needs to enable Google account linking in the Supabase authentication settings."],
    google_session_expired: ["Votre session a expiré. Reconnectez-vous avant de lier Google.", "Your session has expired. Sign in again before linking Google."],
  };
  const message = messages[code] || messages.google_failed;
  return message[english ? 1 : 0];
}

function GoogleSubmit({ english }: { english: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm font-semibold transition hover:border-tertiary/40 hover:bg-surface-container-highest disabled:cursor-wait disabled:opacity-60 sm:w-auto">
    <span aria-hidden="true" className={"material-symbols-outlined text-lg " + (pending ? "animate-spin" : "")}>{pending ? "progress_activity" : "link"}</span>
    {pending ? (english ? "Opening Google…" : "Ouverture de Google…") : (english ? "Link my Google account" : "Lier mon compte Google")}
  </button>;
}

function EmailRequestForm({ email, english, onClose, onSent }: { email: string; english: boolean; onClose: () => void; onSent: (address: string) => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const confirmed = useRef(false);
  const captureSubmit = (event: FormEvent<HTMLDivElement>) => {
    if (confirmed.current) { confirmed.current = false; return; }
    if (!(event.target instanceof HTMLFormElement)) return;
    event.preventDefault();
    event.stopPropagation();
    formRef.current = event.target;
    setRequestedEmail(String(new FormData(event.target).get("requested_email") || "").trim());
    setConfirmOpen(true);
  };
  return <>
    <div onSubmitCapture={captureSubmit} className="mt-5 border-t border-outline-variant/20 pt-5">
      <AdminForm action={requestEmailChange} submitLabel={english ? "Send request to the board" : "Envoyer la demande au BR"}
        successMessage={english ? "Your request has been saved for the executive board." : "Votre demande a été enregistrée pour le bureau restreint."}
        onSuccess={() => onSent(requestedEmail)} onCancel={onClose}>
        <input type="hidden" name="language" value={english ? "en" : "fr"} />
        <Field label={english ? "Requested email address" : "Nouvelle adresse souhaitée"} required hint={english ? "The executive board will review this address before any account change." : "Le BR examinera cette adresse avant tout changement de votre compte."}>
          <input autoFocus type="email" name="requested_email" required maxLength={254} autoComplete="email" className={inputClass} />
        </Field>
        <Field label={english ? "Reason (optional)" : "Motif (facultatif)"}>
          <textarea name="reason" rows={3} maxLength={2000} className={inputClass + " resize-y"} />
        </Field>
      </AdminForm>
    </div>
    <ConfirmDialog open={confirmOpen} title={english ? "Confirm your email change request" : "Confirmer votre demande de changement"}
      description={english ? "Ask the executive board to change your address from " + email + " to " + requestedEmail + ". Your current sign-in address stays active while the request is reviewed." : "Demander au BR de remplacer " + email + " par " + requestedEmail + ". Votre adresse de connexion actuelle reste active pendant le traitement de la demande."}
      confirmLabel={english ? "Confirm and send" : "Confirmer et envoyer"} cancelLabel={english ? "Back to the form" : "Revenir au formulaire"}
      onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); confirmed.current = true; formRef.current?.requestSubmit(); }} />
  </>;
}

export default function AccountSettings({ email, googleLinked, googleEmail, requests, requestsUnavailable = false, googleStatus, googleError, english = false }: Props) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [recentSubmission, setRecentSubmission] = useState<{ email: string; snapshot: string } | null>(null);
  const requestButtonRef = useRef<HTMLButtonElement>(null);
  const googleFormRef = useRef<HTMLFormElement>(null);
  const googleBypass = useRef(false);
  const { dirtyCount, requestDiscard } = useAdminWorkspace();
  const pendingRequest = requests.find((request) => request.status === "pending");
  const requestSnapshot = requests.map((request) => request.id + ":" + request.status).join("|");
  const awaitingRefresh = recentSubmission?.snapshot === requestSnapshot;
  const closeRequest = () => {
    setRequestOpen(false);
    requestAnimationFrame(() => {
      const target = requestButtonRef.current || document.getElementById("admin-section-title");
      target?.focus({ preventScroll: true });
    });
  };
  return <div className="min-w-0 space-y-6">
    {recentSubmission && <p role="status" className="rounded-xl border border-tertiary/20 bg-tertiary/5 p-4 text-sm leading-6">{english ? "Your request has been saved for the executive board." : "Votre demande a été enregistrée pour le bureau restreint."}</p>}
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
      <section aria-labelledby="account-email-title" className="min-w-0 rounded-3xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-7">
        <div className="mb-5 flex items-start gap-3"><span aria-hidden="true" className="material-symbols-outlined rounded-xl bg-tertiary/10 p-2 text-xl text-tertiary">alternate_email</span><div><h3 id="account-email-title" className="font-headline text-lg font-bold">{english ? "Account email" : "Adresse du compte"}</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">{english ? "Your current sign-in address." : "Votre adresse actuelle de connexion."}</p></div></div>
        <Field label={english ? "Current email address" : "Adresse actuelle"} hint={english ? "Account email changes are handled by the executive board." : "Le changement d’adresse du compte est traité par le bureau restreint."}>
          <input type="email" readOnly value={email} className={inputClass.replace("bg-surface-container-lowest", "bg-surface-container-high").replace("text-on-surface", "text-on-surface-variant") + " cursor-default opacity-80"} />
        </Field>
        {requestsUnavailable ? <p role="alert" className="mt-5 rounded-xl border border-error/20 bg-error/5 p-3 text-xs leading-5 text-on-surface-variant">{english ? "Account requests are temporarily unavailable. The board needs to complete the account settings setup." : "Les demandes de compte sont temporairement indisponibles. Le BR doit terminer la configuration des paramètres de compte."}</p>
          : pendingRequest || awaitingRefresh ? <div role="status" className="mt-5 rounded-xl border border-tertiary/20 bg-tertiary/5 p-4"><p className="text-xs font-bold text-tertiary">{english ? "A request is already awaiting review" : "Une demande est déjà en attente"}</p><p className="mt-2 break-all text-sm">{pendingRequest?.requested_email || recentSubmission?.email}</p><p className="mt-2 text-xs leading-5 text-on-surface-variant">{english ? "You can follow its progress below. A new request will be available once this one has been reviewed." : "Suivez son traitement ci-dessous. Une nouvelle demande sera possible après son examen."}</p></div>
            : requestOpen ? <EmailRequestForm email={email} english={english} onClose={closeRequest} onSent={(address) => { setRecentSubmission({ email: address, snapshot: requestSnapshot }); closeRequest(); }} />
              : <button ref={requestButtonRef} type="button" onClick={() => { setRecentSubmission(null); setRequestOpen(true); }} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tertiary px-4 py-3 text-sm font-bold text-on-tertiary transition hover:brightness-110 sm:w-auto"><span aria-hidden="true" className="material-symbols-outlined text-lg">forward_to_inbox</span>{english ? "Request a change from the board" : "Demander un changement au BR"}</button>}
      </section>
      <section aria-labelledby="account-google-title" className="min-w-0 rounded-3xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-7">
        <div className="mb-5 flex items-start gap-3"><span aria-hidden="true" className="material-symbols-outlined rounded-xl bg-tertiary/10 p-2 text-xl text-tertiary">key</span><div><h3 id="account-google-title" className="font-headline text-lg font-bold">{english ? "Google sign-in" : "Connexion Google"}</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">{english ? "Use Google to access your existing member account." : "Utilisez Google pour retrouver votre compte membre existant."}</p></div></div>
        {googleStatus === "linked" && <p role="status" className="mb-4 rounded-xl border border-tertiary/20 bg-tertiary/5 p-3 text-sm">{english ? "Your Google account is now linked." : "Votre compte Google est maintenant lié."}</p>}
        {googleError && <p role="alert" className="mb-4 rounded-xl border border-error/20 bg-error/5 p-3 text-sm leading-6 text-error">{googleErrorMessage(googleError, english)}</p>}
        <p className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-semibold"><span aria-hidden="true" className={"material-symbols-outlined text-base " + (googleLinked ? "text-tertiary" : "text-on-surface-variant")}>{googleLinked ? "check_circle" : "link_off"}</span>{googleLinked ? (english ? "Google account linked" : "Compte Google lié") : (english ? "No Google account linked" : "Aucun compte Google lié")}</p>
        {googleLinked && googleEmail && <p className="mt-3 break-all text-sm text-on-surface-variant">{googleEmail}</p>}
        <p className="mt-4 text-xs leading-6 text-on-surface-variant">{english ? "Google sign-in is reserved for existing authorized member accounts. Linking keeps your current member profile and permissions." : "La connexion Google est réservée aux comptes membres déjà autorisés. La liaison conserve votre fiche membre et vos droits actuels."}</p>
        {!googleLinked && <form ref={googleFormRef} action={linkGoogleAccount} className="mt-5" onSubmit={(event) => {
          if (!dirtyCount || googleBypass.current) return;
          event.preventDefault();
          requestDiscard(() => { setRequestOpen(false); googleBypass.current = true; googleFormRef.current?.requestSubmit(); });
        }}><GoogleSubmit english={english} /></form>}
      </section>
    </div>
    <section aria-labelledby="account-history-title" className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h3 id="account-history-title" className="font-headline text-lg font-bold">{english ? "My email change requests" : "Mes demandes de changement d’adresse"}</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">{english ? "Your 50 most recent requests and the board’s responses. Dates are shown in Paris time." : "Vos 50 dernières demandes et les réponses du bureau restreint. Les dates sont affichées à l’heure de Paris."}</p></div><span className="rounded-lg bg-surface-container-high px-2 py-1 text-xs tabular-nums">{requests.length}</span></div>
      {requestsUnavailable ? <p className="text-sm leading-6 text-on-surface-variant">{english ? "Your request history is temporarily unavailable." : "L’historique de vos demandes est temporairement indisponible."}</p> : requests.length === 0 ? <EmptyState icon="mark_email_read" title={english ? "No requests yet" : "Aucune demande pour le moment"} description={english ? "Your requests and the board’s responses will appear here." : "Vos demandes et les réponses du BR apparaîtront ici."} /> : <ol className="space-y-3">
        {requests.map((request) => <li key={request.id} className="min-w-0 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className={"rounded-lg px-2.5 py-1 text-xs font-semibold " + (request.status === "pending" ? "bg-tertiary/10 text-tertiary" : request.status === "rejected" ? "bg-error/10 text-error" : "bg-surface-container-high text-on-surface")}>{requestStatus(request.status, english)}</span><time dateTime={request.created_at} className="text-xs text-on-surface-variant">{formatParisDateTime(request.created_at, undefined, english ? "en-GB" : "fr-FR") || "—"}</time></div>
          <div className="mt-3 grid min-w-0 gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"><p className="break-all text-on-surface-variant">{request.current_email}</p><span aria-hidden="true" className="material-symbols-outlined hidden text-base text-tertiary sm:block">arrow_forward</span><p className="break-all font-semibold"><span className="sr-only">{english ? "Requested address: " : "Adresse souhaitée : "}</span>{request.requested_email}</p></div>
          {request.reason && <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-on-surface-variant">{request.reason}</p>}
          {request.review_response && <div className="mt-4 rounded-xl bg-surface-container-high/60 p-3"><p className="mb-1 text-xs font-semibold">{english ? "Board response" : "Réponse du BR"}</p><p className="whitespace-pre-wrap break-words text-sm leading-6 text-on-surface-variant">{request.review_response}</p></div>}
          {request.reviewed_at && <p className="mt-3 text-xs text-on-surface-variant">{english ? "Reviewed on " : "Traitée le "}<time dateTime={request.reviewed_at}>{formatParisDateTime(request.reviewed_at, undefined, english ? "en-GB" : "fr-FR") || "—"}</time></p>}
        </li>)}
      </ol>}
    </section>
  </div>;
}
