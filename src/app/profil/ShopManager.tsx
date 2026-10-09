"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { addProduct, updateProduct, deleteProduct } from "./actions";
import ImageUpload from "@/components/ImageUpload";
import {
  AdminForm,
  ConfirmDeleteButton,
  EmptyState,
  Field,
  ManagerToolbar,
  inputClass,
} from "./AdminUI";

interface ProductItem {
  id: string;
  name: string;
  description: string;
  full_content?: string;
  price: number;
  category?: string;
  branding_category?: string;
  image_url?: string;
  is_available: boolean;
  stock?: number;
  sizes?: string[];
}

type Catalogue = "taverne" | "collection";
type Editor = { mode: "create"; catalogue: Catalogue } | { mode: "edit"; catalogue: Catalogue; item: ProductItem };

function getCopy(english: boolean) {
  return english
    ? {
        title: "Local product catalogue",
        intro: "Manage the product pages stored on this website. Orders, payments and HelloAsso inventory are managed separately in HelloAsso.",
        openShop: "View the public shop",
        taverne: "Tavern",
        collection: "BDE collection",
        add: "Add a product",
        create: "New product",
        edit: "Edit",
        editing: "Editing product",
        created: "Product added to the local catalogue.",
        updated: "Product saved.",
        deleted: "Product deleted.",
        search: "Search by product name, description or category…",
        allStock: "All stock levels",
        inStock: "In stock",
        outStock: "Out of stock",
        noStock: "Stock not set",
        unavailable: "Unavailable",
        stock: "Stock",
        stockHint: "Number of units in the local catalogue.",
        results: "products",
        noProducts: "No products in this catalogue",
        noProductsHint: "Add a product to keep the local catalogue organised.",
        noResults: "No matching products",
        noResultsHint: "Try another search or reset the filters.",
        reset: "Reset filters",
        name: "Product name",
        namePlaceholder: "e.g. CERI hoodie",
        description: "Short description",
        descriptionHint: "A concise introduction for the product page.",
        details: "Detailed description",
        detailsHint: "Additional information shown on the dedicated product page.",
        price: "Price in euros",
        priceHint: "Use a comma or decimal point, e.g. 2.50.",
        invalidPrice: "Enter a price of at least €0 with no more than two decimal places.",
        invalidStock: "Stock must be a whole number of at least 0.",
        invalidCategory: "Choose a category in the selected catalogue.",
        category: "Category",
        catalogue: "Catalogue",
        categoryHint: "The catalogue cannot be changed when editing an existing product.",
        drink: "Drink",
        snack: "Snack",
        clothing: "Clothing",
        accessory: "Accessory",
        goodies: "Merchandise",
        sizes: "Available sizes",
        sizesHint: "Optional. Only select sizes you offer.",
        image: "Product image",
        imageHint: "Choose an image that clearly shows the product.",
        save: "Save changes",
        publish: "Add to catalogue",
        delete: "Delete",
        deleteTitle: "Delete this product?",
        deleteDescription: "This removes the product and its page from the local catalogue. HelloAsso products are unaffected.",
        preview: "Preview page",
        formHint: "Complete the required fields, then save. Finish or cancel this form before editing another product.",
      }
    : {
        title: "Catalogue local des produits",
        intro: "Gérez les fiches enregistrées sur ce site. Les commandes, les paiements et le stock HelloAsso se gèrent séparément sur HelloAsso.",
        openShop: "Voir la boutique publique",
        taverne: "Taverne",
        collection: "Collection BDE",
        add: "Ajouter un produit",
        create: "Nouveau produit",
        edit: "Modifier",
        editing: "Modification du produit",
        created: "Produit ajouté au catalogue local.",
        updated: "Produit enregistré.",
        deleted: "Produit supprimé.",
        search: "Rechercher un nom, une description ou une catégorie…",
        allStock: "Tous les stocks",
        inStock: "En stock",
        outStock: "Épuisé",
        noStock: "Stock non renseigné",
        unavailable: "Indisponible",
        stock: "Stock",
        stockHint: "Nombre d’unités dans le catalogue local.",
        results: "produits",
        noProducts: "Aucun produit dans ce catalogue",
        noProductsHint: "Ajoutez un produit pour organiser votre catalogue local.",
        noResults: "Aucun produit correspondant",
        noResultsHint: "Essayez une autre recherche ou réinitialisez les filtres.",
        reset: "Réinitialiser les filtres",
        name: "Nom du produit",
        namePlaceholder: "Ex. : sweat CERI",
        description: "Description courte",
        descriptionHint: "Une présentation concise pour la fiche du produit.",
        details: "Description détaillée",
        detailsHint: "Les informations complémentaires de la page dédiée.",
        price: "Prix en euros",
        priceHint: "Virgule ou point accepté, par exemple 2,50.",
        invalidPrice: "Saisissez un prix supérieur ou égal à 0 € avec deux décimales au maximum.",
        invalidStock: "Le stock doit être un nombre entier supérieur ou égal à 0.",
        invalidCategory: "Choisissez une catégorie du catalogue sélectionné.",
        category: "Catégorie",
        catalogue: "Catalogue",
        categoryHint: "Le catalogue d’un produit existant ne peut pas être changé lors de sa modification.",
        drink: "Boisson",
        snack: "Snack",
        clothing: "Vêtement",
        accessory: "Accessoire",
        goodies: "Goodies",
        sizes: "Tailles proposées",
        sizesHint: "Facultatif. Sélectionnez uniquement les tailles proposées.",
        image: "Photo du produit",
        imageHint: "Choisissez une image sur laquelle le produit est bien visible.",
        save: "Enregistrer les modifications",
        publish: "Ajouter au catalogue",
        delete: "Supprimer",
        deleteTitle: "Supprimer ce produit ?",
        deleteDescription: "Le produit et sa fiche seront retirés du catalogue local. Les produits HelloAsso ne sont pas concernés.",
        preview: "Aperçu de la fiche",
        formHint: "Renseignez les champs obligatoires, puis enregistrez. Terminez ou annulez ce formulaire avant de modifier un autre produit.",
      };
}

