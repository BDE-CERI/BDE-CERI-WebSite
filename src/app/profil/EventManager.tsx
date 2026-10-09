"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { getDictionary } from "@/locales/dictionaries";
import { addEvent, updateEvent, deleteEvent } from "./actions";
import ImageUpload from "@/components/ImageUpload";
import { formatParisDateTime, parseParisDateTimeLocal, toParisDateTimeLocal } from "@/utils/paris-time";
import { AdminForm, ConfirmDeleteButton, EmptyState, Field, ManagerToolbar, inputClass } from "./AdminUI";

type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

interface EventItem {
  id: string;
  title: string;
  description: string;
  full_content?: string;
  date_start: string;
  location: string;
  precise_location?: string;
  max_capacity?: number;
  image_url?: string;
  status: string;
}


function EventEditor({ event, dict, onCancel, onSuccess }: { event?: EventItem; dict: Dictionary; onCancel: () => void; onSuccess: () => void }) {
  const en = dict.profil?.title === "My Account";
  const l = (fr: string, english: string) => en ? english : fr;
  const save = async (formData: FormData) => {
    const localValue = String(formData.get("date_start") || "");
    const parsed = parseParisDateTimeLocal(localValue);
    if ("error" in parsed) return { error: parsed.error === "nonexistent"
      ? l("Cette heure n’existe pas à Paris lors du passage à l’heure d’été. Choisissez une autre heure.", "This time does not exist in Paris when daylight saving time starts. Choose another time.")
      : l("Choisissez une date et une heure valides.", "Choose a valid date and time.") };
    // Keep an unchanged event’s exact instant, including the second occurrence
    // of a repeated autumn hour and any seconds not displayed in the input.
    const unchanged = event && localValue === toParisDateTimeLocal(event.date_start);
    formData.set("date_start", unchanged ? new Date(event.date_start).toISOString() : parsed.iso);
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
              <textarea name="full_content" defaultValue={event?.full_content || ""} rows={8} className={inputClass + " resize-y"} />
            </Field>
          </fieldset>
          <fieldset className="min-w-0 space-y-4">
            <legend className="mb-4 font-headline text-base font-bold">{l("Organisation et visuel", "Logistics and image")}</legend>
            <Field label={l("Date et heure de début", "Start date and time")} required hint={l("Heure de Paris (UTC+2 en été, UTC+1 en hiver). Une nouvelle heure répétée au passage à l’heure d’hiver utilise sa première occurrence.", "Paris time (UTC+2 in summer, UTC+1 in winter). A newly selected repeated hour at the autumn clock change uses its first occurrence.")}>
              <input name="date_start" type="datetime-local" defaultValue={toParisDateTimeLocal(event?.date_start)} required className={inputClass + " min-w-0"} />
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
            <Field label={l("Image de couverture", "Cover image")} hint={event ? l("Sans nouvelle image, la couverture actuelle est conservée.", "The existing cover is kept if you do not choose a new image.") : l("Choisissez une image lisible qui représente l'événement.", "Choose a clear image that represents the event.")}>
              <ImageUpload name="image" english={en} defaultValue={event?.image_url} />
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
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const visible = events.filter(event => {
    const upcoming = new Date(event.date_start).getTime() >= now;
    return (!query || [event.title, event.description, event.location].some(value => value?.toLocaleLowerCase().includes(query))) && (filter === "all" || (filter === "upcoming" ? upcoming : !upcoming));
  });
  const editingEvent = events.find(event => event.id === editingId);
  const closeEditor = () => { setEditingId(null); setCreating(false); requestAnimationFrame(() => (embedded ? document.getElementById("admin-section-title") : headingRef.current)?.focus()); };
  const dateLabel = (date: string) => {
    return formatParisDateTime(date, { dateStyle: "medium", timeStyle: "short" }, en ? "en-GB" : "fr-FR") || l("Date non renseignée", "Date unavailable");
  };

  return (
    <section className="space-y-5" aria-label={l("Gestion des événements", "Event management")}>
      {(!embedded || (!creating && !editingEvent)) && <header className={"flex flex-col gap-4 sm:flex-row sm:items-start " + (embedded ? "sm:justify-end" : "sm:justify-between")}>
        {!embedded && <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="font-headline text-2xl font-bold">{l("Événements", "Events")}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{l("Organisez les rendez-vous du BDE et leurs informations pratiques.", "Manage BDE events and their practical information.")}</p>
        </div>}
        {!creating && !editingEvent && <button type="button" onClick={() => { setCreating(true); setNotice(""); }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-on-secondary transition-colors hover:bg-secondary/90">
          <span aria-hidden="true" className="material-symbols-outlined text-lg">add</span>{l("Nouvel événement", "New event")}
        </button>}
      </header>}
      {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"><span aria-hidden="true" className="material-symbols-outlined text-lg">check_circle</span>{notice}</p>}
      {creating || editingEvent ? <EventEditor key={editingEvent?.id || "new"} event={editingEvent} dict={dict} onCancel={closeEditor} onSuccess={() => { closeEditor(); setNotice(l("L'événement a été enregistré.", "The event has been saved.")); }} /> : <>
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
                <p className="mt-1 text-sm text-on-surface-variant">{dateLabel(event.date_start)}</p>
                <p className="mt-1 break-words text-xs text-on-surface-variant">{event.location}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/15 pt-3">
              <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">{new Date(event.date_start).getTime() >= now ? l("À venir", "Upcoming") : l("Passé", "Past")}</span>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={"/evenement/" + event.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"><span aria-hidden="true" className="material-symbols-outlined text-lg">open_in_new</span>{l("Voir", "View")}</Link>
                <button type="button" onClick={() => { setEditingId(event.id); setNotice(""); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2 text-sm font-semibold text-secondary hover:bg-secondary/20"><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>{l("Modifier", "Edit")}</button>
                <ConfirmDeleteButton action={() => deleteEvent(event.id)} title={l("Supprimer cet événement ?", "Delete this event?")} description={l("« " + event.title + " » sera définitivement supprimé du site.", "“" + event.title + "” will be permanently deleted from the website.")} label={l("Supprimer", "Delete")} onSuccess={() => { setNotice(l("Événement supprimé.", "Event deleted.")); }} />
              </div>
            </div>
          </article>)}
          {visible.length === 0 && <EmptyState icon="event" title={events.length ? l("Aucun événement correspondant", "No matching events") : l("Aucun événement pour le moment", "No events yet")} description={events.length ? l("Essayez un autre titre, un autre lieu ou un autre filtre.", "Try another title, location or filter.") : l("Créez votre premier événement avec le bouton ci-dessus.", "Create your first event using the button above.")} />}
        </div>
      </>}
    </section>
  );
}
