"use client";

import React, { useState } from "react";

interface TaverneItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  stock?: number;
}

const formatPrice = (cents: number) => {
  return (cents / 100).toFixed(2).replace(".", ",") + "€";
};

export default function TaverneInteractivity({ item }: { item: TaverneItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center gap-4 hover:border-primary/40 transition-all group cursor-pointer hover:shadow-lg hover:shadow-primary/5 active:scale-95"
      >
        <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span className="material-symbols-outlined">
              {item.category === "boisson" ? "local_drink" : "fastfood"}
            </span>
          )}
        </div>
        <div className="flex-grow">
          <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{item.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-lg font-headline font-bold text-tertiary">{formatPrice(item.price)}</span>
            {item.stock !== undefined && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${item.stock > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {item.stock > 0 ? `En stock: ${item.stock}` : 'Épuisé'}
              </span>
            )}
          </div>
        </div>
        <span className="material-symbols-outlined text-outline opacity-0 group-hover:opacity-100 transition-opacity">
           add_circle
        </span>
      </div>

      {/* Detail Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-md" onClick={() => setIsOpen(false)}></div>
          <div className="relative glass-panel p-8 rounded-3xl border border-outline-variant/20 max-w-sm w-full animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="w-24 h-24 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary mx-auto mb-6 shadow-xl shadow-primary/10">
               <span className="material-symbols-outlined text-5xl">
                {item.category === "boisson" ? "local_drink" : "fastfood"}
               </span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-on-surface text-center mb-2">{item.name}</h3>
            {item.stock !== undefined && (
              <div className="flex justify-center mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.stock > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                  {item.stock > 0 ? `${item.stock} exemplaires restants` : 'Rupture de stock'}
                </span>
              </div>
            )}
            <p className="text-center text-on-surface-variant text-sm mb-8">
                Produit disponible directement au local du BDE CERI.
            </p>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
               <span className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Prix</span>
               <span className="text-3xl font-headline font-bold text-primary">{formatPrice(item.price)}</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full mt-8 py-4 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
