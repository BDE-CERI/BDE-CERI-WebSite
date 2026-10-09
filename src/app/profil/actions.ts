"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { parseParisDateTimeLocal } from "@/utils/paris-time";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionResult = { success: true } | { error: string };
type Supabase = Awaited<ReturnType<typeof createClient>>;
type Permission = "member" | "board" | "news";
type MemberAccess = { id: string; category: string | null; role: string | null; pole_id: string | null };
type UploadedImage = { bucket: string; path: string; publicUrl: string; uploadedAt: number };

const boardRoles = ["president", "tresorier", "secretaire", "vp_general"];
const newsAuthorCategories = ["bureau_restreint", "bureau"];
const brandingCategories = ["vetement", "accessoire", "goodies"];
const productCategories = ["boisson", "snack", ...brandingCategories];
const maxImageSize = 5 * 1024 * 1024;
const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
};

class ActionError extends Error {}

function text(formData: FormData, field: string, label: string, max: number, required = false) {
  const value = formData.get(field);
  if (value !== null && typeof value !== "string") throw new ActionError(label + " doit être un texte.");
  const result = (value ?? "").trim();
  if (required && !result) throw new ActionError(label + " est obligatoire.");
  if (result.length > max) throw new ActionError(label + " est trop long (" + max + " caractères maximum).");
  return result;
}

function identifier(value: unknown, label = "Identifiant") {
  if (typeof value !== "string" || !/^(?:[1-9]\d{0,18}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(value)) {
    throw new ActionError(label + " invalide. Rechargez la page puis réessayez.");
  }
  return value;
}

function integer(formData: FormData, field: string, label: string, fallback: number | null = null) {
  const value = text(formData, field, label, 12);
  if (!value) return fallback;
  if (!/^\d+$/.test(value)) throw new ActionError(label + " doit être un entier positif ou nul.");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > 2147483647) throw new ActionError(label + " est trop élevé.");
  return parsed;
}

function priceInCents(formData: FormData) {
  const value = text(formData, "price", "Le prix", 16, true).replace(",", ".");
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) throw new ActionError("Le prix doit être positif ou nul, avec deux décimales maximum.");
  const [euros, cents = ""] = value.split(".");
  const price = Number(euros) * 100 + Number(cents.padEnd(2, "0"));
  if (price > 2147483647) throw new ActionError("Le prix est trop élevé.");
  return price;
}

function boolean(formData: FormData, field: string, fallback = false) {
  const value = formData.get(field);
  if (value === null) return fallback;
  if (value === "true" || value === "on" || value === "1") return true;
  if (value === "false" || value === "0" || value === "") return false;
  throw new ActionError("Le choix « " + field + " » est invalide.");
}

function hideLastName(formData: FormData) {
  const values = formData.getAll("hide_last_name");
  // The unchecked hidden value may be submitted before the checked checkbox.
  if (values.length === 0) return true;
  if (values.some(value => typeof value !== "string" || !["true", "on", "1", "false", "0", ""].includes(value))) {
    throw new ActionError("Le choix de visibilité du nom de famille est invalide.");
  }
  return values.some(value => value === "true" || value === "on" || value === "1");
}

function profilePrivacyDatabaseError(error: { message: string; code?: string; details?: string } | null) {
  if (error) {
    const details = error.message + " " + (error.details ?? "");
    if (/\bhide_last_name\b/i.test(details) && (["PGRST204", "42703"].includes(error.code ?? "") || /schema cache|column|does not exist/i.test(details))) {
      throw new ActionError("La confidentialité des profils nécessite une mise à jour de Supabase : la colonne « hide_last_name » est absente ou son cache est périmé. Appliquez la migration 202610090004_member_last_name_privacy.sql, puis réessayez. Votre saisie reste dans ce formulaire.");
    }
  }
  databaseError(error);
}

