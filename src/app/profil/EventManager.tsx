"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { getDictionary } from "@/locales/dictionaries";
import { addEvent, updateEvent, deleteEvent } from "./actions";
import ImageUpload from "@/components/ImageUpload";
import RichTextEditor from "@/components/RichTextEditor";
import EventRegistrations from "./EventRegistrations";
import EventRegistrationLogs from "./EventRegistrationLogs";
import { formatParisDateTime, parseParisDateTimeLocal, toParisDateTimeLocal } from "@/utils/paris-time";
import { formatEventPrice } from "@/utils/event-payment";
import { AdminForm, ConfirmDeleteButton, EmptyState, Field, ManagerToolbar, inputClass } from "./AdminUI";

type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

interface EventItem {
  id: string;
  title: string;
  description: string;
  full_content?: string;
  date_start: string | null;
  date_is_tbd?: boolean;
  location: string;
  precise_location?: string;
  max_capacity?: number;
  image_url?: string;
  status: string;
  is_esport?: boolean;
  registration_enabled?: boolean;
  registration_is_paid?: boolean;
  registration_price_cents?: number | null;
  helloasso_checkout_url?: string | null;
}


function EventEditor({ event, dict, onCancel, onSuccess }: { event?: EventItem; dict: Dictionary; onCancel: () => void; onSuccess: () => void }) {
  const [registrationEnabled, setRegistrationEnabled] = useState(event?.date_is_tbd ? false : event?.registration_enabled !== false);
  const [dateIsTbd, setDateIsTbd] = useState(event?.date_is_tbd === true);
  const [isPaid, setIsPaid] = useState(event?.registration_is_paid === true);
  const [registrationPrice, setRegistrationPrice] = useState(event?.registration_price_cents != null ? (event.registration_price_cents / 100).toFixed(2) : "");
  const [checkoutUrl, setCheckoutUrl] = useState(event?.helloasso_checkout_url || "");
  const en = dict.profil?.title === "My Account";
  const l = (fr: string, english: string) => en ? english : fr;
  const save = async (formData: FormData) => {
    const dateIsTbd = formData.get("date_is_tbd") === "true";
    if (dateIsTbd) formData.set("date_start", "");
    else {
      const localValue = String(formData.get("date_start") || "");
      const parsed = parseParisDateTimeLocal(localValue);
      if ("error" in parsed) return { error: parsed.error === "nonexistent"
        ? l("Cette heure n’existe pas à Paris lors du passage à l’heure d’été. Choisissez une autre heure.", "This time does not exist in Paris when daylight saving time starts. Choose another time.")
        : l("Choisissez une date et une heure valides.", "Choose a valid date and time.") };
      const unchanged = event && localValue === toParisDateTimeLocal(event.date_start);
      formData.set("date_start", unchanged && event.date_start ? new Date(event.date_start).toISOString() : parsed.iso);
    }
    return event ? updateEvent(formData) : addEvent(formData);
  };

  return (
    <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4 sm:p-6">
      <div className="mb-6 border-b border-outline-variant/20 pb-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-secondary">{event ? l("Modification", "Editing") : l("Création", "Creation")}</p>
        <h3 className="break-words font-headline text-xl font-bold">{event?.title || l("Nouvel événement", "New event")}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">{l("Renseignez les informations qui seront affichées sur le site. Les champs marqués d'un astérisque sont obligatoires.", "Enter the information shown on the website. Fields marked with an asterisk are required.")}</p>
      </div>
      <AdminForm action={save} submitLabel={event ? l("Enregistrer les modifications", "Save changes") : l("Créer l'événement", "Create event")} successMessage={l("Événement enregistré.", "Event saved.")} onCancel={onCancel} onSuccess={onSuccess}>
        {event && <input type="hidden" name="id" value={event.id} />}
        <input type="hidden" name="current_image_url" value={event?.image_url || ""} />
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <fieldset className="min-w-0 space-y-4">
            <legend className="mb-4 font-headline text-base font-bold">{l("Présentation", "Overview")}</legend>
            <Field label={l("Titre", "Title")} required>
              <input name="title" autoFocus defaultValue={event?.title || ""} required maxLength={180} className={inputClass} />
            </Field>
            <Field label={l("Résumé", "Summary")} required hint={l("Une accroche claire pour les cartes et la liste des événements.", "A clear introduction for event cards and listings.")}>
              <textarea name="description" defaultValue={event?.description || ""} required rows={3} className={inputClass + " resize-y"} />
            </Field>
            <Field label={l("Programme et informations détaillées", "Programme and details")} hint={l("Précisez les horaires, le programme, les tarifs ou les modalités d'inscription.", "Include the schedule, programme, prices or registration instructions.")}>
              <RichTextEditor name="full_content" label={l("Contenu détaillé", "Detailed text")} initialValue={event?.full_content || ""} english={en} />
            </Field>
          </fieldset>
          <fieldset className="min-w-0 space-y-4">
            <legend className="mb-4 font-headline text-base font-bold">{l("Organisation et visuel", "Logistics and image")}</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#9146FF]/25 bg-[#9146FF]/5 p-3">
              <input name="is_esport" type="checkbox" value="true" defaultChecked={event?.is_esport === true} className="mt-1 size-4 shrink-0 accent-[#9146FF]" />
              <span><span className="flex items-center gap-2 text-sm font-semibold"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-[#9146FF]"><path d="M4 3h16v13l-5 5h-4l-3 3v-3H4V3zm3 3v12h3v2l2-2h3l2-2V6H7zm4 2h2v5h-2V8zm4 0h2v5h-2V8z" /></svg>{l("Événement eSport", "eSports event")}</span><span className="mt-1 block text-xs leading-5 text-on-surface-variant">{l("Affiche aussi cet événement dans la page eSport et ses archives.", "Also show this event on the eSports page and in its archive.")}</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-3">
              <input name="date_is_tbd" type="checkbox" value="true" checked={dateIsTbd} onChange={change => setDateIsTbd(change.target.checked)} className="mt-1 size-4 shrink-0 accent-tertiary" />
              <span><span className="block text-sm font-semibold">{l("Prochainement — date à préciser", "Coming soon — date to be announced")}</span><span className="mt-1 block text-xs leading-5 text-on-surface-variant">{l("L’événement sera publié sans date ni heure précises. Les inscriptions resteront fermées.", "The event will be published without a specific date or time. Registration will stay closed.")}</span></span>
            </label>
            <input type="hidden" name="date_is_tbd" value="false" />
            <Field label={l("Date et heure de début", "Start date and time")} required={!dateIsTbd} hint={dateIsTbd ? l("Cette date restera masquée jusqu’à sa définition.", "The date will remain hidden until it is set.") : l("Heure de Paris (UTC+2 en été, UTC+1 en hiver).", "Paris time (UTC+2 in summer, UTC+1 in winter).")}>
              <input name="date_start" type="datetime-local" defaultValue={toParisDateTimeLocal(event?.date_start)} required={!dateIsTbd} disabled={dateIsTbd} className={inputClass + " min-w-0"} />
            </Field>
            <Field label={l("Lieu", "Location")} required>
              <input name="location" defaultValue={event?.location || ""} required maxLength={200} className={inputClass} placeholder={l("Ex. : Campus Jean-Henri Fabre", "E.g. Jean-Henri Fabre campus")} />
            </Field>
            <Field label={l("Adresse ou salle", "Address or room")}>
              <input name="precise_location" defaultValue={event?.precise_location || ""} maxLength={300} className={inputClass} placeholder={l("Ex. : bâtiment ADA, salle 102", "E.g. ADA building, room 102")} />
            </Field>
            <Field label={l("Nombre maximal de participants", "Maximum participants")} hint={l("Laissez vide si aucune limite n'est prévue.", "Leave blank if there is no participant limit.")}>
              <input name="max_capacity" type="number" min={1} step={1} defaultValue={event?.max_capacity ?? ""} className={inputClass} />
            </Field>
            <fieldset className="space-y-4 rounded-xl border border-outline-variant/25 bg-surface-container-high/40 p-4">
              <legend className="px-2 text-sm font-bold text-on-surface">{l("Inscriptions", "Registration")}</legend>
              <label className="flex min-h-11 cursor-pointer items-start gap-3">
                <input name="registration_enabled" type="checkbox" value="true" checked={dateIsTbd ? false : registrationEnabled} disabled={dateIsTbd} onChange={(change) => setRegistrationEnabled(change.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-secondary" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-on-surface"><span aria-hidden="true" className="material-symbols-outlined text-lg text-secondary">event_note</span>{l("Inscriptions ouvertes", "Registration is open")}</span>
                  <span className="mt-1 block text-xs leading-5 text-on-surface-variant">{l("Décochez cette case pour publier un événement informatif sans inscription. Les inscriptions et leur historique sont conservés.", "Uncheck this to publish an informational event without signup. Existing registrations and their history are kept.")}</span>
                </span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-3">
                <input name="registration_is_paid" type="checkbox" value="true" checked={isPaid} disabled={!registrationEnabled || dateIsTbd} onChange={(change) => setIsPaid(change.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-tertiary disabled:cursor-not-allowed disabled:opacity-50" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-on-surface"><span aria-hidden="true" className="material-symbols-outlined text-lg text-tertiary">confirmation_number</span>{l("Inscription payante", "Paid registration")}</span>
                  <span className="mt-1 block text-xs leading-5 text-on-surface-variant">{l("Activez pour demander un paiement via HelloAsso. Sinon, l'inscription est gratuite.", "Enable to request payment through HelloAsso. Otherwise, registration is free.")}</span>
                </span>
              </label>
              <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] xl:grid-cols-1">
                <Field label={l("Tarif par personne (€)", "Price per person (€)")} required={isPaid && registrationEnabled}>
                  <input name="registration_price" type="number" min="0.01" step="0.01" value={registrationPrice} onChange={(change) => setRegistrationPrice(change.target.value)} required={isPaid && registrationEnabled} disabled={!isPaid || !registrationEnabled} className={inputClass} placeholder="5.00" inputMode="decimal" />
                </Field>
                <Field label={l("Lien du checkout HelloAsso", "HelloAsso checkout link")} required={isPaid && registrationEnabled} hint={l("Collez le lien public du formulaire de paiement de cet événement.", "Paste the public payment form link for this event.")}>
                  <input name="helloasso_checkout_url" type="url" value={checkoutUrl} onChange={(change) => setCheckoutUrl(change.target.value)} required={isPaid && registrationEnabled} disabled={!isPaid || !registrationEnabled} maxLength={2000} className={inputClass} placeholder="https://www.helloasso.com/..." />
                </Field>
              </div>
              {isPaid && registrationEnabled && <p className="flex items-start gap-2 rounded-lg bg-tertiary/10 p-3 text-xs leading-5 text-on-surface-variant"><span aria-hidden="true" className="material-symbols-outlined mt-0.5 shrink-0 text-base text-tertiary">info</span><span>{l("Le tarif du formulaire HelloAsso doit correspondre à ce montant. Les paiements sont à vérifier dans HelloAsso.", "The HelloAsso form price must match this amount. Payments must be checked in HelloAsso.")}</span></p>}
            </fieldset>
            <Field label={l("Image de couverture", "Cover image")} hint={event ? l("Sans nouvelle image, la couverture actuelle est conservée.", "The existing cover is kept if you do not choose a new image.") : l("Choisissez une image lisible qui représente l'événement.", "Choose a clear image that represents the event.")}>
              <ImageUpload name="image" english={en} defaultValue={event?.image_url} aspectRatio={16 / 9} />
            </Field>
          </fieldset>
        </div>
      </AdminForm>
    </div>
  );
}

export default function EventManager({ dict, initialEvents, embedded = false }: { dict: Dictionary; initialEvents: EventItem[]; embedded?: boolean }) {
  const en = dict.profil?.title === "My Account";
  const l = (fr: string, english: string) => en ? english : fr;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const events = initialEvents;
  const [now] = useState(() => Date.now());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [registrationsId, setRegistrationsId] = useState<string | null>(null);
  const [logsId, setLogsId] = useState<string | null>(null);
  const [logsAll, setLogsAll] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const visible = events.filter(event => {
    const upcoming = event.date_is_tbd === true || (event.date_start !== null && new Date(event.date_start).getTime() >= now);
    return (!query || [event.title, event.description, event.location].some(value => value?.toLocaleLowerCase().includes(query))) && (filter === "all" || (filter === "upcoming" ? upcoming : !upcoming));
  });
  const editingEvent = events.find(event => event.id === editingId);
  const registrationsEvent = events.find(event => event.id === registrationsId);
  const logsEvent = events.find(event => event.id === logsId);
  const closeRegistrations = (logs = false) => {
    const eventId = logs ? (logsAll ? null : logsId) : registrationsId;
    setRegistrationsId(null);
    setLogsId(null);
    if (logs) setLogsAll(false);
    requestAnimationFrame(() => {
      const target = document.getElementById(logs ? logsAll ? "event-logs-all-button" : "event-logs-button-" + eventId : "event-registrations-button-" + eventId) || (embedded ? document.getElementById("admin-section-title") : headingRef.current);
      target?.focus({ preventScroll: true });
    });
  };
  const closeEditor = () => { setEditingId(null); setCreating(false); requestAnimationFrame(() => (embedded ? document.getElementById("admin-section-title") : headingRef.current)?.focus()); };
  const dateLabel = (date: string | null, tbd = false) => tbd ? l("Prochainement", "Coming soon") : date ? formatParisDateTime(date, { dateStyle: "medium", timeStyle: "short" }, en ? "en-GB" : "fr-FR") || l("Date non renseignée", "Date unavailable") : l("Date non renseignée", "Date unavailable");

  return (
    <section className="space-y-5" aria-label={l("Gestion des événements", "Event management")}>
      {(!embedded || (!creating && !editingEvent && !registrationsEvent && !logsEvent && !logsAll)) && <header className={"flex flex-col gap-4 sm:flex-row sm:items-start " + (embedded ? "sm:justify-end" : "sm:justify-between")}>
        {!embedded && <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="font-headline text-2xl font-bold">{l("Événements", "Events")}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{l("Organisez les rendez-vous du BDE et leurs informations pratiques.", "Manage BDE events and their practical information.")}</p>
        </div>}
        {!creating && !editingEvent && !registrationsEvent && !logsEvent && !logsAll && <div className="flex flex-wrap items-center gap-2">
          <button id="event-logs-all-button" type="button" onClick={() => { setLogsAll(true); setNotice(""); }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"><span aria-hidden="true" className="material-symbols-outlined text-lg">history</span>{l("Historique global", "All history")}</button>
          <button type="button" onClick={() => { setCreating(true); setNotice(""); }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-on-secondary transition-colors hover:bg-secondary/90">
          <span aria-hidden="true" className="material-symbols-outlined text-lg">add</span>{l("Nouvel événement", "New event")}
          </button>
        </div>}
      </header>}
      {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"><span aria-hidden="true" className="material-symbols-outlined text-lg">check_circle</span>{notice}</p>}
      {creating || editingEvent ? <EventEditor key={editingEvent?.id || "new"} event={editingEvent} dict={dict} onCancel={closeEditor} onSuccess={() => { closeEditor(); setNotice(l("L'événement a été enregistré.", "The event has been saved.")); }} /> : registrationsEvent ? <EventRegistrations key={registrationsEvent.id} event={registrationsEvent} english={en} onClose={() => closeRegistrations()} /> : logsAll ? <EventRegistrationLogs key="all-events" event={null} english={en} onClose={() => closeRegistrations(true)} /> : logsEvent ? <EventRegistrationLogs key={logsEvent.id} event={logsEvent} english={en} onClose={() => closeRegistrations(true)} /> : <>
        <ManagerToolbar search={search} onSearch={setSearch} placeholder={l("Rechercher un titre ou un lieu…", "Search by title or location…")}>
          <select aria-label={l("Filtrer les événements", "Filter events")} value={filter} onChange={e => setFilter(e.target.value)} className={inputClass + " sm:max-w-48"}>
            <option value="all">{l("Tous les événements", "All events")}</option>
            <option value="upcoming">{l("À venir", "Upcoming")}</option>
            <option value="past">{l("Passés", "Past")}</option>
          </select>
        </ManagerToolbar>
        <p className="text-xs text-on-surface-variant" aria-live="polite">{visible.length} / {events.length} {l("événements", "events")}</p>
        <div className="space-y-3">
          {visible.map(event => <article key={event.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high text-secondary">
                {event.image_url ? <Image src={event.image_url} alt="" width={64} height={64} loading="lazy" unoptimized className="h-full w-full object-cover" /> : <span aria-hidden="true" className="material-symbols-outlined text-3xl">event</span>}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="break-words font-bold text-on-surface">{event.title}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{dateLabel(event.date_start, event.date_is_tbd)}</p>
                <p className="mt-1 break-words text-xs text-on-surface-variant">{event.location}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/15 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">{event.date_is_tbd ? l("Prochainement", "Coming soon") : event.date_start && new Date(event.date_start).getTime() >= now ? l("À venir", "Upcoming") : l("Passé", "Past")}</span>
                {event.is_esport && <span className="inline-flex items-center gap-1 rounded-full bg-[#9146FF]/10 px-2.5 py-1 text-xs font-semibold text-[#B98BFF]"><span aria-hidden="true" className="material-symbols-outlined text-sm">sports_esports</span>eSport</span>}
                <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold " + (event.registration_enabled === false ? "bg-surface-container-high text-on-surface-variant" : event.registration_is_paid ? "bg-tertiary/10 text-tertiary" : "bg-surface-container-high text-on-surface-variant")}><span aria-hidden="true" className="material-symbols-outlined text-sm">{event.registration_enabled === false ? "event_note" : event.registration_is_paid ? "confirmation_number" : "check_circle"}</span>{event.registration_enabled === false ? l("Informatif", "Informational") : event.registration_is_paid ? event.registration_price_cents != null ? formatEventPrice(event.registration_price_cents, en) : l("Payant", "Paid") : l("Gratuit", "Free")}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={"/evenement/" + event.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"><span aria-hidden="true" className="material-symbols-outlined text-lg">open_in_new</span>{l("Voir", "View")}</Link>
                <button id={"event-registrations-button-" + event.id} type="button" onClick={() => { setRegistrationsId(event.id); setNotice(""); }} aria-label={l("Consulter les inscrits à ", "View registrations for ") + event.title} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-secondary/25 px-3 py-2 text-sm font-semibold text-secondary hover:bg-secondary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"><span aria-hidden="true" className="material-symbols-outlined text-lg">groups</span>{l("Inscrits", "Registrations")}</button>
                <button id={"event-logs-button-" + event.id} type="button" onClick={() => { setLogsId(event.id); setNotice(""); }} aria-label={l("Consulter le journal de ", "View event history for ") + event.title} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-outline-variant/30 px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"><span aria-hidden="true" className="material-symbols-outlined text-lg">history</span>{l("Journal", "History")}</button>
                <button type="button" onClick={() => { setEditingId(event.id); setNotice(""); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2 text-sm font-semibold text-secondary hover:bg-secondary/20"><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>{l("Modifier", "Edit")}</button>
                <ConfirmDeleteButton action={() => deleteEvent(event.id)} title={l("Supprimer cet événement ?", "Delete this event?")} description={l("« " + event.title + " » et ses inscriptions actives seront supprimés. Le journal des mouvements restera disponible au bureau.", "“" + event.title + "” and its active registrations will be deleted. The activity log will remain available to the board.")} label={l("Supprimer", "Delete")} onSuccess={() => { setNotice(l("Événement supprimé.", "Event deleted.")); }} />
              </div>
            </div>
          </article>)}
          {visible.length === 0 && <EmptyState icon="event" title={events.length ? l("Aucun événement correspondant", "No matching events") : l("Aucun événement pour le moment", "No events yet")} description={events.length ? l("Essayez un autre titre, un autre lieu ou un autre filtre.", "Try another title, location or filter.") : l("Créez votre premier événement avec le bouton ci-dessus.", "Create your first event using the button above.")} />}
        </div>
      </>}
    </section>
  );
}
