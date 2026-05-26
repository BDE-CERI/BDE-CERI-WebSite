import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";
import TaverneInteractivity from "./TaverneInteractivity";
import SharkWallpaper from "@/components/SharkWallpaper";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
}

export default async function Boutique() {
  const dict = await getDictionary();
  const supabase = await createClient();

  // Fetch taverne items
  const { data: taverneData } = await supabase
    .from("taverne_items")
    .select("*")
    .order("order_index", { ascending: true });

  // Fetch branding products
  const { data: brandingData } = await supabase
    .from("products")
    .select("*")
    .order("order_index", { ascending: true });

  const defaultBranding = [
    { id: "b1", name: "Hoodie BDE CERI", price: 3500, branding_category: "vetement", description: "Brodé, coton bio. Coloris midnight navy.", image_url: null, is_available: true },
    { id: "b2", name: "T-Shirt BDE CERI", price: 1800, branding_category: "vetement", description: "Col rond sérigraphié. Disponible S→XL.", image_url: null, is_available: true },
  ];

  const taverneItems = taverneData || [];
  const brandingItems = brandingData && brandingData.length > 0 ? brandingData : defaultBranding;

  const drinks = taverneItems.filter(i => i.category === "boisson");
  const snacks = taverneItems.filter(i => i.category === "snack");

  return (
    <div className="bg-surface min-h-screen relative overflow-hidden">
      <SharkWallpaper />
      {/* Hero / Header */}
      <header className="pt-24 pb-16 px-6 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-tertiary/5 blur-[120px] pointer-events-none"></div>
        <div className="inline-block px-4 py-1 rounded-full border border-tertiary/20 bg-tertiary/5 text-tertiary text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          Official Merchandise & Store
        </div>
        <h1 className="text-5xl md:text-7xl font-headline font-bold text-on-surface mb-6 tracking-tight">
          La Boutique <span className="text-tertiary">CERI</span>
        </h1>
        <p className="text-on-surface-variant max-w-2xl mx-auto font-body text-lg leading-relaxed">
          Équipez-vous aux couleurs de votre département ou profitez d'une pause rafraîchissante au local.
        </p>

        {/* Disclaimer Onsite */}
        <div className="mt-12 flex items-center justify-center gap-4 py-3 px-6 glass-panel rounded-2xl border border-warning/20 bg-warning/5 max-w-max mx-auto animate-pulse">
           <span className="material-symbols-outlined text-warning">info</span>
           <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
             Paiement en CB sur place ou via HelloAsso (en ligne)
           </span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-6 pb-32 space-y-32">
        
        {/* Branding Collection */}
        <section id="branding">
           <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-headline font-bold text-on-surface">Collection Branding</h2>
                <p className="text-on-surface-variant text-sm mt-1">Pulls, goodies et accessoires exclusifs.</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-surface-container-high px-3 py-1 rounded text-[10px] font-bold uppercase">Vêtements</span>
                <span className="bg-surface-container-high px-3 py-1 rounded text-[10px] font-bold uppercase">Goodies</span>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {brandingItems.map((item) => (
               <Link key={item.id} href={`/boutique/${item.id}`} className="group relative">
                 <div className="reveal-card h-full bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 group-hover:border-tertiary/30 shadow-xl flex flex-col">
                    <div className="h-64 relative bg-surface-container-highest flex items-center justify-center">
                        <div className="absolute top-4 right-4 z-20">
                           <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg ${(item.stock === undefined || item.stock > 0) ? 'bg-success/80 text-white border border-white/20' : 'bg-error/80 text-white border border-white/20'}`}>
                              {(item.stock === undefined || item.stock > 0) ? `En stock${item.stock ? ' : ' + item.stock : ''}` : 'Épuisé'}
                           </span>
                        </div>
                       {item.image_url ? (
                         <Image src={item.image_url} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, 25vw" />
                       ) : (
                         <span className="material-symbols-outlined text-6xl text-outline opacity-20">checkroom</span>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        {(item.stock === 0 || !item.is_available) && (
                          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center z-10 transition-all group-hover:bg-surface/90">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface p-2 border border-outline-variant/30 rounded-xl bg-surface shadow-2xl">Victime de son succès</span>
                          </div>
                        )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                       <span className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-2">{item.branding_category || 'Essentiel'}</span>
                       <h3 className="text-xl font-headline font-bold text-on-surface mb-2 leading-tight">{item.name}</h3>
                       <p className="text-on-surface-variant text-xs font-body mb-6 line-clamp-2">{item.description}</p>
                       <div className="mt-auto pt-4 flex items-center justify-between border-t border-outline-variant/15">
                          <span className="text-2xl font-headline font-bold text-on-surface">{formatPrice(item.price)}</span>
                          <span className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-tertiary transition-colors">
                             <span className="material-symbols-outlined text-sm group-hover:text-on-tertiary">add_shopping_cart</span>
                          </span>
                       </div>
                    </div>
                 </div>
               </Link>
             ))}
           </div>
        </section>

        {/* Taverne Section */}
        <section id="taverne">
           <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-headline font-bold text-on-surface font-headline">La Taverne</h2>
                <p className="text-on-surface-variant text-sm mt-1">Ravitaillement indispensable pour vos sessions de code.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             {/* DRINKS */}
             <div className="lg:col-span-12">
               <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-tertiary mb-8 flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">local_bar</span>
                 Boissons & Rafraîchissements
               </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {drinks.map((item) => (
                     <TaverneInteractivity key={item.id} item={item} />
                  ))}
                </div>
             </div>

             {/* SNACKS */}
             <div className="lg:col-span-12 mt-12">
               <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-tertiary mb-8 flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">icecream</span>
                 Snacks & Gourmandises
               </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {snacks.map((item) => (
                     <TaverneInteractivity key={item.id} item={item} />
                  ))}
                </div>
             </div>
           </div>
        </section>
      </main>

      {/* Floating CTA */}
      <div className="fixed bottom-8 right-8 z-50">
          <Link href="/contact" className="bg-surface-container-highest border border-tertiary/30 text-tertiary px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:bg-tertiary hover:text-on-tertiary transition-all hover:scale-105 font-bold text-sm backdrop-blur-lg">
             <span className="material-symbols-outlined">help_outline</span>
             Besoin d'aide ?
          </Link>
      </div>
    </div>
  );
}
