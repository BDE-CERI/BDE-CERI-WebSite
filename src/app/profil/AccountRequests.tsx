"use client";

import { useRef, useState, type FormEvent } from "react";
import type { AccountEmailRequest } from "@/types/account-settings";
import { formatParisDateTime } from "@/utils/paris-time";
import { reviewEmailChangeRequest } from "./account-actions";
import { AdminForm, ConfirmDialog, EmptyState, Field, ManagerToolbar, inputClass, useAdminWorkspace } from "./AdminUI";

type Decision = "resolved" | "rejected";
type Filter = "all" | AccountEmailRequest["status"];

function statusLabel(status: AccountEmailRequest["status"], english: boolean) {
  return status === "pending" ? (english ? "Awaiting review" : "En attente")
    : status === "resolved" ? (english ? "Completed" : "Résolue")
      : (english ? "Declined" : "Refusée");
}

function EmailAddresses({ request, english }: { request: AccountEmailRequest; english: boolean }) {
  return <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
    <dl className="min-w-0"><dt className="mb-1 text-[11px] font-semibold text-on-surface-variant">{english ? "Current account address" : "Adresse actuelle du compte"}</dt><dd className="break-all text-sm">{request.current_email}</dd></dl>
    <span aria-hidden="true" className="material-symbols-outlined hidden self-center text-xl text-tertiary sm:block">arrow_forward</span>
    <dl className="min-w-0"><dt className="mb-1 text-[11px] font-semibold text-on-surface-variant">{english ? "Requested address" : "Adresse souhaitée"}</dt><dd className="break-all text-sm font-semibold">{request.requested_email}</dd></dl>
  </div>;
}

function ReviewEditor({ request, decision, english, onClose, onSuccess }: { request: AccountEmailRequest; decision: Decision; english: boolean; onClose: () => void; onSuccess: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmed = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const resolved = decision === "resolved";
  const captureSubmit = (event: FormEvent<HTMLDivElement>) => {
    if (confirmed.current) { confirmed.current = false; return; }
    if (!(event.target instanceof HTMLFormElement)) return;
    event.preventDefault();
    event.stopPropagation();
    formRef.current = event.target;
    setConfirmOpen(true);
  };
  return <>
    <section aria-labelledby="request-review-title" className="rounded-3xl border border-tertiary/30 bg-surface-container-low p-5 sm:p-7">
      <div className="mb-5"><p className="text-xs font-semibold text-tertiary">{request.requester_name || request.member_id}</p><h3 id="request-review-title" className="mt-2 font-headline text-lg font-bold">{resolved ? (english ? "Complete the request" : "Clôturer la demande") : (english ? "Decline the request" : "Refuser la demande")}</h3></div>
      <EmailAddresses request={request} english={english} />
      {request.reason && <div className="mt-4"><p className="mb-1 text-xs font-semibold">{english ? "Member’s reason" : "Motif du membre"}</p><p className="whitespace-pre-wrap break-words text-sm leading-6 text-on-surface-variant">{request.reason}</p></div>}
      <p className={"my-5 rounded-xl border p-4 text-xs leading-6 " + (resolved ? "border-tertiary/20 bg-tertiary/5 text-on-surface-variant" : "border-outline-variant/20 bg-surface-container-high/50 text-on-surface-variant")}>
        {resolved ? (english ? "First update the address in Supabase Auth and in the member record. Completing this request checks that both addresses match the requested address, then records your decision." : "Modifiez d’abord l’adresse dans Supabase Auth et dans la fiche membre. La clôture vérifie que ces deux adresses correspondent à l’adresse souhaitée, puis enregistre votre décision.") : (english ? "Explain your decision so the member can understand the response and submit a suitable request later." : "Expliquez votre décision pour que le membre comprenne la réponse et puisse faire une demande adaptée par la suite.")}
      </p>
      <div onSubmitCapture={captureSubmit}>
        <AdminForm action={reviewEmailChangeRequest} submitLabel={resolved ? (english ? "Mark as completed" : "Marquer comme résolue") : (english ? "Decline this request" : "Refuser cette demande")}
          successMessage={english ? "The decision has been recorded." : "La décision a été enregistrée."} onSuccess={onSuccess} onCancel={onClose}>
          <input type="hidden" name="request_id" value={request.id} />
          <input type="hidden" name="status" value={decision} />
          <input type="hidden" name="language" value={english ? "en" : "fr"} />
          <Field label={english ? "Response visible to the member" : "Réponse visible par le membre"} required={!resolved} hint={english ? "This response appears in the member’s account settings." : "Cette réponse apparaît dans les paramètres du compte du membre."}>
            <textarea autoFocus name="response" rows={4} maxLength={2000} required={!resolved} className={inputClass + " resize-y"} />
          </Field>
        </AdminForm>
      </div>
    </section>
    <ConfirmDialog open={confirmOpen} title={resolved ? (english ? "Confirm completion" : "Confirmer la clôture") : (english ? "Confirm this decision" : "Confirmer cette décision")}
      description={resolved ? (english ? "Confirm that the sign-in address in Supabase Auth and the email in the member record are both " + request.requested_email + ". The server will verify them before marking the request as completed." : "Confirmez que l’adresse de connexion dans Supabase Auth et l’email de la fiche membre sont tous les deux " + request.requested_email + ". Le serveur les vérifiera avant de marquer la demande comme résolue.") : (english ? "Decline the request for " + request.requested_email + " and save your response for the member." : "Refuser la demande pour " + request.requested_email + " et enregistrer votre réponse pour le membre.")}
      confirmLabel={resolved ? (english ? "Confirm completion" : "Confirmer la clôture") : (english ? "Confirm decline" : "Confirmer le refus")} cancelLabel={english ? "Back to the form" : "Revenir au formulaire"}
      onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); confirmed.current = true; formRef.current?.requestSubmit(); }} />
  </>;
}

