import type { Metadata } from "next";
import ExperienceFluiditySettings from "@/components/ExperienceFluiditySettings";
import { getDictionary } from "@/locales/dictionaries";
import { createSeoMetadata } from "@/utils/seo";

export const metadata: Metadata = createSeoMetadata({
  path: "/experience",
  title: "Expérience utilisateur",
  description: "Réglez les options de fluidité et le préchargement des images du site BDE CERI.",
});

export default async function ExperiencePage() {
  const dict = await getDictionary();
  const english = dict.profil.title === "My Account";

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface px-4 py-14 sm:px-8 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-24 size-96 rounded-full bg-tertiary/5 blur-3xl" />
      <main className="relative mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary">{english ? "Your browsing preferences" : "Vos préférences de navigation"}</p>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">{english ? "User experience" : "Expérience utilisateur"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-on-surface-variant">
            {english ? "Adjust how the site prepares its public images to make browsing more comfortable." : "Réglez la façon dont le site prépare ses images publiques pour rendre la navigation plus agréable."}
          </p>
        </div>
        <ExperienceFluiditySettings english={english} />
      </main>
    </div>
  );
}
