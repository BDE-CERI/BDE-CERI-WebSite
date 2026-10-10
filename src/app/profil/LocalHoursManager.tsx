"use client";

import { AdminForm, ConfirmDeleteButton, EmptyState, Field, inputClass } from "./AdminUI";
import { deleteLocalShift, saveLocalShift, updateLocalHours } from "./local-actions";
import { defaultLocalHours, type LocalOfficeData } from "@/utils/local-office-shared";

const messageKeys = ["open", "no_shift", "before_open", "after_close", "weekend", "holiday"] as const;
const weekdays = [
  [1, "Lundi", "Monday"], [2, "Mardi", "Tuesday"], [3, "Mercredi", "Wednesday"],
  [4, "Jeudi", "Thursday"], [5, "Vendredi", "Friday"],
] as const;

type Keyholder = { id: string; first_name: string; last_name: string };
type Shift = LocalOfficeData["shifts"][number];

export default function LocalHoursManager({ data, keyholders, english = false }: { data: LocalOfficeData; keyholders: Keyholder[]; english?: boolean }) {
  const l = (fr: string, en: string) => english ? en : fr;
  const messageLabel: Record<typeof messageKeys[number], [string, string]> = {
    open: ["Message lorsque le local est ouvert", "Message when the local is open"],
    no_shift: ["Message sans permanence annoncée", "Message when no shift is posted"],
    before_open: ["Message avant l’ouverture", "Message before opening"],
    after_close: ["Message après la fermeture", "Message after closing"],
    weekend: ["Message le week-end", "Weekend message"],
    holiday: ["Message un jour férié", "Public holiday message"],
  };
  const sortedShifts = [...data.shifts].sort((a, b) => a.weekday - b.weekday || a.starts_at.localeCompare(b.starts_at));

  return <section className="space-y-6" aria-label={l("Gestion du local du BDE", "BDE local management")}>
    <header className="rounded-2xl border border-tertiary/20 bg-tertiary/5 p-5 sm:p-6">
      <div className="flex items-start gap-3"><span aria-hidden="true" className="material-symbols-outlined rounded-xl bg-tertiary/10 p-2 text-2xl text-tertiary">store</span><div><h2 className="font-headline text-xl font-bold">{l("Horaires et permanences du local", "Local opening hours and shifts")}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">{l("Les horaires ci-dessous sont les plages possibles. Le local et la Taverne sont considérés ouverts uniquement pendant une permanence annoncée avec un responsable des clés.", "These are the possible opening hours. The local and Tavern are considered open only during a posted shift with an assigned keyholder.")}</p></div></div>
    </header>

    <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-6">
      <h3 className="mb-4 font-headline text-base font-bold">{l("Horaires possibles", "Possible opening hours")}</h3>
      <AdminForm action={updateLocalHours} submitLabel={l("Enregistrer les horaires et messages", "Save hours and messages")} successMessage={l("Les horaires et messages sont enregistrés.", "Hours and messages have been saved.")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={l("Ouverture, du lundi au vendredi", "Opens Monday through Friday")}><input name="opens_at" type="time" required defaultValue={data.settings.opens_at.slice(0, 5)} className={inputClass} /></Field>
          <Field label={l("Fermeture, du lundi au vendredi", "Closes Monday through Friday")}><input name="closes_at" type="time" required defaultValue={data.settings.closes_at.slice(0, 5)} className={inputClass} /></Field>
        </div>
        <div className="space-y-5 border-t border-outline-variant/15 pt-5">
          <div><h4 className="font-semibold">{l("Messages de statut", "Status messages")}</h4><p className="mt-1 text-xs leading-5 text-on-surface-variant">{l("Variables disponibles : {opening}, {closing}, {responsible}, {next_day}, {next_opening}.", "Available tokens: {opening}, {closing}, {responsible}, {next_day}, {next_opening}.")}</p></div>
          {messageKeys.map(key => {
            const message = data.settings.messages[key] || defaultLocalHours.messages[key];
            return <div key={key} className="grid gap-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4 lg:grid-cols-2">
              <Field label={l(messageLabel[key][0] + " — français", messageLabel[key][1] + " — French")}><textarea name={"message_" + key + "_fr"} rows={3} maxLength={500} required defaultValue={message.fr || defaultLocalHours.messages[key].fr} className={inputClass + " resize-y"} /></Field>
              <Field label={l(messageLabel[key][0] + " — anglais", messageLabel[key][1] + " — English")}><textarea name={"message_" + key + "_en"} rows={3} maxLength={500} required defaultValue={message.en || defaultLocalHours.messages[key].en} className={inputClass + " resize-y"} /></Field>
            </div>;
          })}
        </div>
      </AdminForm>
    </section>

    <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h3 className="font-headline text-base font-bold">{l("Permanences et responsables des clés", "Keyholder shifts")}</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">{l("Les créneaux bleus apparaissent dans la fenêtre flottante du local. Week-ends et jours fériés restent fermés.", "Blue slots appear in the floating local-hours panel. Weekends and public holidays remain closed.")}</p></div><span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">{sortedShifts.length} {l("créneau(x)", "shift(s)")}</span></div>
      {keyholders.length === 0 && <p role="status" className="mb-5 rounded-xl border border-tertiary/20 bg-tertiary/5 p-3 text-xs leading-5 text-on-surface-variant">{l("Aucun responsable des clés n’est attribué. Le bureau restreint est ajouté automatiquement ; il peut attribuer cette responsabilité aux VP de pôles depuis Membres et rôles.", "No keyholders are assigned. The executive board is added automatically and can grant keyholder status to pole vice presidents in Members and roles.")}</p>}
      <div className="space-y-3">
        {sortedShifts.map(shift => <ShiftEditor key={shift.id} shift={shift} keyholders={keyholders} english={english} />)}
        {sortedShifts.length === 0 && <EmptyState icon="event_busy" title={l("Aucune permanence annoncée", "No shifts posted")} description={l("Sans créneau, le site indique que le local peut être fermé et couvre la boutique HelloAsso.", "Without a shift, the site says the local may be closed and covers the HelloAsso shop.")} />}
      </div>
      <div className="mt-5 rounded-xl border border-tertiary/20 bg-surface-container-lowest p-4">
        <h4 className="mb-4 text-sm font-bold">{l("Ajouter une permanence", "Add a shift")}</h4>
        <ShiftForm keyholders={keyholders} english={english} />
      </div>
    </section>
  </section>;
}

function ShiftEditor({ shift, keyholders, english }: { shift: Shift; keyholders: Keyholder[]; english: boolean }) {
  const l = (fr: string, en: string) => english ? en : fr;
  const day = weekdays.find(([value]) => value === shift.weekday);
  return <article className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4">
    <div className="mb-3 flex items-center justify-between gap-2"><h4 className="text-sm font-bold">{day ? l(day[1], day[2]) : "—"} · {shift.starts_at.slice(0, 5)}–{shift.ends_at.slice(0, 5)}</h4><ConfirmDeleteButton action={() => deleteLocalShift(shift.id)} title={l("Supprimer cette permanence ?", "Delete this shift?")} description={l("Le créneau ne sera plus affiché et le local pourra apparaître fermé sur cette période.", "This shift will no longer be shown and the local may appear closed for this time.")} label={l("Supprimer", "Delete")} /></div>
    <ShiftForm shift={shift} keyholders={keyholders} english={english} />
  </article>;
}

function ShiftForm({ shift, keyholders, english }: { shift?: Shift; keyholders: Keyholder[]; english: boolean }) {
  const l = (fr: string, en: string) => english ? en : fr;
  return <AdminForm action={saveLocalShift} submitLabel={shift ? l("Modifier la permanence", "Update shift") : l("Ajouter la permanence", "Add shift")} successMessage={l("La permanence est enregistrée.", "The shift has been saved.")}>
    {shift && <input type="hidden" name="id" value={shift.id} />}
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Field label={l("Jour", "Day")}><select name="weekday" required defaultValue={shift?.weekday || 1} className={inputClass}>{weekdays.map(([id, fr, en]) => <option key={id} value={id}>{l(fr, en)}</option>)}</select></Field>
      <Field label={l("Début", "Starts")}><input type="time" name="starts_at" required defaultValue={shift?.starts_at.slice(0, 5) || "08:30"} className={inputClass} /></Field>
      <Field label={l("Fin", "Ends")}><input type="time" name="ends_at" required defaultValue={shift?.ends_at.slice(0, 5) || "10:00"} className={inputClass} /></Field>
      <Field label={l("Responsable des clés", "Keyholder")}><select name="keyholder_member_id" required defaultValue={shift?.keyholder_member_id || ""} className={inputClass}><option value="" disabled>{l("Choisir un membre", "Choose a member")}</option>{keyholders.map(member => <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>)}</select></Field>
      <Field label={l("Note (facultative)", "Note (optional)")}><input name="note" maxLength={180} defaultValue={shift?.note || ""} className={inputClass} placeholder={l("Ex. : permanence après les cours", "E.g. after-class shift")} /></Field>
    </div>
  </AdminForm>;
}
