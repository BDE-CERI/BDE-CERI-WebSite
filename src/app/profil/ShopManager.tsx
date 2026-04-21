"use client";

import { useState } from "react";
import { updateProduct, deleteProduct } from "./actions";
import ImageUpload from "@/components/ImageUpload";

interface ProductItem {
  id: string;
  name: string;
  description: string;
  full_content?: string;
  price: number;
  category?: string;
  branding_category?: string;
  image_url?: string;
  is_available: boolean;
  stock?: number;
  sizes?: string[];
}

export default function ShopManager({ 
  dict, 
  taverneItems, 
  brandingItems 
}: { 
  dict: any, 
  taverneItems: ProductItem[], 
  brandingItems: ProductItem[] 
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, isBranding: boolean) => {
    if (!window.confirm("Es-tu sûr de vouloir supprimer cet article ?")) return;
    setIsDeleting(id);
    const res = await deleteProduct(id, isBranding);
    if ("error" in res) {
      alert(res.error);
    } else {
      window.location.reload();
    }
    setIsDeleting(null);
  };

  const handleUpdate = async (formData: FormData) => {
    const res = await updateProduct(formData);
    if ("error" in res) {
      alert(res.error);
    } else {
      setEditingId(null);
      window.location.reload();
    }
  };

  const formatPrice = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

  const RenderProductList = (items: ProductItem[], isBranding: boolean) => (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <span className="material-symbols-outlined text-sm">shopping_bag</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">{item.name}</h4>
                <div className="flex items-center gap-2">
                   <p className="text-[10px] text-tertiary font-bold uppercase tracking-wider">{formatPrice(item.price)}€</p>
                   <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${item.stock && item.stock > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {item.stock && item.stock > 0 ? `Stock: ${item.stock}` : 'Épuisé'}
                   </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditingId(editingId === item.id ? null : item.id)} className="p-1.5 rounded-lg hover:bg-tertiary/10 text-tertiary transition-colors">
                <span className="material-symbols-outlined text-lg">{editingId === item.id ? "close" : "edit"}</span>
              </button>
              <button 
                onClick={() => handleDelete(item.id, isBranding)} 
                disabled={isDeleting === item.id}
                className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">{isDeleting === item.id ? "sync" : "delete"}</span>
              </button>
            </div>
          </div>

          {editingId === item.id && (
            <form action={handleUpdate} className="p-4 pt-0 border-t border-outline-variant/10 space-y-3 animate-in slide-in-from-top-2 duration-300">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="current_image_url" value={item.image_url || ""} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <input name="name" defaultValue={item.name} placeholder="Nom" required className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-tertiary" />
                  <textarea name="description" defaultValue={item.description} placeholder="Résumé" rows={2} required className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-tertiary resize-none" />
                  <textarea name="full_content" defaultValue={item.full_content} placeholder="Description détaillée (Page dédiée)" rows={4} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-tertiary" />
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input name="price" defaultValue={formatPrice(item.price)} placeholder="Prix (ex: 2,50)" required className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-tertiary" />
                    <select name="category" defaultValue={item.branding_category || item.category} required className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-tertiary">
                      <optgroup label="Taverne">
                        <option value="boisson">Boisson</option>
                        <option value="snack">Snack</option>
                      </optgroup>
                      <optgroup label="Branding">
                        <option value="vetement">Vêtement</option>
                        <option value="accessoire">Accessoire</option>
                        <option value="goodies">Goodies</option>
                      </optgroup>
                    </select>
                    <input name="stock" type="number" defaultValue={item.stock || 0} placeholder="Stock" className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-tertiary" />
                  </div>
                  {isBranding && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["XS", "S", "M", "L", "XL"].map(size => (
                        <label key={size} className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="sizes" 
                            value={size} 
                            defaultChecked={item.sizes?.includes(size)}
                            className="w-3 h-3 rounded border-outline-variant/30 text-tertiary focus:ring-tertiary" 
                          />
                          <span className="text-[10px] font-bold text-on-surface-variant">{size}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">Image</label>
                    <ImageUpload name="image" defaultValue={item.image_url} />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg text-xs font-bold border border-outline-variant/30 hover:bg-surface-container-high">Annuler</button>
                    <button type="submit" className="px-4 py-1.5 rounded-lg bg-tertiary text-on-tertiary text-xs font-bold shadow-lg shadow-tertiary/20">Sauvegarder</button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section className="glass-panel p-8 rounded-2xl ghost-border">
      <h2 className="font-headline text-2xl font-bold mb-8 flex items-center gap-3">
        <span className="material-symbols-outlined text-tertiary">storefront</span>
        Gérer la Boutique
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2 border-b border-outline-variant/20 pb-2">
            <span className="material-symbols-outlined text-primary text-sm">local_cafe</span>
            Taverne Nocturne
          </h3>
          {RenderProductList(taverneItems, false)}
        </div>
        <div>
          <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2 border-b border-outline-variant/20 pb-2">
            <span className="material-symbols-outlined text-primary text-sm">style</span>
            Branding BDE
          </h3>
          {RenderProductList(brandingItems, true)}
        </div>
      </div>
    </section>
  );
}
