"use client";
import { useMemo, useState } from "react";
import { addMemberBadges, deleteMemberBadge } from "./actions";
import { AdminForm, ConfirmDeleteButton, EmptyState, Field, inputClass } from "./AdminUI";
type DirectoryEntry = { id: string; first_name: string; last_name: string };
type BadgeEntry = { id: string; member_id: string; member_name: string; event_name: string; award: string; team_name: string; academic_year: string };
const awards = [{ value: "first", fr: "1er prix", en: "1st place" }, { value: "second", fr: "2e prix", en: "2nd place" }, { value: "third", fr: "3e prix", en: "3rd place" }, { value: "jury_choice", fr: "Coup de cœur du jury", en: "Jury’s choice" }];
export default function MemberBadgeManager({ members, badges, english = false }: { members: DirectoryEntry[]; badges: BadgeEntry[]; english?: boolean }) {
  const [search, setSearch] = useState(""); const [selected, setSelected] = useState<string[]>([]);
  const filtered = useMemo(() => members.filter(member => (member.first_name + " " + member.last_name).toLowerCase().includes(search.toLowerCase())), [members, search]);
  const awardName = (award: string) => awards.find(item => item.value === award)?.[english ? "en" : "fr"] || award;
  const toggle = (id: string, checked: boolean) => setSelected(current => checked ? [...current, id].slice(0, 4) : current.filter(value => value !== id));
  return <div className="space-y-7">
    <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-7">
      <div className="mb-6"><h2 className="font-headline text-xl font-bold">{english ? "Add an award" : "Ajouter un badge"}</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">{english ? "Choose the award, edition and up to four members of the winning team." : "Choisissez le prix, l’édition et jusqu’à quatre membres de l’équipe récompensée."}</p></div>
      <AdminForm action={addMemberBadges} submitLabel={english ? "Add award" : "Ajouter le badge"} successMessage={english ? "Award added to the selected profiles." : "Le badge a été ajouté aux profils sélectionnés."} resetOnSuccess onSuccess={() => setSelected([])}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={english ? "Award" : "Prix"}><select name="award" required className={inputClass}>{awards.map(item => <option key={item.value} value={item.value}>{english ? item.en : item.fr}</option>)}</select></Field>
          <Field label={english ? "Event" : "Événement"}><input name="event_name" required maxLength={120} defaultValue="24h pour Coder" className={inputClass} /></Field>
          <Field label={english ? "Team name" : "Nom de l’équipe"}><input name="team_name" required maxLength={120} className={inputClass} /></Field>
          <Field label={english ? "Academic year" : "Année universitaire"} hint={english ? "Format: 2025-2026" : "Format : 2025-2026"}><input name="academic_year" required pattern="20[0-9]{2}-20[0-9]{2}" placeholder="2025-2026" className={inputClass} /></Field>
        </div>
        <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold">{english ? "Team members" : "Membres de l’équipe"}</h3><p className="mt-1 text-xs text-on-surface-variant">{selected.length}/4 {english ? "selected" : "sélectionnés"}</p></div><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={english ? "Search members" : "Rechercher un membre"} className={inputClass + " sm:max-w-xs"} /></div>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-outline-variant/15 p-2">
            {filtered.map(member => { const checked = selected.includes(member.id); return <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-surface-container-high"><input type="checkbox" name="member_ids" value={member.id} checked={checked} disabled={!checked && selected.length >= 4} onChange={event => toggle(member.id, event.target.checked)} className="size-4 accent-tertiary" /><span>{member.first_name} {member.last_name}</span></label>; })}
            {filtered.length === 0 && <p className="p-3 text-sm text-on-surface-variant">{english ? "No matching members." : "Aucun membre correspondant."}</p>}
          </div>
        </div>
      </AdminForm>
    </section>
    <section className="space-y-4"><div><h2 className="font-headline text-xl font-bold">{english ? "Award records" : "Badges attribués"}</h2><p className="mt-1 text-sm text-on-surface-variant">{english ? "Awards currently displayed on public member profiles." : "Les badges affichés sur les profils publics des membres."}</p></div>
      {badges.length === 0 ? <EmptyState icon="military_tech" title={english ? "No awards yet" : "Aucun badge attribué"} description={english ? "Awards will appear here after you add them." : "Les badges ajoutés apparaîtront ici."} /> : <div className="space-y-2">{badges.map(badge => <article key={badge.id} className="flex flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">{badge.member_name}</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">{badge.event_name} · {awardName(badge.award)} · {badge.team_name} · {badge.academic_year}</p></div><ConfirmDeleteButton action={() => deleteMemberBadge(badge.id)} title={english ? "Remove this award?" : "Retirer ce badge ?"} description={english ? "The award will be removed from " + badge.member_name + "’s public profile." : "Le badge sera retiré du profil public de " + badge.member_name + "."} label={english ? "Remove" : "Retirer"} /></article>)}</div>}
    </section>
  </div>;
}
