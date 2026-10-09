"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { getDictionary } from "@/locales/dictionaries";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addNews, updateNews, deleteNews } from "./actions";
import ImageUpload from "@/components/ImageUpload";
import { AdminForm, ConfirmDeleteButton, EmptyState, Field, ManagerToolbar, inputClass } from "./AdminUI";

type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  published_at?: string;
  is_published: boolean;
  is_anonymous?: boolean;
}

function NewsEditor({ item, dict, onCancel, onSuccess }: { item?: NewsItem; dict: Dictionary; onCancel: () => void; onSuccess: () => void }) {
  const en = dict.profil?.title === "My Account";
  const l = (fr: string, english: string) => en ? english : fr;
  const [published, setPublished] = useState(item?.is_published || false);
  return (
    <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4 sm:p-6">
      <div className="mb-6 border-b border-outline-variant/20 pb-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">{item ? l("Modification", "Editing") : l("Création", "Creation")}</p>
        <h3 className="break-words font-headline text-xl font-bold">{item?.title || l("Nouvelle actualité", "New news post")}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">{l("Préparez votre publication, puis choisissez de la conserver en brouillon ou de la rendre visible.", "Prepare your post, then keep it as a draft or make it visible on the website.")}</p>
      </div>
      <AdminForm action={item ? updateNews : addNews} submitLabel={published ? l("Enregistrer et publier", "Save and publish") : l("Enregistrer le brouillon", "Save draft")} successMessage={l("Actualité enregistrée.", "News post saved.")} onCancel={onCancel} onSuccess={onSuccess}>
        {item && <input type="hidden" name="id" value={item.id} />}
        <input type="hidden" name="current_image_url" value={item?.image_url || ""} />
        {!published && <input type="hidden" name="is_published" value="false" />}
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <fieldset className="min-w-0 space-y-4">
            <legend className="mb-4 font-headline text-base font-bold">{l("Contenu", "Content")}</legend>
            <Field label={l("Titre", "Title")} required>
              <input name="title" autoFocus defaultValue={item?.title || ""} required maxLength={180} className={inputClass} />
            </Field>
            <Field label={l("Texte de l'actualité", "Post text")} required hint={l("Utilisez des paragraphes courts pour faciliter la lecture sur mobile.", "Use short paragraphs to make the post easy to read on mobile.")}>
              <textarea name="content" defaultValue={item?.content || ""} required rows={12} className={inputClass + " resize-y"} />
            </Field>
          </fieldset>
          <fieldset className="min-w-0 space-y-5">
            <legend className="mb-4 font-headline text-base font-bold">{l("Visibilité et couverture", "Visibility and cover")}</legend>
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" name="is_published" value="true" checked={published} onChange={event => setPublished(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
                <span><span className="block font-semibold">{l("Publier sur le site", "Publish on the website")}</span><span className="mt-1 block text-xs leading-relaxed text-on-surface-variant">{published ? l("Après l'enregistrement, l'actualité sera visible par tous les visiteurs.", "Once saved, the post will be visible to all visitors.") : l("Le brouillon reste dans cet espace et n'est pas affiché publiquement.", "The draft stays in this workspace and is not shown publicly.")}</span></span>
              </label>
              <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-outline-variant/15 pt-4">
                <input type="checkbox" name="is_anonymous" value="true" defaultChecked={item?.is_anonymous || false} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
                <span><span className="block text-sm font-semibold">{dict.news?.post_anonymously || l("Masquer mon nom d'auteur", "Hide my author name")}</span><span className="mt-1 block text-xs leading-relaxed text-on-surface-variant">{l("La publication sera présentée au nom du BDE.", "The post will be presented as a BDE announcement.")}</span></span>
              </label>
            </div>
            <Field label={l("Image de couverture", "Cover image")} hint={item ? l("Sans nouvelle image, la couverture actuelle est conservée.", "The existing cover is kept if you do not choose a new image.") : l("Ajoutez une image pour accompagner votre publication.", "Add an image to accompany your post.")}>
              <ImageUpload name="image" english={en} defaultValue={item?.image_url} />
            </Field>
          </fieldset>
        </div>
      </AdminForm>
    </div>
  );
}

