"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { listEventRegistrations } from "@/app/evenement/registration-actions";
import type { EventRegistrant } from "@/types/event-registrations";
import { formatParisDateTime } from "@/utils/paris-time";
import { formatEventPrice } from "@/utils/event-payment";
import { EmptyState, inputClass } from "./AdminUI";

const PAGE_SIZE = 50;
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/30 px-3.5 py-2.5 text-sm font-semibold transition hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:cursor-not-allowed disabled:opacity-50";

type EventSummary = {
  id: string;
  title: string;
  date_start: string;
  location: string;
  max_capacity?: number;
  registration_is_paid?: boolean;
  registration_price_cents?: number | null;
  helloasso_checkout_url?: string | null;
};

type RegistrationResult = { registrations: EventRegistrant[]; total: number } | { error: string };

function RegistrationResults({ eventId, offset, query, english, onPage, onRetry }: {
  eventId: string;
  offset: number;
  query: string;
  english: boolean;
  onPage: (offset: number) => void;
  onRetry: () => void;
}) {
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const l = (fr: string, en: string) => english ? en : fr;

  useEffect(() => {
    // Each request is mounted with a new key. Ignore any response that arrives
    // after the event, search or page has changed or this panel has closed.
    let active = true;
    void listEventRegistrations(eventId, offset, query, english).then((response) => {
      if (!active) return;
      if (!response.success) {
        setResult({ error: response.error });
        return;
      }
      if (offset > 0 && offset >= response.total) {
        onPage(response.total > 0 ? Math.floor((response.total - 1) / PAGE_SIZE) * PAGE_SIZE : 0);
        return;
      }
      setResult({ registrations: response.registrations, total: response.total });
    }).catch(() => {
      if (active) setResult({ error: english
        ? "The registration list could not be loaded. Please try again."
        : "La liste des inscrits n’a pas pu être chargée. Réessayez." });
    });
    return () => { active = false; };
  }, [eventId, offset, query, english, onPage]);

  if (!result) return <div aria-busy="true" className="space-y-3">
    <p role="status" className="flex items-center gap-2 text-sm text-on-surface-variant">
      <span aria-hidden="true" className="material-symbols-outlined motion-safe:animate-spin text-lg">progress_activity</span>
      {l("Chargement des inscrits…", "Loading registrations…")}
    </p>
    <div aria-hidden="true" className="space-y-3">
      {[0, 1, 2].map(index => <div key={index} className="flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4">
        <div className="h-11 w-11 shrink-0 rounded-full bg-surface-container-high motion-safe:animate-pulse" />
        <div className="flex-1 space-y-2"><div className="h-3 w-1/3 rounded bg-surface-container-high motion-safe:animate-pulse" /><div className="h-3 w-1/2 rounded bg-surface-container-high motion-safe:animate-pulse" /></div>
      </div>)}
    </div>
  </div>;

  if ("error" in result) return <div role="alert" className="rounded-2xl border border-error/25 bg-error/5 p-5">
    <p className="text-sm leading-6 text-error">{result.error}</p>
    <button type="button" onClick={onRetry} className={buttonClass + " mt-4"}>
      <span aria-hidden="true" className="material-symbols-outlined text-lg">refresh</span>
      {l("Réessayer", "Try again")}
    </button>
  </div>;

  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return <div className="space-y-4">
    <p role="status" className="text-sm font-semibold text-on-surface-variant">
      {result.total} {query ? l("résultat(s)", "result(s)") : l("inscrit(s)", "registration(s)")}
      {result.total > 0 && <span className="ml-2 font-normal">· {offset + 1}–{offset + result.registrations.length}</span>}
    </p>
    {result.registrations.length === 0
      ? <EmptyState icon={query ? "person_search" : "groups"} title={query ? l("Aucun inscrit correspondant", "No matching registrations") : l("Aucune inscription pour le moment", "No registrations yet")} description={query ? l("Essayez un autre prénom ou nom.", "Try another first or last name.") : l("Les comptes inscrits depuis la page de l’événement apparaîtront ici.", "Accounts registered from the event page will appear here.")} />
      : <ul className="space-y-3">
        {result.registrations.map(registration => {
          const name = [registration.first_name, registration.last_name].filter(Boolean).join(" ") || l("Membre", "Member");
          const initials = ((registration.first_name?.[0] || "") + (registration.last_name?.[0] || "")).toLocaleUpperCase();
          return <li key={registration.id} className="min-w-0 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/10 text-sm font-bold text-secondary">
                  {registration.photo_url ? <Image src={registration.photo_url} alt="" width={44} height={44} loading="lazy" unoptimized className="h-full w-full object-cover" /> : initials || <span className="material-symbols-outlined text-xl">person</span>}
                </div>
                <div className="min-w-0">
                  <p className="break-words font-semibold text-on-surface">{name}</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    {l("Inscription le ", "Registered on ")}
                    <time dateTime={registration.registered_at}>{formatParisDateTime(registration.registered_at, { dateStyle: "medium", timeStyle: "short" }, english ? "en-GB" : "fr-FR") || "—"}</time>
                  </p>
                  <p className={"mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold " + (registration.payment_required ? "bg-tertiary/10 text-tertiary" : "bg-secondary/10 text-secondary")}>
                    <span aria-hidden="true" className="material-symbols-outlined text-base">{registration.payment_required ? "payments" : "confirmation_number"}</span>
                    {registration.payment_required
                      ? <>{l("Paiement à vérifier", "Payment to verify")} · {typeof registration.payment_amount_cents === "number" && registration.payment_amount_cents > 0 ? formatEventPrice(registration.payment_amount_cents, english) : l("Montant à vérifier", "Amount to verify")}</>
                      : l("Gratuit", "Free")}
                  </p>
                </div>
              </div>
              {registration.is_visible
                ? <Link href={"/equipe/" + registration.member_id} className={buttonClass + " shrink-0 text-secondary"} aria-label={l("Voir le profil public de ", "View the public profile of ") + name}>
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">person</span>{l("Profil public", "Public profile")}
                  <span aria-hidden="true" className="material-symbols-outlined text-base">arrow_outward</span>
                </Link>
                : <span className="inline-flex min-h-11 shrink-0 items-center gap-2 text-xs text-on-surface-variant">
                  <span aria-hidden="true" className="material-symbols-outlined text-base">visibility_off</span>{l("Profil public masqué", "Public profile hidden")}
                </span>}
            </div>
          </li>;
        })}
      </ul>}
    {result.total > PAGE_SIZE && <nav aria-label={l("Pagination des inscrits", "Registration pages")} className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 pt-4">
      <button type="button" disabled={offset === 0} onClick={() => onPage(Math.max(0, offset - PAGE_SIZE))} className={buttonClass}><span aria-hidden="true" className="material-symbols-outlined text-lg">chevron_left</span>{l("Précédente", "Previous")}</button>
      <p className="text-xs tabular-nums text-on-surface-variant">{l("Page ", "Page ")}{page} / {pages}</p>
      <button type="button" disabled={offset + PAGE_SIZE >= result.total} onClick={() => onPage(offset + PAGE_SIZE)} className={buttonClass}>{l("Suivante", "Next")}<span aria-hidden="true" className="material-symbols-outlined text-lg">chevron_right</span></button>
    </nav>}
  </div>;
}

