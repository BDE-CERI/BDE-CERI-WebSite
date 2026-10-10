import { readdir } from "node:fs/promises";
import path from "node:path";
const placeholder = "/boutique-publicite-placeholder.svg";
export async function getShopAdvertisingImages(): Promise<string[]> {
  try {
    const files = await readdir(path.join(process.cwd(), "public", "publicite"));
    const images = files.filter(name => /\.(?:avif|gif|jpe?g|png|webp|svg)$/i.test(name)).sort((a, b) => a.localeCompare(b, "fr"));
    return images.length ? images.map(name => "/publicite/" + encodeURIComponent(name)) : [placeholder];
  } catch { return [placeholder]; }
}