export default function NewsManager({ news, dict, embedded = false }: { news: NewsItem[]; dict: Dictionary; embedded?: boolean }) {
  const en = dict.profil?.title === "My Account";
  const l = (fr: string, english: string) => en ? english : fr;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editFromUrl = searchParams.get("edit_id");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const items = news;
  const [editor, setEditor] = useState<{ source: string | null; id: string | null }>({ source: editFromUrl, id: editFromUrl });
  const editingId = editor.source === editFromUrl ? editor.id : editFromUrl;
  const setEditingId = (id: string | null) => setEditor({ source: editFromUrl, id });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const closeEditor = () => {
    setEditingId(null);
    setCreating(false);
    requestAnimationFrame(() => (embedded ? document.getElementById("admin-section-title") : headingRef.current)?.focus());
    if (editFromUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("edit_id");
      router.replace(pathname + (params.size ? "?" + params.toString() : ""), { scroll: false });
    }
  };
  const query = search.trim().toLocaleLowerCase();
  const visible = items.filter(item => (!query || [item.title, item.content].some(value => value?.toLocaleLowerCase().includes(query))) && (filter === "all" || (filter === "published" ? item.is_published : !item.is_published)));
  const editingItem = items.find(item => item.id === editingId);
  const dateLabel = (date?: string) => {
    const parsed = date ? new Date(date) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" }).format(parsed) : "";
  };

  return (
    <section className="space-y-5" aria-label={l("Gestion des actualités", "News management")}>
      {(!embedded || (!creating && !editingItem)) && <header className={"flex flex-col gap-4 sm:flex-row sm:items-start " + (embedded ? "sm:justify-end" : "sm:justify-between")}>
        {!embedded && <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="font-headline text-2xl font-bold">{l("Actualités", "News")}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{l("Préparez les annonces du BDE et maîtrisez leur publication.", "Prepare BDE announcements and manage their publication.")}</p>
        </div>}
        {!creating && !editingItem && <button type="button" onClick={() => { setCreating(true); setNotice(""); }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"><span aria-hidden="true" className="material-symbols-outlined text-lg">add</span>{l("Nouvelle actualité", "New post")}</button>}
      </header>}
      {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"><span aria-hidden="true" className="material-symbols-outlined text-lg">check_circle</span>{notice}</p>}
      {creating || editingItem ? <NewsEditor key={editingItem?.id || "new"} item={editingItem} dict={dict} onCancel={closeEditor} onSuccess={() => { closeEditor(); setNotice(l("L'actualité a été enregistrée.", "The news post has been saved.")); }} /> : <>
        <ManagerToolbar search={search} onSearch={setSearch} placeholder={l("Rechercher une actualité…", "Search news posts…")}>
          <select aria-label={l("Filtrer les actualités", "Filter news posts")} value={filter} onChange={event => setFilter(event.target.value)} className={inputClass + " sm:max-w-48"}>
            <option value="all">{l("Toutes les actualités", "All posts")}</option>
            <option value="published">{l("Publiées", "Published")}</option>
            <option value="draft">{l("Brouillons", "Drafts")}</option>
          </select>
        </ManagerToolbar>
        <p className="text-xs text-on-surface-variant" aria-live="polite">{visible.length} / {items.length} {l("actualités", "posts")}</p>
        <div className="space-y-3">
          {visible.map(item => <article key={item.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high text-primary">
                {item.image_url ? <Image src={item.image_url} alt="" width={64} height={64} loading="lazy" unoptimized className="h-full w-full object-cover" /> : <span aria-hidden="true" className="material-symbols-outlined text-3xl">article</span>}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="break-words font-bold text-on-surface">{item.title}</h3>
                {item.published_at && <p className="mt-1 text-xs text-on-surface-variant">{dateLabel(item.published_at)}</p>}
                <p className="mt-2 line-clamp-2 break-words text-sm text-on-surface-variant">{item.content}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/15 pt-3">
              <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (item.is_published ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant")}>{item.is_published ? l("Publié", "Published") : l("Brouillon", "Draft")}</span>
              <div className="flex flex-wrap items-center gap-2">
                {item.is_published ? <Link href={"/news/" + item.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"><span aria-hidden="true" className="material-symbols-outlined text-lg">open_in_new</span>{l("Voir", "View")}</Link> : <button type="button" aria-expanded={previewId === item.id} aria-controls={"draft-preview-" + item.id} onClick={() => setPreviewId(previewId === item.id ? null : item.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"><span aria-hidden="true" className="material-symbols-outlined text-lg">visibility</span>{l("Voir le brouillon", "View draft")}</button>}
                <button type="button" onClick={() => { setEditingId(item.id); setNotice(""); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20"><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>{l("Modifier", "Edit")}</button>
                <ConfirmDeleteButton action={() => deleteNews(item.id)} title={l("Supprimer cette actualité ?", "Delete this news post?")} description={l("« " + item.title + " » sera définitivement supprimé, y compris son brouillon.", "“" + item.title + "” will be permanently deleted, including its draft.")} label={l("Supprimer", "Delete")} onSuccess={() => { setNotice(l("Actualité supprimée.", "News post deleted.")); }} />
              </div>
            </div>
            {!item.is_published && previewId === item.id && <div id={"draft-preview-" + item.id} className="mt-4 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{l("Aperçu privé du brouillon", "Private draft preview")}</p><div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.content}</div></div>}
          </article>)}
          {visible.length === 0 && <EmptyState icon="article" title={items.length ? l("Aucune actualité correspondante", "No matching posts") : l("Aucune actualité pour le moment", "No posts yet")} description={items.length ? l("Essayez un autre terme ou un autre statut de publication.", "Try another search term or publication status.") : l("Préparez votre première annonce avec le bouton ci-dessus.", "Prepare your first announcement using the button above.")} />}
        </div>
      </>}
    </section>
  );
}
