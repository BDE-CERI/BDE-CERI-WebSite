"use client";

import { useState } from "react";
import { updatePole } from "./actions";
import ImageUpload from "@/components/ImageUpload";

export default function PoleManager({ poles, dict }: { poles: any[], dict: any }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="glass-panel p-8 rounded-2xl ghost-border space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">account_tree</span>
        <h2 className="font-headline text-xl font-bold">Gestion des Pôles</h2>
      </div>

      <div className="space-y-4">
        {poles.map((pole) => (
          <div key={pole.id} className="p-4 rounded-xl bg-surface-container-high/40 border border-outline-variant/10">
            {editingId === pole.id ? (
              <form action={async (formData) => {
                await updatePole(formData);
                setEditingId(null);
              }} className="space-y-4">
                <input type="hidden" name="id" value={pole.id} />
                <input type="hidden" name="current_image_url" value={pole.image_url || ""} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-on-surface-variant">Nom du pôle</label>
                    <input name="name" defaultValue={pole.name} className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-on-surface-variant">Couleur (Hex)</label>
                    <input name="color" defaultValue={pole.color} className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-bold uppercase text-on-surface-variant">Description courte (Accroche)</label>
                   <input name="description" defaultValue={pole.description} className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant">Contenu détaillé (Page dédiée)</label>
                  <textarea 
                    name="full_content" 
                    defaultValue={pole.full_content || ""} 
                    rows={6}
                    className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="pt-2">
                   <label className="text-[10px] font-bold uppercase text-on-surface-variant mb-2 block">Image de couverture</label>
                   <ImageUpload name="image" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-on-surface-variant">Annuler</button>
                  <button type="submit" className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold">Enregistrer les modifications</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div 
                     className="w-10 h-10 rounded-lg flex items-center justify-center text-on-primary font-bold shadow-lg" 
                     style={{ backgroundColor: pole.color || '#7BD0FF' }}
                   >
                     {pole.name[0]}
                   </div>
                   <div>
                      <h4 className="font-bold text-sm">Pôle {pole.name}</h4>
                      <p className="text-[10px] text-on-surface-variant line-clamp-1 italic">"{pole.description}"</p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(pole.id)} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
