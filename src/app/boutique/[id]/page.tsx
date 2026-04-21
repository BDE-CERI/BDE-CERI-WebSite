import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import SizePicker from "./SizePicker";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const dict = await getDictionary();
  const supabase = await createClient();

  // Try to find in branding products first
  let { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  
  let isBranding = true;

  // If not found, try in taverne_items
  if (!product) {
    const { data: taverneItem } = await supabase
      .from("taverne_items")
      .select("*")
      .eq("id", id)
      .single();
    
    if (taverneItem) {
      product = taverneItem;
      isBranding = false;
    }
  }

  if (!product) notFound();

  const formatPrice = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

  return (
    <div className="flex-grow pt-24 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      <Link href="/boutique" className="text-tertiary flex items-center gap-2 mb-12 hover:gap-3 transition-all font-bold text-sm uppercase tracking-widest">
        <span className="material-symbols-outlined">arrow_back</span>
        Retour à la boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Product Images */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-square bg-surface-container-high rounded-[2rem] overflow-hidden ghost-border relative group">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                <span className="material-symbols-outlined text-9xl">shopping_bag</span>
                <p className="font-headline font-bold text-2xl uppercase tracking-[0.2em]">BDE CERI</p>
              </div>
            )}
            <div className="absolute top-6 left-6">
              <span className="bg-surface/80 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30">
                {isBranding ? product.branding_category : product.category}
              </span>
            </div>
          </div>

          {/* Secondary images / Gallery if exists */}
          {product.gallery_urls && product.gallery_urls.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {product.gallery_urls.map((url: string, i: number) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden ghost-border cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="mb-10">
            <h1 className="headline-display text-4xl md:text-5xl font-bold mb-4 tracking-tighter">
              {product.name}
            </h1>
            <p className="text-3xl font-headline font-bold text-tertiary">
              {formatPrice(product.price)}€
            </p>
          </div>

          <div className="space-y-8 flex-grow">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">info</span>
                Description
              </h3>
              <p className="font-body text-lg text-on-surface/80 leading-relaxed italic border-l-4 border-tertiary/30 pl-6 py-2">
                {product.description}
              </p>
            </section>

            {product.full_content && (
              <section className="prose prose-invert max-w-none">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Détails de l&apos;article</h3>
                <div className="whitespace-pre-wrap font-body leading-relaxed text-sm opacity-90">
                  {product.full_content}
                </div>
              </section>
            )}

            {isBranding && product.branding_category === "vetement" && product.sizes && (
              <SizePicker sizes={product.sizes} />
            )}

            <section className="bg-surface-container-low p-6 rounded-2xl ghost-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-success' : 'bg-error'}`}></span>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {product.stock > 0 ? 'Article disponible' : 'Rupture de stock'}
                  </span>
                </div>
                {product.stock > 0 && (
                  <span className="text-[10px] font-bold text-tertiary px-2 py-1 rounded-lg bg-tertiary/10 border border-tertiary/20">
                     {product.stock} exemplaires restants
                  </span>
                )}
              </div>
              <p className="text-[10px] text-on-surface-variant leading-tight">
                Le retrait des articles s&apos;effectue au local BDE (Bâtiment ADA, CERI). 
                Vérifiez les horaires d&apos;ouverture dans le footer.
              </p>
            </section>
          </div>

          <div className="mt-12">
            <button 
              disabled={product.stock === 0}
              className="w-full bg-tertiary text-on-tertiary font-bold py-5 rounded-3xl shadow-xl shadow-tertiary/20 flex items-center justify-center gap-2 hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:grayscale"
            >
              Commander sur HelloAsso
              <span className="material-symbols-outlined">open_in_new</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