function dateStart(formData: FormData) {
  const value = text(formData, "date_start", "La date de début", 40, true);
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    const parsed = parseParisDateTimeLocal(value);
    if ("error" in parsed) {
      throw new ActionError(parsed.error === "nonexistent"
        ? "Cette heure n’existe pas à Paris lors du passage à l’heure d’été. Choisissez une autre heure."
        : "La date de début est invalide.");
    }
    return parsed.iso;
  }
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!parts || !Number.isFinite(Date.parse(value))) throw new ActionError("La date de début est invalide.");
  const [, year, month, day, hour, minute, second = "0"] = parts;
  const calendarDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (calendarDate.getUTCFullYear() !== Number(year) || calendarDate.getUTCMonth() !== Number(month) - 1 || calendarDate.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) {
    throw new ActionError("La date de début est invalide.");
  }
  return value;
}

async function access(permission: Permission) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new ActionError("Votre session a expiré. Reconnectez-vous avant de modifier ces informations.");
  const { data, error } = await supabase.from("members").select("id, category, role, pole_id").eq("auth_user_id", user.id).maybeSingle();
  if (error) throw new ActionError("Impossible de vérifier les droits de votre profil. Réessayez.");
  if (!data) throw new ActionError("Votre compte n’est pas associé à un membre du BDE.");
  const member = data as MemberAccess;
  const isBoard = member.category === "bureau_restreint" || boardRoles.includes(member.role ?? "");
  if (permission === "board" && !isBoard) throw new ActionError("Cette modification est réservée au bureau restreint.");
  if (permission === "news" && !isBoard) {
    const { data: assignments, error: assignmentError } = await supabase.from("member_assignments").select("pole_id").eq("member_id", member.id);
    if (assignmentError) throw new ActionError("Impossible de vérifier votre accès aux actualités. Réessayez.");
    const poleIds = [...new Set([member.pole_id, ...(assignments ?? []).map(assignment => assignment.pole_id)].filter((id): id is string => typeof id === "string" && id.length > 0))];
    if (poleIds.length === 0) throw new ActionError("La gestion des actualités est réservée au bureau restreint et au pôle Communication.");
    const { data: poles, error: poleError } = await supabase.from("poles").select("name").in("id", poleIds);
    if (poleError) throw new ActionError("Impossible de vérifier votre accès aux actualités. Réessayez.");
    const isCommunication = poles?.some(pole => typeof pole.name === "string" && /(?:communication|\bcom\b)/i.test(pole.name));
    if (!isCommunication) throw new ActionError("La gestion des actualités est réservée au bureau restreint et au pôle Communication.");
  }
  return { supabase, member, isBoard };
}

function databaseError(error: { message: string } | null) {
  if (error) throw new ActionError("La modification n’a pas pu être enregistrée : " + error.message);
}

async function perform(name: string, action: () => Promise<void>): Promise<ActionResult> {
  try {
    await action();
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ActionError) return { error: error.message };
    console.error("Erreur dans " + name + ":", error);
    return { error: "Une erreur inattendue est survenue. Votre modification n’a pas pu être confirmée. Réessayez." };
  }
}

async function existing(supabase: Supabase, table: string, id: string, includeSizes = false) {
  const { data, error } = includeSizes
    ? await supabase.from(table).select("id, image_url, sizes").eq("id", id).maybeSingle()
    : await supabase.from(table).select("id, image_url").eq("id", id).maybeSingle();
  databaseError(error);
  if (!data) throw new ActionError("Cet élément n’est plus disponible ou vous n’avez pas accès à sa modification. Rechargez la page.");
  return data;
}

function validateImageSignature(bytes: Uint8Array, type: string) {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (type === "image/gif") return ["GIF87a", "GIF89a"].includes(ascii(0, 6));
  if (type === "image/webp") return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  if (type === "image/avif") return ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 64));
  return false;
}

async function image(supabase: Supabase, formData: FormData, field: string, bucket: string, current: string | null = null, onUpload?: (upload: UploadedImage) => void) {
  const value = formData.get(field);
  if (value === null || (typeof value !== "string" && value.size === 0)) return current;
  if (typeof value === "string") throw new ActionError("Le fichier image est invalide.");
  const extension = imageExtensions[value.type];
  if (!extension) throw new ActionError("Formats acceptés : JPEG, PNG, WebP, GIF ou AVIF.");
  if (value.size > maxImageSize) throw new ActionError("L’image doit peser 5 Mo maximum.");
  const header = new Uint8Array(await value.slice(0, 64).arrayBuffer());
  if (!validateImageSignature(header, value.type)) throw new ActionError("Le contenu du fichier ne correspond pas à un format d’image accepté.");
  const fileName = randomUUID() + "." + extension;
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, value, { contentType: value.type, upsert: false });
  if (error || !data) throw new ActionError("L’image n’a pas pu être envoyée. Réessayez avec une image de moins de 5 Mo.");
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
  onUpload?.({ bucket, path: data.path, publicUrl, uploadedAt: Date.now() });
  return publicUrl;
}

