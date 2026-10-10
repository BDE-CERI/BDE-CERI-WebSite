"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import ImageUpload from "@/components/ImageUpload";
import { updateProfile } from "./actions";
import { AdminForm, Field, inputClass } from "./AdminUI";
import { STUDY_LEVEL_OPTIONS } from "./study-levels";
import { getMemberAdminLabel } from "@/utils/member-roles";

export type MemberProfile = {
  id: string; first_name: string; last_name: string; email?: string | null; photo_url?: string | null;
  role?: string | null; role_label?: string | null; category?: string | null; pole_id?: string | null;
  bio?: string | null; responsibilities?: string | null; academic_journey?: string | null; role_description?: string | null;
  study_level?: string | null; discord?: string | null; instagram?: string | null; rank?: number | null; is_visible?: boolean | null; hide_last_name?: boolean | null; membership_paid?: boolean | null; is_keyholder?: boolean | null; is_dev?: boolean | null;
};

function StudyLevelPicker({ value, english }: { value: string | null | undefined; english: boolean }) {
  const initial = value && STUDY_LEVEL_OPTIONS.includes(value as typeof STUDY_LEVEL_OPTIONS[number]) ? value : "";
  const [query, setQuery] = useState(initial);
  const [selected, setSelected] = useState(initial);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = "study-level-options-" + useId();
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return STUDY_LEVEL_OPTIONS.filter(level => level.toLocaleLowerCase().includes(normalized));
  }, [query]);

  const choose = (level: string) => {
    setQuery(level);
    setSelected(level);
    setOpen(false);
    inputRef.current?.setCustomValidity("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(index => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && filtered[activeIndex]) {
      event.preventDefault();
      choose(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return <div className="relative">
    <input
      ref={inputRef}
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listId}
      aria-activedescendant={open && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
      value={query}
      required
      autoComplete="off"
      placeholder={english ? "Search and select a study level" : "Rechercher puis sélectionner un niveau"}
      className={inputClass}
      onFocus={() => setOpen(true)}
      onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      onKeyDown={onKeyDown}
      onChange={event => {
        setQuery(event.target.value);
        setSelected("");
        setActiveIndex(0);
        setOpen(true);
        event.target.setCustomValidity(english ? "Select a level from the list." : "Sélectionnez un niveau dans la liste.");
      }}
    />
    <input type="hidden" name="study_level" value={selected} />
    {open && <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-1.5 shadow-xl">
      {filtered.length ? filtered.map((level, index) => <li key={level} id={`${listId}-${index}`} role="option" aria-selected={level === selected}>
        <button type="button" tabIndex={-1} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-tertiary/10 focus:bg-tertiary/10 focus:outline-none" onMouseDown={event => event.preventDefault()} onClick={() => choose(level)}>{level}</button>
      </li>) : <li className="px-3 py-2 text-sm text-on-surface-variant">{english ? "No matching level" : "Aucun niveau correspondant"}</li>}
    </ul>}
  </div>;
}

export default function ProfileEditor({ member, canManage, editingOther = false, showMembershipStatus = false, showKeyholderStatus = false, forceKeyholder = false, isPoleVicePresident = false, english = false, copy }: {
  member: MemberProfile; canManage: boolean; editingOther?: boolean; showMembershipStatus?: boolean; showKeyholderStatus?: boolean; forceKeyholder?: boolean; isPoleVicePresident?: boolean; english?: boolean; copy: Record<string, string>;
}) {
  return (
    <div className="min-w-0 space-y-5">
      {editingOther && <p role="status" className="flex items-start gap-2 rounded-2xl border border-tertiary/25 bg-tertiary/5 p-4 text-sm leading-6 text-on-surface-variant">
        <span aria-hidden="true" className="material-symbols-outlined mt-0.5 text-lg text-tertiary">manage_accounts</span>
        {copy.member_edit_banner.replace("{name}", member.first_name + " " + member.last_name)}
      </p>}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low px-5 py-4">
        <div><h3 className="font-headline text-lg font-bold">{member.first_name} {member.last_name}</h3><p className="mt-1 text-xs text-on-surface-variant">{getMemberAdminLabel(member, english).primary || copy.member_access}</p>{member.category && <p className="mt-0.5 text-[10px] uppercase tracking-wide text-on-surface-variant/70">{getMemberAdminLabel(member, english).category}</p>}</div>
        <Link href={"/equipe/" + member.id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-tertiary hover:underline">
          {copy.public_profile}<span aria-hidden="true" className="material-symbols-outlined text-base">open_in_new</span>
        </Link>
      </div>
      <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-7">
        <AdminForm key={member.id} action={updateProfile} submitLabel={copy.profile_save}>
          {editingOther && <input type="hidden" name="target_member_id" value={member.id} />}
          <section className="space-y-5">
            <div><h3 className="font-headline text-base font-bold">{copy.identity}</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">{copy.identity_desc}</p></div>
            <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,190px)_minmax(0,1fr)]">
              <div className="max-w-[220px] space-y-2">
                <p className="text-xs font-semibold">{copy.photo}</p>
                <ImageUpload english={english} name="photo" defaultValue={member.photo_url || undefined} aspectRatio={1} circular />
              </div>
              <div className="min-w-0 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={copy.first_name} required><input autoComplete="given-name" name="first_name" defaultValue={member.first_name} required maxLength={100} className={inputClass} /></Field>
                  <Field label={copy.last_name} required><input autoComplete="family-name" name="last_name" defaultValue={member.last_name} required maxLength={100} className={inputClass} /></Field>
                </div>
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                  <input type="hidden" name="hide_last_name" value="false" />
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" name="hide_last_name" value="true" defaultChecked={member.hide_last_name !== false} aria-describedby={"hide-last-name-help-" + member.id} className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" />
                    <span className="text-sm font-semibold leading-5">{english ? "Hide my last name on public pages" : "Masquer mon nom de famille sur les pages publiques"}</span>
                  </label>
                  <p id={"hide-last-name-help-" + member.id} className="ml-7 mt-2 text-xs leading-5 text-on-surface-variant">{english ? "Only your first name will appear on public pages: the team, profiles, departments and article signatures. Your last name remains available in the administration area." : "Seul votre prénom sera affiché sur les pages publiques : équipe, profils, pôles et signatures d’articles. Votre nom de famille reste disponible dans l’espace d’administration."}</p>
                </div>
                {canManage && showMembershipStatus && <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 sm:col-span-2"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" name="membership_paid" value="true" defaultChecked={member.membership_paid === true} className="mt-0.5 size-4 shrink-0 accent-tertiary" /><input type="hidden" name="membership_paid" value="false" /><span><span className="block text-sm font-semibold">{english ? "Annual membership paid (€5)" : "Adhésion annuelle réglée (5 €)"}</span><span className="mt-1 block text-xs leading-5 text-on-surface-variant">{english ? "This status controls the check or cross shown next to the member’s name." : "Ce statut détermine la coche ou la croix affichée à côté du nom du membre."}</span></span></label></div>}
                {canManage && (showMembershipStatus || showKeyholderStatus) && <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 sm:col-span-2"><label className={"flex items-start gap-3 " + (forceKeyholder || !isPoleVicePresident ? "cursor-not-allowed" : "cursor-pointer")}>
                  <input type="checkbox" name="is_keyholder" value="true" defaultChecked={forceKeyholder || (isPoleVicePresident && member.is_keyholder === true)} disabled={forceKeyholder || !isPoleVicePresident} className="mt-0.5 size-4 shrink-0 accent-tertiary disabled:opacity-70" />
                  {!forceKeyholder && <input type="hidden" name="is_keyholder" value="false" />}
                  <span><span className="block text-sm font-semibold">{english ? "Responsible for the local keys" : "Responsable des clés du local"}</span><span className="mt-1 block text-xs leading-5 text-on-surface-variant">{forceKeyholder
                    ? (english ? "Executive board members keep this status enabled. It can only be removed directly in the database." : "Les membres du bureau restreint conservent cette responsabilité. Elle ne peut être retirée que directement dans la base de données.")
                    : isPoleVicePresident
                      ? (english ? "Only the executive board can grant or remove this status for pole vice presidents." : "Seul le bureau restreint peut attribuer ou retirer cette responsabilité aux VP de pôles.")
                      : (english ? "Only pole vice presidents can be assigned local keys." : "Seuls les VP de pôles peuvent recevoir la responsabilité des clés.")}</span></span>
                </label></div>}
                {editingOther ? <Field label={copy.email} hint={copy.email_hint}><input type="email" value={member.email || ""} disabled className={inputClass} /></Field> :
                  <Link href="/profil?section=settings" className="inline-flex items-center gap-2 text-xs font-semibold text-tertiary hover:underline">
                    <span aria-hidden="true" className="material-symbols-outlined text-base">settings</span>
                    {english ? "Account email and sign-in settings" : "Adresse du compte et paramètres de connexion"}
                  </Link>}
                <div className={"grid gap-4 " + (canManage ? "sm:grid-cols-2" : "")}>
                  <Field label={copy.study_level} hint={english ? "Type to filter the enumerated values, then select the matching level." : "Saisissez du texte pour filtrer les valeurs énumérées, puis sélectionnez le niveau correspondant."} required>
                    <StudyLevelPicker key={member.id} value={member.study_level} english={english} />
                  </Field>
                  {canManage && <Field label={copy.display_order} hint={copy.display_order_hint}><input name="rank" type="number" min="0" step="1" defaultValue={member.rank ?? 100} className={inputClass} /></Field>}
                </div>
              </div>
            </div>
          </section>
          <section className="space-y-4 border-t border-outline-variant/15 pt-6">
            <div><h3 className="font-headline text-base font-bold">{copy.presentation}</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">{copy.presentation_desc}</p></div>
            <Field label={copy.bio}><textarea name="bio" defaultValue={member.bio || ""} rows={4} maxLength={10000} className={inputClass + " resize-y"} /></Field>
            <div className="grid gap-4 xl:grid-cols-2">
              <Field label={copy.responsibilities}><textarea name="responsibilities" defaultValue={member.responsibilities || ""} rows={4} maxLength={10000} className={inputClass + " resize-y"} /></Field>
              <Field label={copy.academic_journey}><textarea name="academic_journey" defaultValue={member.academic_journey || ""} rows={4} maxLength={10000} className={inputClass + " resize-y"} /></Field>
            </div>
          </section>
          <section className="space-y-4 border-t border-outline-variant/15 pt-6">
            <div><h3 className="font-headline text-base font-bold">{copy.social}</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">{copy.social_desc}</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.discord}><input name="discord" defaultValue={member.discord || ""} maxLength={100} placeholder="pseudo" className={inputClass} /></Field>
              <Field label={copy.instagram}><input name="instagram" defaultValue={member.instagram || ""} maxLength={100} placeholder="@pseudo" className={inputClass} /></Field>
            </div>
          </section>
        </AdminForm>
      </div>
    </div>
  );
}
