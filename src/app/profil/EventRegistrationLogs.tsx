"use client";

import { useEffect, useState } from "react";
import { listEventRegistrationLogs } from "@/app/evenement/registration-actions";
import type { EventRegistrationLog } from "@/types/event-registrations";
import { formatParisDateTime } from "@/utils/paris-time";
import { formatEventPrice } from "@/utils/event-payment";
import { EmptyState } from "./AdminUI";

const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/30 px-3.5 py-2.5 text-sm font-semibold transition hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary";

export default function EventRegistrationLogs({ event, english = false, onClose }: {
  event: { id: string; title: string } | null;
  english?: boolean;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ logs: EventRegistrationLog[]; total: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const l = (fr: string, en: string) => english ? en : fr;
  useEffect(() => {
    let active = true;
    void listEventRegistrationLogs(event?.id || null, offset, english).then(result => {
      if (!active) return;
      setLoading(false);
      if (result.success) setResult({ logs: result.logs, total: result.total }); else setError(result.error);
    }).catch(() => { if (active) { setLoading(false); setError(english ? "The event log could not be loaded." : "Le journal n’a pas pu être chargé."); } });
    return () => { active = false; };
  }, [event?.id, offset, english]);

  return <section aria-labelledby="event-log-title" className="min-w-0 space-y-5 rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4 sm:p-6">
    <header className="space-y-3 border-b border-outline-variant/20 pb-5">
      <button type="button" onClick={onClose} className={buttonClass}><span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_back</span>{l("Retour aux événements", "Back to events")}</button>
      <div><p className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary"><span aria-hidden="true" className="material-symbols-outlined text-lg">history</span>{l("Journal des inscriptions", "Registration history")}</p><h3 id="event-log-title" className="break-words font-headline text-xl font-bold">{event?.title || l("Tous les événements", "All events")}</h3></div>
      <p className="text-sm leading-6 text-on-surface-variant">{l("Chaque inscription et désinscription est horodatée. Le journal est réservé au bureau restreint.", "Every signup and cancellation is timestamped. The log is restricted to the executive board.")}</p>
    </header>
    {error ? <p role="alert" className="rounded-xl border border-error/25 bg-error/5 p-4 text-sm text-error">{error}</p>
      : loading || !result ? <p role="status" aria-busy="true" className="text-sm text-on-surface-variant">{l("Chargement du journal…", "Loading event history…")}</p>
      : result.logs.length === 0 ? <EmptyState icon="history" title={l("Aucun mouvement enregistré", "No activity recorded")} description={l("Les prochaines inscriptions et désinscriptions apparaîtront ici.", "Future registrations and cancellations will appear here.")} />
      : <><p className="text-xs text-on-surface-variant">{l("Mouvements affichés : ", "Activity shown: ")}{result.logs.length > 0 ? offset + 1 + "–" + (offset + result.logs.length) + " / " : ""}{result.total}</p><ol className="space-y-3">{result.logs.map(log => <li key={log.id} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><p className="flex items-center gap-2 font-semibold text-on-surface"><span aria-hidden="true" className={"material-symbols-outlined " + (log.action === "registered" ? "text-secondary" : "text-tertiary")}>{log.action === "registered" ? "person_add" : "person_remove"}</span>{log.action === "registered" ? l("Inscription", "Registered") : l("Désinscription", "Unregistered")}{log.payment_required && log.payment_amount_cents ? <span className="rounded-full bg-tertiary/10 px-2 py-0.5 text-xs text-tertiary">{formatEventPrice(log.payment_amount_cents, english)}</span> : null}</p>
            <p className="mt-1 break-words text-sm text-on-surface-variant">{log.member_name || l("Membre supprimé", "Deleted member")} <span aria-hidden="true">·</span> {log.event_title}</p>
          </div><time className="shrink-0 text-xs tabular-nums text-on-surface-variant" dateTime={log.logged_at}>{formatParisDateTime(log.logged_at, { dateStyle: "medium", timeStyle: "short" }, english ? "en-GB" : "fr-FR")}</time>
        </div>
      </li>)}</ol>{result.total > 100 && <nav aria-label={l("Pagination du journal", "Event history pages")} className="flex items-center justify-between gap-3 border-t border-outline-variant/20 pt-4"><button type="button" disabled={loading || offset === 0} onClick={() => { setError(""); setLoading(true); setOffset(Math.max(0, offset - 100)); }} className={buttonClass + " disabled:cursor-not-allowed disabled:opacity-50"}>{l("Précédent", "Previous")}</button><button type="button" disabled={loading || offset + 100 >= result.total} onClick={() => { setError(""); setLoading(true); setOffset(offset + 100); }} className={buttonClass + " disabled:cursor-not-allowed disabled:opacity-50"}>{l("Plus ancien", "Older")}</button></nav>}</>}
  </section>;
}