function refresh(paths: string[]) {
  revalidatePath("/profil");
  paths.forEach(path => revalidatePath(path));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  return perform("updateProfile", async () => {
    const { supabase, member, isBoard } = await access("member");
    const targetValue = text(formData, "target_member_id", "Le membre", 128);
    const targetId = targetValue ? identifier(targetValue, "Identifiant du membre") : member.id;
    if (targetId !== member.id && !isBoard) throw new ActionError("Vous pouvez uniquement modifier votre propre profil.");
    const rankValue = text(formData, "rank", "L’ordre d’affichage", 12);
    if (rankValue && !isBoard) throw new ActionError("Seul le bureau restreint peut modifier l’ordre d’affichage des membres.");
    const payload: Record<string, string | number | boolean | null> = {
      first_name: text(formData, "first_name", "Le prénom", 100, true),
      last_name: text(formData, "last_name", "Le nom", 100, true),
      hide_last_name: hideLastName(formData),
      bio: text(formData, "bio", "La présentation", 10000),
      study_level: text(formData, "study_level", "Le niveau d’étude", 100),
      responsibilities: text(formData, "responsibilities", "Les responsabilités", 10000),
      academic_journey: text(formData, "academic_journey", "Le parcours", 10000),
      discord: text(formData, "discord", "Le pseudo Discord", 200),
      instagram: text(formData, "instagram", "Le compte Instagram", 200),
      updated_at: new Date().toISOString(),
    };
    if (rankValue) payload.rank = integer(formData, "rank", "L’ordre d’affichage");
    const { data: target, error: targetError } = await supabase.from("members").select("id, photo_url, hide_last_name").eq("id", targetId).maybeSingle();
    // Verify the privacy column before uploading a replacement portrait.
    profilePrivacyDatabaseError(targetError);
    if (!target) throw new ActionError("Le profil à modifier n’est plus disponible.");
    payload.photo_url = await image(supabase, formData, "photo", "member-profiles", target.photo_url);
    const { error } = await supabase.from("members").update(payload).eq("id", targetId).select("id").single();
    profilePrivacyDatabaseError(error);
    refresh(["/equipe", "/equipe/" + targetId, "/poles", "/", "/sitemap.xml"]);
    revalidatePath("/poles/[id]", "page");
    revalidatePath("/news/[id]", "page");
  });
}

function eventFields(formData: FormData) {
  return {
    title: text(formData, "title", "Le titre", 200, true),
    description: text(formData, "description", "La description", 10000, true),
    full_content: text(formData, "full_content", "Le contenu détaillé", 100000),
    date_start: dateStart(formData),
    location: text(formData, "location", "Le lieu", 500, true),
    precise_location: text(formData, "precise_location", "L’adresse précise", 1000),
    max_capacity: integer(formData, "max_capacity", "La capacité"),
  };
}

export async function addEvent(formData: FormData): Promise<ActionResult> {
  return perform("addEvent", async () => {
    const { supabase } = await access("board");
    const fields = eventFields(formData);
    const imageUrl = await image(supabase, formData, "image", "event-images");
    const { error } = await supabase.from("events").insert({ ...fields, image_url: imageUrl, status: "upcoming" }).select("id").single();
    databaseError(error);
    refresh(["/evenement", "/"]);
  });
}

export async function updateEvent(formData: FormData): Promise<ActionResult> {
  return perform("updateEvent", async () => {
    const { supabase } = await access("board");
    const id = identifier(formData.get("id"));
    const fields = eventFields(formData);
    const current = await existing(supabase, "events", id);
    const imageUrl = await image(supabase, formData, "image", "event-images", current.image_url);
    const { error } = await supabase.from("events").update({ ...fields, image_url: imageUrl, updated_at: new Date().toISOString() }).eq("id", id).select("id").single();
    databaseError(error);
    refresh(["/evenement", "/evenement/" + id, "/"]);
  });
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  return perform("deleteEvent", async () => {
    const { supabase } = await access("board");
    identifier(id);
    const { error } = await supabase.from("events").delete().eq("id", id).select("id").single();
    databaseError(error);
    refresh(["/evenement", "/evenement/" + id, "/"]);
  });
}

