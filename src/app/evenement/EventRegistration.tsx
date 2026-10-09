"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cancelEventRegistration, registerForEvent } from "./registration-actions";
import type { EventRegistrationErrorCode, EventRegistrationStatus } from "@/types/event-registrations";
import { formatParisDateTime } from "@/utils/paris-time";
import { formatEventPrice, normalizeHelloAssoCheckoutUrl } from "@/utils/event-payment";

type Props = {
  eventId: string;
  initialStatus: EventRegistrationStatus | null;
  signedIn: boolean;
  english: boolean;
};

export default function EventRegistration({ eventId, initialStatus, signedIn, english }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<EventRegistrationErrorCode | null>(null);
  const [notice, setNotice] = useState("");
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const [pending, startTransition] = useTransition();
  const l = (fr: string, en: string) => english ? en : fr;
  const loginUrl = "/login?next=" + encodeURIComponent("/evenement/" + eventId + "#inscription");
  const full = status !== null && status.max_capacity !== null && status.registrations_count >= status.max_capacity;
  const placesLeft = status?.max_capacity !== null && status?.max_capacity !== undefined
    ? Math.max(0, status.max_capacity - status.registrations_count)
    : null;
  const eligible = signedIn && status?.member_eligible;
  const isPaid = status?.payment_required === true;
  const priceLabel = typeof status?.payment_amount_cents === "number" ? formatEventPrice(status.payment_amount_cents, english) : "";
  const checkoutUrl = normalizeHelloAssoCheckoutUrl(status?.checkout_url);
  const buttonClass = "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-on-primary transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:cursor-wait disabled:opacity-60";

  const submit = (cancel: boolean) => {
    setError("");
    setErrorCode(null);
    setNotice("");
    startTransition(async () => {
      try {
        const result = await (cancel ? cancelEventRegistration(eventId, english) : registerForEvent(eventId, english));
        if (!result.success) {
          setError(result.error);
          setErrorCode(result.code);
          if (result.code === "FULL" || result.code === "CLOSED") router.refresh();
          return;
        }
        setStatus(result.status);
        setConfirmCancellation(false);
        setNotice(cancel
          ? l("Votre inscription a été annulée. La place est à nouveau disponible.", "Your registration has been cancelled. The place is available again.")
          : result.status.payment_required
            ? l("Votre réservation est enregistrée. Le lien HelloAsso ci-dessus permet de régler votre participation.", "Your reservation has been saved. Use the HelloAsso link above to pay for your place.")
            : l("Votre inscription est confirmée et liée à votre compte BDE.", "Your registration is confirmed and linked to your BDE account."));
      } catch {
        setError(l("Impossible de confirmer votre demande. Réessayez dans quelques instants.", "Your request could not be confirmed. Please try again in a moment."));
      }
    });
  };

  return (
    <section id="inscription" aria-labelledby="event-registration-heading" className="mt-8 scroll-mt-[calc(6rem+env(safe-area-inset-top))] border-t border-outline-variant/20 pt-6">
      <h4 id="event-registration-heading" className="mb-3 flex items-center gap-2 font-headline text-lg font-bold">
        <span aria-hidden="true" className="material-symbols-outlined text-tertiary">how_to_reg</span>
        {l("Votre inscription", "Your registration")}
      </h4>

      {status && <div className="mb-4 flex items-start gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-high p-3">
        <span aria-hidden="true" className="material-symbols-outlined text-xl text-tertiary">{isPaid ? "confirmation_number" : "check_circle"}</span>
        <div>
          <p className="text-sm font-bold">{isPaid ? l("Inscription payante · ", "Paid registration · ") + priceLabel : l("Inscription gratuite", "Free registration")}</p>
          {isPaid && !status.registered && <p className="mt-1 text-xs leading-5 text-on-surface-variant">{l("Réservez votre place avec votre compte, puis réglez sur HelloAsso. Le bureau vérifiera le paiement.", "Reserve a place with your account, then pay through HelloAsso. The board will check the payment.")}</p>}
        </div>
      </div>}

      {status && (
        <div className="mb-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold">{status.registrations_count} {l("inscrit(s)", "registered")}{status.max_capacity !== null && " / " + status.max_capacity}</span>
            <span className="text-on-surface-variant">{!status.registration_open
              ? l("Inscriptions closes", "Registration closed")
              : full ? l("Complet", "Full")
                : placesLeft !== null ? placesLeft + " " + l("place(s) disponible(s)", "place(s) available")
                  : l("Inscriptions ouvertes", "Registration open")}</span>
          </div>
          {status.max_capacity !== null && (
            <progress max={status.max_capacity} value={Math.min(status.registrations_count, status.max_capacity)} aria-label={l("Places réservées", "Reserved places")} className="mt-3 h-1.5 w-full overflow-hidden rounded-full accent-tertiary" />
          )}
        </div>
      )}

      {!status ? (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
          <p role="status" className="text-sm leading-6 text-on-surface-variant">{l("Les inscriptions sont momentanément indisponibles. Les informations de l’événement restent accessibles.", "Registration is temporarily unavailable. You can still read the event information.")}</p>
          <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant/30 px-3 py-2 text-xs font-semibold disabled:opacity-60">
            <span aria-hidden="true" className="material-symbols-outlined text-base">refresh</span>{l("Réessayer", "Try again")}
          </button>
        </div>
      ) : status.registered ? (
        <div className="rounded-2xl border border-tertiary/30 bg-tertiary/10 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-tertiary">
            <span aria-hidden="true" className="material-symbols-outlined text-xl">check_circle</span>{isPaid ? l("Inscription enregistrée · paiement requis", "Registration saved · payment required") : l("Vous êtes inscrit", "You are registered")}
          </p>
          {status.registered_at && <p className="mt-2 text-xs leading-5 text-on-surface-variant">{l("Inscription enregistrée le ", "Registered on ")}{formatParisDateTime(status.registered_at, { dateStyle: "medium", timeStyle: "short" }, english ? "en-GB" : "fr-FR")}</p>}
          {isPaid && (
            <div className="mt-4 space-y-3 border-t border-tertiary/20 pt-4">
              <p className="text-sm font-semibold">{l("Règlement : ", "Payment: ")}{priceLabel}</p>
              <p className="text-xs leading-5 text-on-surface-variant">{l("Si vous n’avez pas encore payé, utilisez le lien HelloAsso. Si vous avez déjà réglé, ne payez pas une seconde fois : le bureau vérifie les paiements dans HelloAsso.", "If you have not paid yet, use the HelloAsso link. If you have already paid, do not pay again: the board checks payments in HelloAsso.")}</p>
              {checkoutUrl ? (
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className={buttonClass} aria-label={l("Ouvrir le paiement HelloAsso dans un nouvel onglet", "Open HelloAsso payment in a new tab")}>
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">payments</span>
                  {l("Payer ", "Pay ")}{priceLabel}{l(" sur HelloAsso", " with HelloAsso")}
                  <span aria-hidden="true" className="material-symbols-outlined text-base">open_in_new</span>
                </a>
              ) : <p className="rounded-xl bg-surface-container-high p-3 text-xs leading-5">{l("Le lien de paiement n’est plus disponible. ", "The payment link is no longer available. ")}<Link href="/contact" className="font-semibold underline underline-offset-4">{l("Contactez le bureau pour finaliser votre inscription.", "Contact the board to complete your registration.")}</Link></p>}
              <p className="text-xs font-semibold text-on-surface-variant">{l("Paiement à vérifier par le bureau", "Payment to be checked by the board")}</p>
            </div>
          )}

          {status.registration_open && (confirmCancellation ? (
            <div className="mt-4 border-t border-tertiary/20 pt-4">
              <p className="mb-3 text-xs leading-5">{isPaid
                ? l("Annuler votre inscription ? Votre place sera libérée. Un paiement déjà effectué ne sera pas remboursé automatiquement : contactez le bureau.", "Cancel your registration? Your place will be released. A payment already made will not be refunded automatically: contact the board.")
                : l("Annuler votre inscription ? Votre place sera libérée.", "Cancel your registration? Your place will be released.")}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending} onClick={() => setConfirmCancellation(false)} className="min-h-11 rounded-xl border border-outline-variant/30 px-3 py-2 text-xs font-semibold disabled:opacity-60">{l("Conserver", "Keep registration")}</button>
                <button type="button" disabled={pending} aria-busy={pending} onClick={() => submit(true)} className="min-h-11 rounded-xl bg-error-container/30 px-3 py-2 text-xs font-bold text-error disabled:opacity-60">{pending ? l("Annulation…", "Cancelling…") : l("Confirmer l’annulation", "Confirm cancellation")}</button>
              </div>
            </div>
          ) : <button type="button" disabled={pending} onClick={() => setConfirmCancellation(true)} className="mt-3 min-h-11 text-xs font-semibold underline underline-offset-4 disabled:opacity-60">{l("Annuler mon inscription", "Cancel my registration")}</button>)}
        </div>
      ) : !status.registration_enabled ? (
        <p className="rounded-xl border border-outline-variant/20 bg-surface-container-high p-4 text-center text-sm leading-6 text-on-surface-variant">{l("Cet événement est informatif et ne nécessite pas d’inscription.", "This is an informational event; registration is not required.")}</p>
      ) : !status.registration_open || full ? (
        <p className="rounded-xl bg-surface-container-high p-4 text-center text-sm font-semibold text-on-surface-variant">{full && status.registration_open ? l("Toutes les places sont réservées.", "All places are reserved.") : l("Les inscriptions sont closes pour cet événement.", "Registration is closed for this event.")}</p>
      ) : !signedIn ? (
        <>
          <Link href={loginUrl} className={buttonClass}>
            <span aria-hidden="true" className="material-symbols-outlined text-lg">login</span>{l("Se connecter pour s’inscrire", "Sign in to register")}
          </Link>
          <p className="mt-3 text-center text-xs leading-5 text-on-surface-variant">{l("Vous reviendrez sur cet événement après la connexion.", "You will return to this event after signing in.")}</p>
        </>
      ) : !eligible ? (
        <p className="rounded-xl bg-surface-container-high p-4 text-sm leading-6 text-on-surface-variant">{l("Votre compte n’est pas encore associé à un profil BDE. ", "Your account is not linked to a BDE profile yet. ")}<Link href="/contact" className="font-semibold underline underline-offset-4">{l("Contacter le bureau", "Contact the board")}</Link></p>
      ) : (
        <button type="button" disabled={pending} aria-busy={pending} onClick={() => submit(false)} className={buttonClass}>
          <span aria-hidden="true" className={"material-symbols-outlined text-lg " + (pending ? "animate-spin motion-reduce:animate-none" : "")}>{pending ? "progress_activity" : "how_to_reg"}</span>
          {pending ? l("Inscription…", "Registering…") : isPaid ? l("Réserver ma place · ", "Reserve my place · ") + priceLabel : l("M’inscrire à cet événement", "Register for this event")}
        </button>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl border border-error/20 bg-error/5 p-3 text-sm leading-6 text-error">{error}{errorCode === "AUTH_REQUIRED" && <Link href={loginUrl} className="ml-1 font-semibold underline underline-offset-4">{l("Se reconnecter", "Sign in again")}</Link>}</p>}
      {notice && <p role="status" className="mt-3 text-sm leading-6 text-on-surface-variant">{notice}</p>}
      {status && <p className="mt-4 text-xs leading-5 text-on-surface-variant">{l("Votre identité et la date d’inscription sont accessibles au bureau restreint pour organiser l’événement. ", "Your identity and registration date are available to the executive board to organise the event. ")}<Link href="/confidentialite" className="underline underline-offset-4">{l("Confidentialité", "Privacy")}</Link></p>}
    </section>
  );
}
