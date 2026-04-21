"use server";

import { cookies } from "next/headers";

export async function setLanguage(lang: "fr" | "en") {
  const cookieStore = await cookies();
  cookieStore.set("bde_lang", lang, { maxAge: 60 * 60 * 24 * 365, path: "/" });
}