function productFields(formData: FormData, existingSizes: string[] = []) {
  const category = text(formData, "category", "La catégorie", 40, true);
  if (!productCategories.includes(category)) throw new ActionError("La catégorie de cet article est invalide.");
  const sizes = formData.getAll("sizes");
  const allowedSizes = new Set(["XS", "S", "M", "L", "XL", "XXL", "XXXL", ...existingSizes]);
  if (sizes.some(size => typeof size !== "string" || !allowedSizes.has(size))) throw new ActionError("Une taille sélectionnée est invalide.");
  return {
    category,
    sizes: [...new Set(sizes as string[])],
    name: text(formData, "name", "Le nom de l’article", 200, true),
    description: text(formData, "description", "La description", 10000, true),
    full_content: text(formData, "full_content", "Le contenu détaillé", 100000),
    price: priceInCents(formData),
    stock: integer(formData, "stock", "Le stock", 0),
  };
}

export async function addProduct(formData: FormData): Promise<ActionResult> {
  return perform("addProduct", async () => {
    const { supabase } = await access("board");
    const { category, sizes, ...fields } = productFields(formData);
    const isBranding = brandingCategories.includes(category);
    const imageUrl = await image(supabase, formData, "image", "shop-images");
    const payload = { ...fields, image_url: imageUrl, ...(isBranding ? { branding_category: category, sizes: sizes.length > 0 ? sizes : null } : { category }) };
    const { error } = await supabase.from(isBranding ? "products" : "taverne_items").insert(payload).select("id").single();
    databaseError(error);
    refresh(["/boutique"]);
  });
}

export async function updateProduct(formData: FormData): Promise<ActionResult> {
  return perform("updateProduct", async () => {
    const { supabase } = await access("board");
    const id = identifier(formData.get("id"));
    const selectedCategory = text(formData, "category", "La catégorie", 40, true);
    if (!productCategories.includes(selectedCategory)) throw new ActionError("La catégorie de cet article est invalide.");
    const isBranding = brandingCategories.includes(selectedCategory);
    const table = isBranding ? "products" : "taverne_items";
    const current = await existing(supabase, table, id, isBranding);
    const existingSizes = "sizes" in current && Array.isArray(current.sizes) ? current.sizes.filter((size): size is string => typeof size === "string") : [];
    const { category, sizes, ...fields } = productFields(formData, existingSizes);
    const imageUrl = await image(supabase, formData, "image", "shop-images", current.image_url);
    const payload = { ...fields, image_url: imageUrl, ...(isBranding ? { branding_category: category, sizes: sizes.length > 0 ? sizes : null } : { category }) };
    const { error } = await supabase.from(table).update(payload).eq("id", id).select("id").single();
    databaseError(error);
    refresh(["/boutique", "/boutique/" + id]);
  });
}

export async function deleteProduct(id: string, isBranding: boolean): Promise<ActionResult> {
  return perform("deleteProduct", async () => {
    const { supabase } = await access("board");
    identifier(id);
    if (typeof isBranding !== "boolean") throw new ActionError("Le type d’article est invalide.");
    const { error } = await supabase.from(isBranding ? "products" : "taverne_items").delete().eq("id", id).select("id").single();
    databaseError(error);
    refresh(["/boutique", "/boutique/" + id]);
  });
}

function newsDatabaseError(error: { message: string; code?: string; details?: string } | null) {
  if (error) {
    const details = error.message + " " + (error.details ?? "");
    if (/\bis_anonymous\b/i.test(details) && (["PGRST204", "42703"].includes(error.code ?? "") || /schema cache|column|does not exist/i.test(details))) {
      throw new ActionError("Le schéma Supabase des actualités doit être mis à jour : la colonne « is_anonymous » est absente ou son cache est périmé. Appliquez la migration 202610090001_news_anonymity.sql dans Supabase, puis réessayez. Votre saisie reste dans ce formulaire.");
    }
  }
  databaseError(error);
}

