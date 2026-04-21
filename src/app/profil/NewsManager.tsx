"use client";

import { useState, useEffect } from "react";
import { updateNews, deleteNews } from "./actions";
import ImageUpload from "@/components/ImageUpload";
import { useSearchParams } from "next/navigation";

export default function NewsManager({ news, dict }: { news: any[], dict: any }) {
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const editId = searchParams.get("edit_id");
    if (editId) {
      setEditingId(editId);
    }
  }, [searchParams]);

  return (
    <div className="glass-panel p-8 rounded-2xl ghost-border space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">news</span>
        <h2 className="font-headline text-xl font-bold">Gestion des News</h2>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="p-4 rounded-xl bg-surface-container-high/40 border border-outline-variant/10">
            {editingId === item.id ? (
              <form action={async (formData) => {
                await updateNews(formData);
                setEditingId(null);
              }} className="space-y-4">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="current_image_url" value={item.image_url || ""} />
                
                <input 
                  name="title" 
                  defaultValue={item.title} 
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <textarea 
                  name="content" 
                  defaultValue={item.content} 
                  rows={4}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                />
                
                <div className="flex items-center gap-4">
                   <div className="flex-grow">
                      <ImageUpload name="image" />
                   </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                          <input type="checkbox" name="is_published" value="true" defaultChecked={item.is_published} id={`pub-${item.id}`} className="h-4 w-4 rounded border-outline-variant text-primary" />
                          <label htmlFor={`pub-${item.id}`} className="text-xs font-bold">Publié</label>
                       </div>
                       <div className="flex items-center gap-2">
                          <input type="checkbox" name="is_anonymous" value="true" defaultChecked={item.is_anonymous} id={`anon-${item.id}`} className="h-4 w-4 rounded border-outline-variant text-primary" />
                          <label htmlFor={`anon-${item.id}`} className="text-xs font-bold">{dict.news.post_anonymously}</label>
                       </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-on-surface-variant">Annuler</button>
                  <button type="submit" className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold">Enregistrer</button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   {item.image_url && (
                     <img src={item.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                   )}
                   <div>
                      <h4 className="font-bold text-sm">{item.title}</h4>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                        {new Date(item.published_at).toLocaleDateString()} — {item.is_published ? "Publié" : "Brouillon"}
                      </p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(item.id)} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => deleteNews(item.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {news.length === 0 && (
          <p className="text-xs text-on-surface-variant italic text-center py-8">Aucune actualité pour le moment.</p>
        )}
      </div>
    </div>
  );
}
