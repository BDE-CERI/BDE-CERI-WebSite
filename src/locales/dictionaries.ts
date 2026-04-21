import { cookies } from 'next/headers';
import { fr } from './fr';
import { en } from './en';

export async function getDictionary() {
  const cookieStore = await cookies();
  const lang = cookieStore.get('bde_lang')?.value || 'fr';
  return lang === 'en' ? en : fr;
}

export async function getLang() {
  const cookieStore = await cookies();
  return cookieStore.get('bde_lang')?.value || 'fr';
}