async function selectedNewsAuthor(supabase: Supabase, formData: FormData, member: MemberAccess, existingAuthorId?: string | null) {
  const chosenId = text(formData, "author_id", "L’auteur", 128);
  const hasAuthorField = formData.get("author_id") !== null;
  const defaultId = existingAuthorId !== undefined
    ? existingAuthorId
    : newsAuthorCategories.includes(member.category ?? "") ? String(member.id) : null;
  const candidateId = chosenId || (!hasAuthorField ? defaultId : null);
  if (!candidateId) throw new ActionError("Choisissez un auteur parmi les membres du bureau restreint ou du bureau élargi.");
  const authorId = identifier(candidateId, "Identifiant de l’auteur");
  const { data: author, error } = await supabase.from("members").select("id, category").eq("id", authorId).maybeSingle();
  databaseError(error);
  if (!author) throw new ActionError("Cet auteur n’est plus disponible. Choisissez un membre du bureau.");
  // Preserve an existing historical attribution without allowing a new out-of-board author.
  if (!newsAuthorCategories.includes(author.category ?? "") && authorId !== existingAuthorId) {
    throw new ActionError("L’auteur choisi doit appartenir au bureau restreint ou au bureau élargi.");
  }
  return authorId;
}

function newsFields(formData: FormData, publishedByDefault: boolean) {
  return {
    title: text(formData, "title", "Le titre", 200, true),
    content: text(formData, "content", "Le contenu", 100000, true),
    is_published: boolean(formData, "is_published", publishedByDefault),
    is_anonymous: boolean(formData, "is_anonymous"),
  };
}

export async function addNews(formData: FormData): Promise<ActionResult> {
  return perform("addNews", async () => {
    const { supabase, member } = await access("news");
    const fields = newsFields(formData, true);
    // Check schema availability before uploading a new cover image.
    const { error: schemaError } = await supabase.from("news").select("is_anonymous").limit(0);
    newsDatabaseError(schemaError);
    const authorId = await selectedNewsAuthor(supabase, formData, member);
    const imageUrl = await image(supabase, formData, "image", "news-images");
    const { error } = await supabase.from("news").insert({ ...fields, author_id: authorId, image_url: imageUrl }).select("id").single();
    newsDatabaseError(error);
    refresh(["/"]);
  });
}

export async function updateNews(formData: FormData): Promise<ActionResult> {
  return perform("updateNews", async () => {
    const { supabase, member } = await access("news");
    const id = identifier(formData.get("id"));
    const fields = newsFields(formData, false);
    const { data: current, error: currentError } = await supabase.from("news").select("id, image_url, author_id, is_anonymous").eq("id", id).maybeSingle();
    newsDatabaseError(currentError);
    if (!current) throw new ActionError("Cette actualité n’est plus disponible ou vous n’avez pas accès à sa modification. Rechargez la page.");
    const currentAuthorId = current.author_id == null ? null : String(current.author_id);
    const authorId = await selectedNewsAuthor(supabase, formData, member, currentAuthorId);
    const imageUrl = await image(supabase, formData, "image", "news-images", current.image_url);
    const { error } = await supabase.from("news").update({ ...fields, author_id: authorId, image_url: imageUrl, updated_at: new Date().toISOString() }).eq("id", id).select("id").single();
    newsDatabaseError(error);
    refresh(["/", "/news/" + id]);
  });
}

export async function deleteNews(id: string): Promise<ActionResult> {
  return perform("deleteNews", async () => {
    const { supabase } = await access("news");
    identifier(id);
    const { error } = await supabase.from("news").delete().eq("id", id).select("id").single();
    databaseError(error);
    refresh(["/"]);
  });
}

