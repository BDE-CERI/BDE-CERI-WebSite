import { getDictionary } from "@/locales/dictionaries";
import SharkWallpaper from "@/components/SharkWallpaper";
import { createSeoMetadata } from "@/utils/seo";

export const metadata = createSeoMetadata({
  path: "/boutique",
  title: "Boutique étudiante du BDE CERI",
  description: "Retrouve les produits et la boutique officielle du BDE CERI à Avignon. Commandes et paiements sécurisés via HelloAsso.",
});

const shopUrl =
  "https://www.helloasso.com/associations/bde-ceri-avignon/boutiques/la-taverne-du-ceri";
const shopWidgetUrl = shopUrl + "/widget";

export default async function Boutique() {
  const dict = await getDictionary();

  return (
    <div className="bg-surface min-h-screen relative overflow-hidden">
      <SharkWallpaper />
      <header className="pt-24 pb-12 px-6 max-w-7xl mx-auto text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-tertiary/5 blur-[120px] pointer-events-none" />
        <div className="inline-block px-4 py-1 rounded-full border border-tertiary/20 bg-tertiary/5 text-tertiary text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          {dict.boutique.badge}
        </div>
        <h1 className="text-5xl md:text-7xl font-headline font-bold text-on-surface mb-6 tracking-tight">
          {dict.boutique.title} <span className="text-tertiary">CERI</span>
        </h1>
        <p className="text-on-surface-variant max-w-2xl mx-auto font-body text-lg leading-relaxed">
          {dict.boutique.description}
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-32">
        <section aria-label="Boutique HelloAsso du BDE CERI" className="relative">
          <div className="rounded-3xl border border-tertiary/25 bg-gradient-to-br from-tertiary/15 via-surface-container-low to-primary/10 p-3 shadow-2xl shadow-tertiary/10 sm:p-5">
            <div className="flex flex-col items-center gap-3 px-2 pb-4 sm:px-3">
              <div className="flex items-center justify-center gap-3 text-center">
                <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded-full bg-tertiary/15 text-tertiary" aria-hidden="true">
                  <span className="relative top-2 inline-block leading-none">storefront</span>
                </span>
                <div>
                  <p className="text-sm font-bold text-on-surface">{dict.boutique.shop_name}</p>
                  <p className="text-xs text-on-surface-variant">{dict.boutique.secure_checkout}</p>
                </div>
              </div>
              <span className="w-fit rounded-full border border-tertiary/20 bg-surface/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-tertiary">
                {dict.boutique.association}
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-inner">
              <iframe
                title="Boutique HelloAsso du BDE CERI — La Taverne du CERI"
                src={shopWidgetUrl}
                className="block w-full min-h-[900px] border-0 bg-white"
                height="900"
                loading="lazy"
                scrolling="auto"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <p className="text-sm text-on-surface-variant">
              {dict.boutique.secure_checkout}
            </p>
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-tertiary/30 bg-tertiary/10 px-4 py-2 text-sm font-bold text-tertiary transition-colors hover:bg-tertiary/20"
            >
              {dict.boutique.open_helloasso}
              <span className="material-symbols-outlined text-base" aria-hidden="true">open_in_new</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
