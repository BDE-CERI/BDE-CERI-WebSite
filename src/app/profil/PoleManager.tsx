"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { getDictionary } from "@/locales/dictionaries";
import { addPole, updatePole, deletePole } from "./actions";
import ImageUpload from "@/components/ImageUpload";
import { AdminForm, ConfirmDeleteButton, EmptyState, Field, ManagerToolbar, inputClass } from "./AdminUI";

type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
const MAX_ORDER = 2147483647;

interface PoleItem {
  id: string;
  name: string;
  description?: string | null;
  full_content?: string | null;
  color?: string | null;
  image_url?: string | null;
  order_index?: number | null;
}

function PoleEditor({ pole, defaultOrder, dict, onCancel, onSuccess }: { pole?: PoleItem; defaultOrder: number; dict: Dictionary; onCancel: () => void; onSuccess: () => void }) {
  const en = dict.profil.title === "My Account";
  const l = (fr: string, english: string) => en ? english : fr;
  const initialColor = pole?.color && /^#[0-9a-f]{3}$/i.test(pole.color) ? "#" + pole.color.slice(1).split("").map(char => char + char).join("") : pole?.color || "#7BD0FF";
  const [color, setColor] = useState(initialColor);
  const validColor = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color) ? color.slice(0, 7) : "#7BD0FF";
  return (
    <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4 sm:p-6">
      <div className="mb-6 border-b border-outline-variant/20 pb-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">{pole ? l("Modification du pôle", "Editing team") : l("Création", "Creation")}</p>
        <h3 className="break-words font-headline text-xl font-bold">{pole?.name || l("Nouveau pôle", "New team")}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">{pole ? l("Clarifiez sa mission et ajustez son identité dans l'atlas et sur sa page dédiée.", "Describe its mission and adjust its identity in the atlas and on its dedicated page.") : l("Présentez sa mission et son identité. Le pôle apparaît sur le site dès sa création ; les membres peuvent ensuite y être affectés.", "Describe its mission and visual identity. The team appears on the website as soon as it is created; members can then be assigned to it.")}</p>
      </div>
      <AdminForm action={pole ? updatePole : addPole} submitLabel={pole ? l("Enregistrer les modifications", "Save changes") : l("Créer le pôle", "Create team")} successMessage={l("Pôle enregistré.", "Team saved.")} onCancel={onCancel} onSuccess={onSuccess}>
        {pole && <input type="hidden" name="id" value={pole.id} />}
        <input type="hidden" name="current_image_url" value={pole?.image_url || ""} />
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <fieldset className="min-w-0 space-y-4">
            <legend className="mb-4 font-headline text-base font-bold">{l("Mission et présentation", "Mission and overview")}</legend>
            <Field label={l("Nom du pôle", "Team name")} required>
              <input name="name" autoFocus defaultValue={pole?.name || ""} required maxLength={120} className={inputClass} />
            </Field>
            <Field label={l("Accroche", "Short introduction")} required hint={l("Résumez sa mission en une ou deux phrases pour l'atlas des pôles.", "Summarise its mission in one or two sentences for the team atlas.")}>
              <textarea name="description" defaultValue={pole?.description || ""} required rows={3} maxLength={500} className={inputClass + " resize-y"} />
            </Field>
            <Field label={l("Présentation détaillée", "Detailed description")} hint={l("Expliquez les projets, les activités et comment participer. Ce texte apparaît sur la page du pôle.", "Explain the projects, activities and how to get involved. This text appears on the team's page.")}>
              <textarea name="full_content" defaultValue={pole?.full_content || ""} rows={9} maxLength={100000} className={inputClass + " resize-y"} />
            </Field>
          </fieldset>
          <fieldset className="min-w-0 space-y-5">
            <legend className="mb-4 font-headline text-base font-bold">{l("Affichage et identité", "Display and identity")}</legend>
            <Field label={l("Ordre d'affichage", "Display order")} required hint={l("Les plus petites valeurs apparaissent en premier dans le site. Deux pôles peuvent partager la même valeur.", "Lower values appear first on the website. Two teams can share the same value.")}>
              <input name="order_index" type="number" min={0} max={MAX_ORDER} step={1} required defaultValue={pole ? pole.order_index ?? 0 : defaultOrder} className={inputClass} />
            </Field>
            <Field label={l("Couleur du pôle", "Team colour")} required hint={l("Choisissez une couleur ou saisissez un code hexadécimal à six ou huit caractères, par exemple #7BD0FF ou #7BD0FFCC avec transparence.", "Choose a colour or enter a six- or eight-character hexadecimal code, such as #7BD0FF or #7BD0FFCC with transparency.")}>
              <div className="flex min-w-0 items-center gap-3">
                <input type="color" aria-label={l("Choisir la couleur du pôle", "Choose the team colour")} value={validColor} onChange={event => setColor(event.target.value.toUpperCase() + (/^#[0-9a-f]{8}$/i.test(color) ? color.slice(7).toUpperCase() : ""))} className="h-12 w-14 shrink-0 cursor-pointer rounded-lg border border-outline-variant/30 bg-surface-container-high p-1" />
                <input name="color" aria-label={l("Code hexadécimal de la couleur du pôle", "Team colour hexadecimal code")} value={color} onChange={event => setColor(event.target.value)} pattern="#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?" required maxLength={9} className={inputClass + " font-mono uppercase"} />
              </div>
            </Field>
            <Field label={l("Image de couverture", "Cover image")} hint={pole ? l("Sans nouvelle image, la couverture actuelle est conservée.", "The existing cover is kept if you do not choose a new image.") : l("Une couverture est facultative ; choisissez une image qui représente la mission du pôle.", "A cover is optional; choose an image that represents the team's mission.")}>
              <ImageUpload name="image" english={en} defaultValue={pole?.image_url || undefined} />
            </Field>
            <p className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4 text-xs leading-relaxed text-on-surface-variant">{l("Pour changer les responsables ou les membres du pôle, utilisez les affectations dans la rubrique ", "To change the team leader or members, use assignments in the ")}<Link href="/profil?section=members" className="font-semibold text-primary underline underline-offset-4">{l("Membres", "Members")}</Link>{l(".", " section.")}</p>
          </fieldset>
        </div>
      </AdminForm>
    </div>
  );
}

export default function PoleManager({ poles, dict, embedded = false }: { poles: PoleItem[]; dict: Dictionary; embedded?: boolean }) {
  const en = dict.profil.title === "My Account";
  const l = (fr: string, english: string) => en ? english : fr;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const closeEditor = () => { setEditingId(null); setCreating(false); requestAnimationFrame(() => (embedded ? document.getElementById("admin-section-title") : headingRef.current)?.focus()); };
  const query = search.trim().toLocaleLowerCase();
  const visible = poles.filter(pole => !query || [pole.name, pole.description].some(value => value?.toLocaleLowerCase().includes(query)));
  const editingPole = poles.find(pole => pole.id === editingId);
  const defaultOrder = Math.min(MAX_ORDER, poles.reduce((highest, pole) => Math.max(highest, pole.order_index ?? 0), -1) + 1);

  return (
    <section className="space-y-5" aria-label={l("Gestion des pôles", "Team management")}>
      {(!embedded || (!creating && !editingPole)) && <header className={"flex flex-col gap-4 sm:flex-row sm:items-start " + (embedded ? "sm:justify-end" : "sm:justify-between")}>
        {!embedded && <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="font-headline text-2xl font-bold">{l("Pôles", "Teams")}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{l("Organisez les pôles, leur mission et leur présentation sur le site.", "Organise teams, their missions and how they appear on the website.")}</p>
        </div>}
        {!creating && !editingPole && <button type="button" onClick={() => { setCreating(true); setNotice(""); }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"><span aria-hidden="true" className="material-symbols-outlined text-lg">add</span>{l("Nouveau pôle", "New team")}</button>}
      </header>}
      {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"><span aria-hidden="true" className="material-symbols-outlined text-lg">check_circle</span>{notice}</p>}
      {creating || editingPole ? <PoleEditor key={editingPole?.id || "new"} pole={editingPole} defaultOrder={defaultOrder} dict={dict} onCancel={closeEditor} onSuccess={() => { closeEditor(); setNotice(editingPole ? l("Les modifications du pôle ont été enregistrées.", "The team changes have been saved.") : l("Le pôle a été créé. Vous pouvez maintenant y affecter ses membres.", "The team has been created. You can now assign its members.")); }} /> : <>
        <ManagerToolbar search={search} onSearch={setSearch} placeholder={l("Rechercher un pôle ou une mission…", "Search for a team or mission…")} />
        <p className="text-xs text-on-surface-variant" aria-live="polite">{visible.length} / {poles.length} {l("pôles", "teams")}</p>
        {poles.length > 0 && <p className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-xs leading-relaxed text-on-surface-variant">{l("Un pôle lié à des membres ne peut pas être supprimé. Retirez ses affectations et changez le pôle principal des membres concernés dans ", "A team linked to members cannot be deleted. Remove its assignments and change the main team of the relevant members in ")}<Link href="/profil?section=members" className="font-semibold text-primary underline underline-offset-4">{l("Membres", "Members")}</Link>.</p>}
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          {visible.map(pole => <article key={pole.id} className="flex min-w-0 flex-col rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant/20 text-lg font-bold text-slate-950" style={{ backgroundColor: pole.color || "#7BD0FF" }} aria-hidden="true">{pole.name?.charAt(0) || "P"}</div>
              <div className="min-w-0 flex-1"><h3 className="break-words font-bold text-on-surface">{pole.name}</h3><p className="mt-1 text-xs text-on-surface-variant">{pole.order_index === null || pole.order_index === undefined ? l("Ordre non défini", "Display order not set") : l("Ordre ", "Order ") + pole.order_index}</p></div>
            </div>
            <p className="mb-5 mt-4 flex-1 break-words text-sm leading-relaxed text-on-surface-variant">{pole.description || l("La mission de ce pôle reste à présenter.", "This team's mission has yet to be described.")}</p>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/15 pt-3">
              <Link href={"/poles/" + pole.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"><span aria-hidden="true" className="material-symbols-outlined text-lg">open_in_new</span>{l("Voir", "View")}</Link>
              <button type="button" onClick={() => { setEditingId(pole.id); setNotice(""); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20"><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>{l("Modifier", "Edit")}</button>
              <ConfirmDeleteButton action={() => deletePole(pole.id)} title={l("Supprimer ce pôle ?", "Delete this team?")} description={l("« " + pole.name + " » sera définitivement retiré du site et de l’atlas. La suppression est refusée tant qu’un membre ou une affectation lui est lié. Gérez d’abord ces liens dans la rubrique Membres.", "“" + pole.name + "” will be permanently removed from the website and atlas. Deletion is blocked while any member or assignment is linked to it. Manage these links in the Members section first.")} label={l("Supprimer", "Delete")} onSuccess={() => setNotice(l("Le pôle a été supprimé.", "The team has been deleted."))} />
            </div>
          </article>)}
        </div>
        {visible.length === 0 && <EmptyState icon="account_tree" title={poles.length ? l("Aucun pôle correspondant", "No matching teams") : l("Aucun pôle pour le moment", "No teams yet")} description={poles.length ? l("Essayez un autre nom ou un mot de la mission.", "Try another name or a word from the mission.") : l("Créez votre premier pôle avec le bouton ci-dessus, puis affectez ses membres depuis la rubrique Membres.", "Create your first team using the button above, then assign its members in the Members section.")} />}
      </>}
    </section>
  );
}