function poleFields(formData: FormData) {
  let color = text(formData, "color", "La couleur", 9) || "#7BD0FF";
  if (/^#[\da-f]{3}$/i.test(color)) color = "#" + color.slice(1).split("").map(char => char + char).join("");
  if (!/^#(?:[\da-f]{6}|[\da-f]{8})$/i.test(color)) throw new ActionError("La couleur doit contenir six ou huit caractères hexadécimaux, par exemple #7BD0FF.");
  return {
    name: text(formData, "name", "Le nom du pôle", 120, true),
    description: text(formData, "description", "La description", 500, true),
    full_content: text(formData, "full_content", "Le contenu détaillé", 100000),
    color: color.toUpperCase(),
    order_index: integer(formData, "order_index", "L’ordre d’affichage", 0),
  };
}

function poleId(value: unknown) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new ActionError("L’identifiant du pôle est invalide. Rechargez la page puis réessayez.");
  }
  return value;
}

function poleDatabaseError(error: { message: string; code?: string; details?: string } | null) {
  if (!error) return;
  const details = error.message + " " + (error.details ?? "");
  if (["PGRST202", "42883", "42703", "42P01"].includes(error.code ?? "") || (/schema cache|does not exist/i.test(details) && /bde_admin_|full_name|full_content|image_url|order_index|updated_at/i.test(details))) {
    throw new ActionError("La gestion des pôles nécessite une mise à jour de Supabase. Appliquez la migration 202610090003_pole_management.sql, puis réessayez. Votre saisie reste dans ce formulaire.");
  }
  if (error.code === "42501") throw new ActionError("La gestion des pôles est réservée au bureau restreint.");
  if (error.code === "23505") throw new ActionError("Un pôle porte déjà ce nom. Choisissez un nom différent.");
  if (error.code === "23503") throw new ActionError("Ce pôle est encore lié à des membres ou à des affectations. Réaffectez-les dans « Membres & rôles » avant de le supprimer.");
  if (error.code === "P0002") throw new ActionError("Ce pôle n’est plus disponible. Rechargez la liste des pôles.");
  databaseError(error);
}

async function poleCapabilities(supabase: Supabase) {
  // The migration installs this read-only check and the three writes atomically.
  const { data, error } = await supabase.rpc("bde_admin_can_manage_poles");
  poleDatabaseError(error);
  if (data !== true) throw new ActionError("La gestion des pôles est réservée au bureau restreint.");
}

async function cleanupPoleCover(supabase: Supabase, upload: UploadedImage | null, error: { code?: string }) {
  // Only an explicit database rejection proves the RPC did not commit.
  // A lost response can hide a successful save: preserve its cover for review.
  const rejectedCodes = ["23505", "23503", "23502", "23514", "42501", "P0002", "P0001", "22023", "42703", "42883", "42P01", "40001", "40P01", "PGRST202", "PGRST204"];
  if (!upload || !rejectedCodes.includes(error.code ?? "")) return;
  try {
    // The receipt comes from this action's upload, never from a form URL.
    const age = Date.now() - upload.uploadedAt;
    if (upload.bucket !== "event-images" || age < 0 || age > 30 * 60 * 1000
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|gif|avif)$/i.test(upload.path)
      || upload.publicUrl !== supabase.storage.from("event-images").getPublicUrl(upload.path).data.publicUrl) return;
    const { error: cleanupError } = await supabase.storage.from("event-images").remove([upload.path]);
    if (cleanupError) console.warn("La nouvelle couverture du pôle n’a pas pu être nettoyée :", cleanupError.message);
  } catch (cleanupError: unknown) {
    // Cleanup is best effort and never replaces the original save error.
    console.warn("La nouvelle couverture du pôle n’a pas pu être nettoyée :", cleanupError);
  }
}

function refreshPoles(id: string) {
  refresh(["/poles", "/poles/" + id, "/equipe", "/sitemap.xml", "/"]);
  revalidatePath("/equipe/[id]", "page");
}

export async function addPole(formData: FormData): Promise<ActionResult> {
  return perform("addPole", async () => {
    const { supabase } = await access("board");
    const fields = poleFields(formData);
    await poleCapabilities(supabase);
    const upload: { current: UploadedImage | null } = { current: null };
    const imageUrl = await image(supabase, formData, "image", "event-images", null, receipt => { upload.current = receipt; });
    const { data: id, error } = await supabase.rpc("bde_admin_create_pole", {
      p_name: fields.name, p_description: fields.description, p_full_content: fields.full_content,
      p_color: fields.color, p_image_url: imageUrl, p_order_index: fields.order_index,
    });
    if (error) await cleanupPoleCover(supabase, upload.current, error);
    poleDatabaseError(error);
    if (!id || typeof id !== "string") throw new ActionError("La création du pôle n’a pas pu être confirmée. Rechargez la liste avant de réessayer.");
    refreshPoles(id);
  });
}