type ShopCopy = ReturnType<typeof getCopy>;

function categoriesFor(catalogue: Catalogue, copy: ShopCopy) {
  return catalogue === "collection"
    ? [{ value: "vetement", label: copy.clothing }, { value: "accessoire", label: copy.accessory }, { value: "goodies", label: copy.goodies }]
    : [{ value: "boisson", label: copy.drink }, { value: "snack", label: copy.snack }];
}

function ProductForm({
  editor,
  copy,
  english,
  onSuccess,
  onCancel,
}: {
  editor: Editor;
  copy: ShopCopy;
  english: boolean;
  onSuccess: (catalogue: Catalogue) => void;
  onCancel: () => void;
}) {
  const item = editor.mode === "edit" ? editor.item : undefined;
  const [catalogue, setCatalogue] = useState(editor.catalogue);
  const categories = categoriesFor(catalogue, copy);
  const [category, setCategory] = useState(item?.branding_category || item?.category || categories[0].value);
  const sizes = Array.from(new Set(["XS", "S", "M", "L", "XL", ...(item?.sizes || [])]));

  const submit = async (formData: FormData) => {
    const price = String(formData.get("price") || "").trim();
    const stock = String(formData.get("stock") || "").trim();
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(price) || !Number.isFinite(Number(price.replace(",", ".")))) {
      return { error: copy.invalidPrice };
    }
    if (!/^\d+$/.test(stock) || !Number.isSafeInteger(Number(stock))) {
      return { error: copy.invalidStock };
    }
    if (!categories.some((entry) => entry.value === formData.get("category"))) {
      return { error: copy.invalidCategory };
    }
    formData.set("price", price);
    if (editor.mode === "create") return addProduct(formData);
    return updateProduct(formData);
  };

  return (
    <div className="rounded-2xl border border-tertiary/30 bg-surface-container p-4 sm:p-6">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-tertiary">
          {editor.mode === "create" ? copy.create : copy.editing}
        </p>
        <h3 className="break-words font-headline text-xl font-bold">
          {item?.name || (catalogue === "collection" ? copy.collection : copy.taverne)}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{copy.formHint}</p>
      </div>
      <AdminForm
        action={submit}
        submitLabel={editor.mode === "create" ? copy.publish : copy.save}
        successMessage={editor.mode === "create" ? copy.created : copy.updated}
        onSuccess={() => onSuccess(catalogue)}
        onCancel={onCancel}
        className="space-y-6"
      >
        {item && (
          <>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="current_image_url" value={item.image_url || ""} />
          </>
        )}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-5">
            <Field label={copy.name} required>
              <input name="name" defaultValue={item?.name} placeholder={copy.namePlaceholder} required maxLength={150} className={inputClass} />
            </Field>
            <Field label={copy.description} required hint={copy.descriptionHint}>
              <textarea name="description" defaultValue={item?.description || ""} rows={3} required className={inputClass + " resize-y"} />
            </Field>
            {item && (
              <Field label={copy.details} hint={copy.detailsHint}>
                <textarea name="full_content" defaultValue={item.full_content || ""} rows={6} className={inputClass + " resize-y"} />
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.price} required hint={copy.priceHint}>
                <input
                  name="price"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]+([.,][0-9]{1,2})?"
                  defaultValue={item ? (item.price / 100).toFixed(2).replace(".", ",") : ""}
                  placeholder="2,50"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label={copy.stock} required hint={copy.stockHint}>
                <input name="stock" type="number" min="0" step="1" defaultValue={item?.stock ?? 0} required className={inputClass} />
              </Field>
            </div>
          </div>
          <div className="min-w-0 space-y-5">
            {editor.mode === "create" ? (
              <Field label={copy.catalogue} required>
                <select
                  value={catalogue}
                  onChange={(event) => {
                    const nextCatalogue = event.target.value as Catalogue;
                    setCatalogue(nextCatalogue);
                    setCategory(categoriesFor(nextCatalogue, copy)[0].value);
                  }}
                  className={inputClass}
                >
                  <option value="taverne">{copy.taverne}</option>
                  <option value="collection">{copy.collection}</option>
                </select>
              </Field>
            ) : (
              <div className="rounded-xl bg-surface-container-high p-3">
                <p className="text-sm font-bold">{catalogue === "collection" ? copy.collection : copy.taverne}</p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{copy.categoryHint}</p>
              </div>
            )}
            <Field label={copy.category} required>
              <select name="category" value={category} onChange={(event) => setCategory(event.target.value)} required className={inputClass}>
                {categories.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
              </select>
            </Field>
            {catalogue === "collection" && (
              <fieldset className="rounded-xl border border-outline-variant/20 p-4">
                <legend className="px-1 text-sm font-bold">{copy.sizes}</legend>
                <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">{copy.sizesHint}</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <label key={size} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 text-sm">
                      <input type="checkbox" name="sizes" value={size} defaultChecked={item?.sizes?.includes(size)} className="h-4 w-4 accent-tertiary" />
                      {size}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <Field label={copy.image} hint={copy.imageHint}>
              <ImageUpload name="image" defaultValue={item?.image_url} english={english} />
            </Field>
          </div>
        </div>
      </AdminForm>
    </div>
  );
}

export default function ShopManager({
  dict,
  taverneItems,
  brandingItems,
}: {
  dict: { profil: { title: string } };
  taverneItems: ProductItem[];
  brandingItems: ProductItem[];
}) {
  const english = dict.profil.title === "My Account";
  const copy = getCopy(english);
  const [catalogue, setCatalogue] = useState<Catalogue>("taverne");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState("");
  const items = catalogue === "collection" ? brandingItems : taverneItems;
  const categories = categoriesFor(catalogue, copy);
  const formatPrice = (cents: number) => new Intl.NumberFormat(english ? "en-GB" : "fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
  const term = search.trim().toLocaleLowerCase();
  const filtered = items.filter((item) => {
      const label = categories.find((entry) => entry.value === (item.branding_category || item.category))?.label || "";
      const text = [item.name, item.description, label].join(" ").toLocaleLowerCase();
      const matchesStock = stockFilter === "all" || (stockFilter === "in" ? (item.stock ?? 0) > 0 : item.stock === 0);
      return text.includes(term) && matchesStock;
  });

  return (
    <section className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-headline text-xl font-bold">{copy.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{copy.intro}</p>
          <Link href="/boutique" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-tertiary hover:underline">
            {copy.openShop}
            <span aria-hidden="true" className="material-symbols-outlined text-base">open_in_new</span>
          </Link>
        </div>
        <button
          type="button"
          disabled={editor !== null}
          onClick={() => { setNotice(""); setEditor({ mode: "create", catalogue }); }}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-tertiary px-4 py-2.5 text-sm font-bold text-on-tertiary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-lg">add</span>
          {copy.add}
        </button>
      </div>

      {notice && <p role="status" className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{notice}</p>}

      {editor && (
        <ProductForm
          key={editor.mode === "edit" ? editor.catalogue + editor.item.id : "new"}
          editor={editor}
          copy={copy}
          english={english}
          onCancel={() => setEditor(null)}
          onSuccess={(savedCatalogue) => {
            setCatalogue(savedCatalogue);
            setNotice(editor.mode === "create" ? copy.created : copy.updated);
            setEditor(null);
          }}
        />
      )}

      <div className="flex gap-2 rounded-xl bg-surface-container-high p-1.5" role="group" aria-label={copy.catalogue}>
        {(["taverne", "collection"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={catalogue === value}
            onClick={() => { setCatalogue(value); setStockFilter("all"); }}
            className={"flex min-h-11 flex-1 flex-wrap items-center justify-center gap-x-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors " + (catalogue === value ? "bg-surface-container-lowest text-tertiary shadow-sm" : "text-on-surface-variant hover:bg-surface-container")}
          >
            {value === "collection" ? copy.collection : copy.taverne}
            <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-xs tabular-nums">
              {value === "collection" ? brandingItems.length : taverneItems.length}
            </span>
          </button>
        ))}
      </div>

      <ManagerToolbar search={search} onSearch={setSearch} placeholder={copy.search}>
        <label className="sr-only" htmlFor="shop-stock-filter">{copy.stock}</label>
        <select id="shop-stock-filter" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className={inputClass + " sm:!w-auto"}>
          <option value="all">{copy.allStock}</option>
          <option value="in">{copy.inStock}</option>
          <option value="out">{copy.outStock}</option>
        </select>
      </ManagerToolbar>

      <p className="text-xs text-on-surface-variant" role="status">{filtered.length} / {items.length} {copy.results}</p>

      {filtered.length === 0 ? (
        <div>
          <EmptyState
            icon="inventory_2"
            title={items.length === 0 ? copy.noProducts : copy.noResults}
            description={items.length === 0 ? copy.noProductsHint : copy.noResultsHint}
          />
          {(search || stockFilter !== "all") && (
            <button type="button" onClick={() => { setSearch(""); setStockFilter("all"); }} className="mt-3 min-h-11 rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-bold hover:bg-surface-container-high">
              {copy.reset}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isBranding = catalogue === "collection";
            const category = categories.find((entry) => entry.value === (item.branding_category || item.category))?.label || item.branding_category || item.category;
            return (
              <article key={catalogue + item.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high">
                      {item.image_url ? <Image src={item.image_url} alt="" unoptimized width={64} height={64} className="h-full w-full object-cover" /> : <span aria-hidden="true" className="material-symbols-outlined text-2xl text-on-surface-variant">shopping_bag</span>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-bold">{item.name}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                        <span className="font-bold tabular-nums text-tertiary">{formatPrice(item.price)}</span>
                        {category && <span className="text-on-surface-variant">{category}</span>}
                        <span className={"rounded-md px-2 py-1 font-semibold " + (item.stock === 0 || item.is_available === false ? "bg-warning/10 text-warning" : (item.stock ?? 0) > 0 ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant")}>
                          {item.is_available === false ? copy.unavailable : item.stock === undefined || item.stock === null ? copy.noStock : item.stock === 0 ? copy.outStock : copy.stock + " : " + item.stock}
                        </span>
                        {item.sizes && item.sizes.length > 0 && <span className="text-on-surface-variant">{item.sizes.join(" · ")}</span>}
                      </div>
                      {item.description && <p className="mt-2 line-clamp-2 max-w-2xl break-words text-sm text-on-surface-variant">{item.description}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link href={"/boutique/" + item.id} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high">
                      {copy.preview}
                      <span aria-hidden="true" className="material-symbols-outlined text-base">open_in_new</span>
                    </Link>
                    <button
                      type="button"
                      disabled={editor !== null}
                      onClick={() => { setNotice(""); setEditor({ mode: "edit", catalogue, item }); }}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-outline-variant/30 px-3 py-2 text-sm font-bold text-tertiary hover:bg-tertiary/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-base">edit</span>
                      {copy.edit}
                    </button>
                    {!editor && (
                      <ConfirmDeleteButton
                        action={() => deleteProduct(item.id, isBranding)}
                        title={copy.deleteTitle}
                        description={item.name + " — " + copy.deleteDescription}
                        label={copy.delete}
                        onSuccess={() => setNotice(copy.deleted)}
                      />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
