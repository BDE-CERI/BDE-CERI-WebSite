import { getDictionary, getLang } from "@/locales/dictionaries";
import SharkWallpaper from "@/components/SharkWallpaper";
import { createSeoMetadata } from "@/utils/seo";
import { getLocalOfficeData, getLocalOfficeStatus } from "@/utils/local-office";
import { createClient } from "@/utils/supabase/server";
import { getShopMembershipAccess } from "@/utils/shop-membership";
import MembershipGate from "@/components/MembershipGate";

export const metadata = createSeoMetadata({
  path: "/boutique",
  title: "Boutique étudiante du BDE CERI",
  description: "Retrouve les produits et la boutique officielle du BDE CERI à Avignon. Commandes et paiements sécurisés via HelloAsso.",
});

const shopUrl =
  "https://www.helloasso.com/associations/bde-ceri-avignon/boutiques/la-taverne-du-ceri";
const shopWidgetUrl = shopUrl + "/widget";

export default async function Boutique() {
  const [dict, lang, localOffice, supabase] = await Promise.all([getDictionary(), getLang(), getLocalOfficeData(), createClient()]);
  const membership = await getShopMembershipAccess(supabase);
  if (!membership.membershipPaid) return <div className="relative min-h-screen overflow-hidden bg-surface"><SharkWallpaper /><MembershipGate english={lang === "en"} signedIn={membership.signedIn} memberProfileExists={membership.memberProfileExists} /></div>;
  const localStatus = getLocalOfficeStatus(localOffice, new Date(), lang === "en");

  return (
    <div className="bg-surface min-h-screen relative overflow-hidden">
      <SharkWallpaper />
      <header className="pt-24 pb-12 px-6 max-w-7xl mx-auto text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-tertiary/5 blur-[120px] pointer-events-none" />
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C67A40]/30 bg-[#C67A40]/10 px-4 py-2 text-[#C67A40] text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          <span aria-hidden="true" className="material-symbols-outlined text-base">local_cafe</span>{dict.boutique.badge}
        </div>
        <h1 className="text-5xl md:text-7xl font-headline font-bold text-on-surface mb-3 tracking-tight">
          {dict.boutique.shop_name}
        </h1>
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-tertiary">{dict.boutique.store_descriptor}</p>
        <p className="text-on-surface-variant max-w-2xl mx-auto font-body text-lg leading-relaxed">
          {dict.boutique.description}
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-32">
        <section aria-label="Boutique HelloAsso du BDE CERI" className="relative">
          <div className="rounded-3xl border border-tertiary/25 bg-gradient-to-br from-tertiary/15 via-surface-container-low to-primary/10 p-3 shadow-2xl shadow-tertiary/10 sm:p-5">
            <div className="flex flex-col items-center gap-3 px-2 pb-4 sm:px-3">
              <div className="flex items-center justify-center gap-3 text-center">
                <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded-full bg-tertiary/15 text-[1.55rem] leading-none text-tertiary" aria-hidden="true">storefront</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">{dict.boutique.shop_name}</p>
                  <p className="text-xs text-on-surface-variant">{dict.boutique.secure_checkout}</p>
                </div>
              </div>
              <span className="w-fit rounded-full border border-tertiary/20 bg-surface/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-tertiary">
                {dict.boutique.association}
              </span>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-inner">
              <iframe
                title="Boutique HelloAsso du BDE CERI — La Taverne du CERI"
                src={shopWidgetUrl}
                aria-hidden={!localStatus.isOpen}
                tabIndex={localStatus.isOpen ? 0 : -1}
                inert={!localStatus.isOpen}
                className="block w-full min-h-[900px] border-0 bg-white"
                height="900"
                loading="lazy"
                scrolling="auto"
                referrerPolicy="strict-origin-when-cross-origin"
              />
              {!localStatus.isOpen && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50/95 via-white/95 to-slate-100/95 px-6 py-12 text-center backdrop-blur-xl">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary"><span aria-hidden="true" className="material-symbols-outlined text-3xl">store</span></div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-tertiary">{lang === "en" ? "BDE CERI local" : "Local du BDE CERI"}</p>
                <h2 className="mt-2 font-headline text-xl font-bold text-slate-900">{lang === "en" ? "The Tavern is resting for now" : "La Taverne se repose pour le moment"}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{localStatus.message}</p>
                <p className="mt-4 max-w-xl text-xs leading-5 text-slate-500">{lang === "en" ? "Checkout is available during a keyholder shift. Opening hours may vary when no BDE member is present." : "La boutique ouvre pendant une permanence avec responsable des clés. Les horaires peuvent varier en l’absence d’un membre du BDE."}</p>
                <a href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full border border-tertiary/30 bg-white px-4 py-2 text-sm font-bold text-tertiary shadow-sm transition hover:bg-tertiary/5">{lang === "en" ? "See local hours" : "Voir les horaires du local"}<span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span></a>
              </div>}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <p className="text-sm text-on-surface-variant">{localStatus.isOpen ? dict.boutique.secure_checkout : localStatus.message}</p>
            {localStatus.isOpen && <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-tertiary/30 bg-tertiary/10 px-4 py-2 text-sm font-bold text-tertiary transition-colors hover:bg-tertiary/20"
            >
              {dict.boutique.open_helloasso}
              <span className="material-symbols-outlined text-base" aria-hidden="true">open_in_new</span>
            </a>}
          </div>
        </section>
      </main>
    </div>
  );
}
