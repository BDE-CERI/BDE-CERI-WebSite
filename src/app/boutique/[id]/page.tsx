import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SizePicker from "./SizePicker";
import BuyButton from "../BuyButton";
import { createSeoMetadata } from "@/utils/seo";
import { getLocalOfficeData, getLocalOfficeStatus } from "@/utils/local-office";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  
  // Try products then taverne_items
  let { data: product } = await supabase.from("products").select("name, description, image_url").eq("id", id).single();
  if (!product) {
    const { data: taverneItem } = await supabase.from("taverne_items").select("name, description, image_url").eq("id", id).single();
    product = taverneItem;
  }
  
  if (!product) return { title: "Article introuvable", robots: { index: false, follow: false } };
  
  const title = `${product.name} | Boutique`;
  const desc = (product.description || "Retrouve cet article sur la boutique officielle du BDE CERI à Avignon.").replace(/\s+/g, " ").slice(0, 160);
  
  return createSeoMetadata({
    path: `/boutique/${id}`,
    title,
    description: desc,
    image: product.image_url,
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dict = await getDictionary();
  const [supabase, localOffice] = await Promise.all([createClient(), getLocalOfficeData()]);
  const english = dict.profil.title === "My Account";
  const localStatus = getLocalOfficeStatus(localOffice, new Date(), english);

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
        {dict.boutique.back_to_store}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Product Images */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-square bg-surface-container-high rounded-[2rem] overflow-hidden ghost-border relative group">
            {product.image_url ? (
              <Image 
                src={product.image_url} 
                alt={product.name} 
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
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
                <div key={i} className="aspect-square rounded-2xl overflow-hidden ghost-border cursor-pointer hover:opacity-80 transition-opacity relative">
                  <Image src={url} alt={`Gallery image ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 25vw, 15vw" />
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
                {dict.boutique.description_label}
              </h3>
              <p className="font-body text-lg text-on-surface/80 leading-relaxed italic border-l-4 border-tertiary/30 pl-6 py-2">
                {product.description}
              </p>
            </section>

            {product.full_content && (
              <section className="prose prose-invert max-w-none">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">{dict.common.product_details}</h3>
                <div className="whitespace-pre-wrap font-body leading-relaxed text-sm opacity-90">
                  {product.full_content}
                </div>
              </section>
            )}

            {isBranding && product.branding_category === "vetement" && product.sizes && (
              <SizePicker
                sizes={product.sizes}
                title={dict.boutique.size_title}
                selectedLabel={dict.boutique.size_selected}
              />
            )}

            <section className="bg-surface-container-low p-6 rounded-2xl ghost-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-success' : 'bg-error'}`}></span>
              <span className="text-xs font-bold uppercase tracking-widest">
                {product.stock > 0 ? dict.common.in_stock : dict.common.out_of_stock}
                  </span>
                </div>
                {product.stock > 0 && (
                  <span className="text-[10px] font-bold text-tertiary px-2 py-1 rounded-lg bg-tertiary/10 border border-tertiary/20">
                     {product.stock} {dict.boutique.remaining_stock}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-on-surface-variant leading-tight">
                {dict.boutique.pickup_note}
              </p>
            </section>
          </div>

          <BuyButton productId={product.id} stock={product.stock} isTaverne={!isBranding} isOpen={localStatus.isOpen} closedMessage={localStatus.message} english={english} />
        </div>
      </div>
    </div>
  );
}