export async function updatePole(formData: FormData): Promise<ActionResult> {
  return perform("updatePole", async () => {
    const { supabase } = await access("board");
    const id = poleId(formData.get("id"));
    const fields = poleFields(formData);
    await poleCapabilities(supabase);
    const { data: current, error: currentError } = await supabase.from("poles").select("id, image_url").eq("id", id).maybeSingle();
    poleDatabaseError(currentError);
    if (!current) throw new ActionError("Ce pôle n’est plus disponible. Rechargez la liste des pôles.");
    const upload: { current: UploadedImage | null } = { current: null };
    const imageUrl = await image(supabase, formData, "image", "event-images", current.image_url, receipt => { upload.current = receipt; });
    const { data: updatedId, error } = await supabase.rpc("bde_admin_update_pole", {
      p_id: id, p_name: fields.name, p_description: fields.description, p_full_content: fields.full_content,
      p_color: fields.color, p_image_url: imageUrl, p_order_index: fields.order_index,
    });
    if (error) await cleanupPoleCover(supabase, upload.current, error);
    poleDatabaseError(error);
    if (typeof updatedId !== "string" || updatedId.toLowerCase() !== id.toLowerCase()) throw new ActionError("La modification du pôle n’a pas pu être confirmée. Rechargez la liste avant de réessayer.");
    refreshPoles(id);
  });
}

export async function deletePole(id: string): Promise<ActionResult> {
  return perform("deletePole", async () => {
    const { supabase } = await access("board");
    poleId(id);
    await poleCapabilities(supabase);
    const { data: deletedId, error } = await supabase.rpc("bde_admin_delete_pole", { p_id: id });
    poleDatabaseError(error);
    if (typeof deletedId !== "string" || deletedId.toLowerCase() !== id.toLowerCase()) throw new ActionError("La suppression du pôle n’a pas pu être confirmée. Rechargez la liste avant de réessayer.");
    refreshPoles(id);
  });
}

export async function addAssignment(formData: FormData): Promise<ActionResult> {
  return perform("addAssignment", async () => {
    const { supabase } = await access("board");
    const memberId = identifier(formData.get("member_id"), "Identifiant du membre");
    const poleId = identifier(formData.get("pole_id"), "Identifiant du pôle");
    const role = text(formData, "role", "L’intitulé de la mission", 200, true);
    const isVp = boolean(formData, "is_vp");
    const [{ data: member, error: memberError }, { data: pole, error: poleError }] = await Promise.all([
      supabase.from("members").select("id").eq("id", memberId).maybeSingle(),
      supabase.from("poles").select("id").eq("id", poleId).maybeSingle(),
    ]);
    databaseError(memberError);
    databaseError(poleError);
    if (!member || !pole) throw new ActionError("Ce membre ou ce pôle n’est plus disponible. Rechargez la page.");
    const { data: duplicate, error: duplicateError } = await supabase.from("member_assignments").select("id").eq("member_id", memberId).eq("pole_id", poleId).limit(1).maybeSingle();
    databaseError(duplicateError);
    if (duplicate) throw new ActionError("Ce membre possède déjà une affectation dans ce pôle. Retirez l’affectation existante avant de la remplacer.");
    const { error } = await supabase.from("member_assignments").insert({ member_id: memberId, pole_id: poleId, role, is_vp: isVp }).select("id").single();
    databaseError(error);
    refresh(["/equipe", "/equipe/" + memberId, "/poles", "/"]);
    revalidatePath("/poles/[id]", "page");
  });
}

export async function deleteAssignment(id: string): Promise<ActionResult> {
  return perform("deleteAssignment", async () => {
    const { supabase } = await access("board");
    identifier(id);
    const { data, error } = await supabase.from("member_assignments").delete().eq("id", id).select("member_id").single();
    databaseError(error);
    refresh(["/equipe", "/poles", "/"]);
    if (data?.member_id) revalidatePath("/equipe/" + data.member_id);
    revalidatePath("/poles/[id]", "page");
  });
}