export default function EventRegistrations({ event, english = false, onClose }: {
  event: EventSummary;
  english?: boolean;
  onClose: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const searchId = useId();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const l = (fr: string, en: string) => english ? en : fr;
  const refresh = () => setRevision(value => value + 1);
  const changePage = useCallback((nextOffset: number) => {
    setOffset(nextOffset);
    // The pagination controls are replaced while loading; retain keyboard
    // focus on the persistent panel heading instead of losing it to the body.
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);

  const search = (submit: FormEvent<HTMLFormElement>) => {
    submit.preventDefault();
    setQuery(draft.trim());
    setOffset(0);
    refresh();
  };

  return <section aria-labelledby={headingId} className="min-w-0 space-y-5 rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4 sm:p-6">
    <header className="space-y-4 border-b border-outline-variant/20 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onClose} className={buttonClass}><span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_back</span>{l("Retour aux événements", "Back to events")}</button>
        <button type="button" onClick={refresh} className={buttonClass} title={l("Recharger la liste des inscrits", "Reload registrations")}><span aria-hidden="true" className="material-symbols-outlined text-lg">refresh</span>{l("Actualiser", "Refresh")}</button>
      </div>
      <div className="min-w-0">
        <p className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary"><span aria-hidden="true" className="material-symbols-outlined text-lg">groups</span>{l("Liste des inscrits", "Registration list")}</p>
        <h3 id={headingId} ref={headingRef} tabIndex={-1} className="break-words font-headline text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary">{event.title}</h3>
        <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">{formatParisDateTime(event.date_start, { dateStyle: "medium", timeStyle: "short" }, english ? "en-GB" : "fr-FR") || "—"}{event.location && <> · {event.location}</>}</p>
        <p className="mt-2 text-xs leading-5 text-on-surface-variant">{l("Les noms complets sont réservés à l’administration. Dates à l’heure de Paris.", "Full names are visible to administrators only. Dates are shown in Paris time.")}{event.max_capacity && event.max_capacity > 0 ? <> {l("Capacité : ", "Capacity: ")}{event.max_capacity}.</> : null}</p>
      </div>
      {event.registration_is_paid && <div className="rounded-xl border border-tertiary/20 bg-tertiary/5 p-3 text-sm leading-6 text-on-surface-variant">
        <p className="font-semibold text-on-surface">{l("Inscription payante", "Paid registration")}{typeof event.registration_price_cents === "number" && event.registration_price_cents > 0 ? <> · {formatEventPrice(event.registration_price_cents, english)}</> : null}</p>
        <p>{l("Vérifiez les paiements dans HelloAsso : cette liste enregistre les inscriptions, sans confirmer leur règlement. Le montant de chaque ligne correspond au tarif lors de l’inscription, même s’il a changé depuis.", "Verify payments in HelloAsso: this list records registrations without confirming payment. Each row keeps the price recorded at registration, even if it has changed since.")}</p>
      </div>}
    </header>
    <form onSubmit={search} role="search" aria-label={l("Rechercher un inscrit", "Search registrations")} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label htmlFor={searchId} className="mb-2 block text-xs font-semibold">{l("Prénom ou nom", "First or last name")}</label>
        <div className="relative">
          <span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">search</span>
          <input id={searchId} type="search" value={draft} onChange={event => setDraft(event.target.value)} maxLength={100} placeholder={l("Rechercher dans les inscrits…", "Search registered members…")} className={inputClass + " min-h-11 pl-10"} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={buttonClass + " flex-1 bg-secondary/10 text-secondary sm:flex-none"}>{l("Rechercher", "Search")}</button>
        {(draft || query) && <button type="button" onClick={() => { setDraft(""); setQuery(""); setOffset(0); refresh(); }} className={buttonClass + " flex-1 sm:flex-none"}>{l("Effacer", "Clear")}</button>}
      </div>
    </form>
    <RegistrationResults key={event.id + ":" + offset + ":" + revision + ":" + query + ":" + english} eventId={event.id} offset={offset} query={query} english={english} onPage={changePage} onRetry={refresh} />
  </section>;
}
