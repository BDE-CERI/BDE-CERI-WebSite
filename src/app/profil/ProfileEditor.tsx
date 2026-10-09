"use client";

import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";
import { updateProfile } from "./actions";
import { AdminForm, Field, inputClass } from "./AdminUI";

export type MemberProfile = {
  id: string; first_name: string; last_name: string; email?: string | null; photo_url?: string | null;
  role?: string | null; role_label?: string | null; category?: string | null; pole_id?: string | null;
  bio?: string | null; responsibilities?: string | null; academic_journey?: string | null;
  study_level?: string | null; discord?: string | null; instagram?: string | null; rank?: number | null; is_visible?: boolean | null; hide_last_name?: boolean | null;
};

const studyLevels = ["L1", "BUT 1", "L1/2", "L2", "BUT 2", "L2/3", "L3", "BUT 3", "M1", "M2", "D1", "D2", "D3"];

export default function ProfileEditor({ member, canManage, editingOther = false, english = false, copy }: {
  member: MemberProfile; canManage: boolean; editingOther?: boolean; english?: boolean; copy: Record<string, string>;
}) {
  return (
    <div className="min-w-0 space-y-5">
      {editingOther && <p role="status" className="flex items-start gap-2 rounded-2xl border border-tertiary/25 bg-tertiary/5 p-4 text-sm leading-6 text-on-surface-variant">
        <span aria-hidden="true" className="material-symbols-outlined mt-0.5 text-lg text-tertiary">manage_accounts</span>
        {copy.member_edit_banner.replace("{name}", member.first_name + " " + member.last_name)}
      </p>}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low px-5 py-4">
        <div><h3 className="font-headline text-lg font-bold">{member.first_name} {member.last_name}</h3><p className="mt-1 text-xs text-on-surface-variant">{member.role_label || copy.member_access}</p></div>
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
                {editingOther ? <Field label={copy.email} hint={copy.email_hint}><input type="email" value={member.email || ""} disabled className={inputClass} /></Field> :
                  <Link href="/profil?section=settings" className="inline-flex items-center gap-2 text-xs font-semibold text-tertiary hover:underline">
                    <span aria-hidden="true" className="material-symbols-outlined text-base">settings</span>
                    {english ? "Account email and sign-in settings" : "Adresse du compte et paramètres de connexion"}
                  </Link>}
                <div className={"grid gap-4 " + (canManage ? "sm:grid-cols-2" : "")}>
                  <Field label={copy.study_level} required>
                    <select name="study_level" defaultValue={member.study_level || ""} required className={inputClass}>
                      <option value="" disabled>{copy.choose_level}</option>
                      {member.study_level && !studyLevels.includes(member.study_level) && <option value={member.study_level}>{member.study_level}</option>}
                      {studyLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                    </select>
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