export default function AccountRequests({ requests, english = false }: { requests: AccountEmailRequest[]; english?: boolean }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [editing, setEditing] = useState<{ id: string; decision: Decision } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { requestDiscard } = useAdminWorkspace();
  const query = search.trim().toLocaleLowerCase(english ? "en-GB" : "fr-FR");
  const filtered = requests.filter((request) => (filter === "all" || request.status === filter) &&
    [request.requester_name, request.current_email, request.requested_email, request.reason, request.review_response].filter(Boolean).join(" ").toLocaleLowerCase(english ? "en-GB" : "fr-FR").includes(query));
  const selected = editing ? requests.find((request) => request.id === editing.id && request.status === "pending") : undefined;
  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const closeEditor = () => { setEditing(null); document.getElementById("admin-section-title")?.focus({ preventScroll: true }); };
  const openEditor = (id: string, decision: Decision) => requestDiscard(() => { setNotice(null); setEditing({ id, decision }); });
  const reviewed = () => { setNotice(english ? "The decision has been recorded and is visible in the member’s account settings." : "La décision a été enregistrée et est visible dans les paramètres du compte du membre."); closeEditor(); };
  return <div className="min-w-0 space-y-5">
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-4 sm:px-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold">{english ? "Requests awaiting review" : "Demandes en attente de traitement"}</p><span className="rounded-lg bg-tertiary/10 px-2.5 py-1 text-sm font-bold tabular-nums text-tertiary">{pendingCount}</span></div><p className="mt-2 text-xs leading-6 text-on-surface-variant">{english ? "All pending requests and the 50 most recent reviewed requests are shown. Search covers the requests displayed here." : "Toutes les demandes en attente et les 50 dernières demandes traitées sont affichées. La recherche porte sur les demandes présentées ici."}</p></div>
    {notice && <p role="status" className="rounded-xl border border-tertiary/20 bg-tertiary/5 p-4 text-sm leading-6">{notice}</p>}
    {selected && editing && <ReviewEditor key={selected.id + "-" + editing.decision} request={selected} decision={editing.decision} english={english} onClose={closeEditor} onSuccess={reviewed} />}
    <ManagerToolbar search={search} onSearch={setSearch} placeholder={english ? "Search name, email or reason…" : "Rechercher un nom, une adresse ou un motif…"}>
      <label className="flex shrink-0 items-center gap-2 text-xs font-semibold"><span>{english ? "Status" : "Statut"}</span><select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className={inputClass + " w-auto"}><option value="pending">{english ? "Awaiting review" : "En attente"}</option><option value="resolved">{english ? "Completed" : "Résolues"}</option><option value="rejected">{english ? "Declined" : "Refusées"}</option><option value="all">{english ? "All statuses" : "Tous les statuts"}</option></select></label>
    </ManagerToolbar>
    <p className="text-xs text-on-surface-variant">{filtered.length} {english ? "request(s) displayed · Dates in Paris time" : "demande(s) affichée(s) · Dates à l’heure de Paris"}</p>
    {filtered.length === 0 ? <EmptyState icon="inbox" title={english ? "No matching requests" : "Aucune demande correspondante"} description={english ? "Try another search or status filter." : "Essayez une autre recherche ou un autre filtre de statut."} /> : <div className="space-y-3">
      {filtered.map((request) => <article key={request.id} className="min-w-0 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-sm font-bold">{request.requester_name || (english ? "Member " : "Membre ") + request.member_id}</h3><time dateTime={request.created_at} className="mt-1 block text-xs text-on-surface-variant">{formatParisDateTime(request.created_at, undefined, english ? "en-GB" : "fr-FR") || "—"}</time></div><span className={"rounded-lg px-2.5 py-1 text-xs font-semibold " + (request.status === "pending" ? "bg-tertiary/10 text-tertiary" : request.status === "rejected" ? "bg-error/10 text-error" : "bg-surface-container-high text-on-surface")}>{statusLabel(request.status, english)}</span></div>
        <EmailAddresses request={request} english={english} />
        {request.reason && <div className="mt-4"><p className="mb-1 text-xs font-semibold">{english ? "Reason" : "Motif"}</p><p className="whitespace-pre-wrap break-words text-sm leading-6 text-on-surface-variant">{request.reason}</p></div>}
        {request.review_response && <div className="mt-4 rounded-xl bg-surface-container-high/60 p-3"><p className="mb-1 text-xs font-semibold">{english ? "Board response" : "Réponse du BR"}</p><p className="whitespace-pre-wrap break-words text-sm leading-6 text-on-surface-variant">{request.review_response}</p></div>}
        {request.reviewed_at && <p className="mt-3 text-xs text-on-surface-variant">{english ? "Reviewed on " : "Traitée le "}<time dateTime={request.reviewed_at}>{formatParisDateTime(request.reviewed_at, undefined, english ? "en-GB" : "fr-FR") || "—"}</time></p>}
        {request.status === "pending" && <div className="mt-5 flex flex-col gap-2 border-t border-outline-variant/15 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => openEditor(request.id, "rejected")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/30 px-4 py-2.5 text-xs font-semibold text-error transition hover:bg-error/10"><span aria-hidden="true" className="material-symbols-outlined text-base">close</span>{english ? "Decline" : "Refuser"}</button><button type="button" onClick={() => openEditor(request.id, "resolved")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-tertiary px-4 py-2.5 text-xs font-bold text-on-tertiary transition hover:brightness-110"><span aria-hidden="true" className="material-symbols-outlined text-base">task_alt</span>{english ? "Mark as completed" : "Marquer comme résolue"}</button></div>}
      </article>)}
    </div>}
  </div>;
}
