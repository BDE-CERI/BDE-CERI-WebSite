"use client";

import { useState } from "react";
import { updateEvent, deleteEvent } from "./actions";
import ImageUpload from "@/components/ImageUpload";

interface EventItem {
  id: string;
  title: string;
  description: string;
  full_content?: string;
  date_start: string;
  location: string;
  precise_location?: string;
  max_capacity?: number;
  image_url?: string;
  status: string;
}

export default function EventManager({ dict, initialEvents }: { dict: any, initialEvents: EventItem[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Es-tu sûr de vouloir supprimer cet événement ?")) return;
    setIsDeleting(id);
    const res = await deleteEvent(id);
    if ("error" in res) {
      alert(res.error);
    } else {
      setEvents(events.filter(e => e.id !== id));
    }
    setIsDeleting(null);
  };

  const handleUpdate = async (formData: FormData) => {
    const res = await updateEvent(formData);
    if ("error" in res) {
      alert(res.error);
    } else {
      setEditingId(null);
      // Data will refresh via revalidatePath, but we could update locally for speed
      window.location.reload(); 
    }
  };

  return (
    <section className="glass-panel p-8 rounded-2xl ghost-border">
      <h2 className="font-headline text-2xl font-bold mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary">event_note</span>
        Gérer les Événements
      </h2>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                  {event.image_url ? (
                    <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30">
                      <span className="material-symbols-outlined">image</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{event.title}</h3>
                  <p className="text-xs text-on-surface-variant">{new Date(event.date_start).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(editingId === event.id ? null : event.id)}
                  className="p-2 rounded-lg hover:bg-secondary/10 text-secondary transition-colors"
                >
                  <span className="material-symbols-outlined">{editingId === event.id ? "close" : "edit"}</span>
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={isDeleting === event.id}
                  className="p-2 rounded-lg hover:bg-error/10 text-error transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">{isDeleting === event.id ? "sync" : "delete"}</span>
                </button>
              </div>
            </div>

            {editingId === event.id && (
              <form action={handleUpdate} className="p-6 pt-0 border-t border-outline-variant/10 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <input type="hidden" name="id" value={event.id} />
                <input type="hidden" name="current_image_url" value={event.image_url || ""} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase opacity-50 block mb-1">Titre</label>
                      <input name="title" defaultValue={event.title} required className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase opacity-50 block mb-1">Résumé</label>
                      <textarea name="description" defaultValue={event.description} rows={2} required className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase opacity-50 block mb-1">Contenu Détaillé (Page dédiée)</label>
                      <textarea name="full_content" defaultValue={event.full_content} rows={5} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary" placeholder="Description longue, programme, détails..." />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold uppercase opacity-50 block mb-1">Date</label>
                        <input name="date_start" type="datetime-local" defaultValue={event.date_start.slice(0, 16)} required className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary" />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-50 block mb-1">Capacité Max</label>
                        <input name="max_capacity" type="number" defaultValue={event.max_capacity || ""} placeholder="Illimité" className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase opacity-50 block mb-1">Lieu (Général)</label>
                      <input name="location" defaultValue={event.location} required className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase opacity-50 block mb-1">Lieu Précis (Page dédiée)</label>
                      <input name="precise_location" defaultValue={event.precise_location} placeholder="ex: Salle 102, Bâtiment ADA" className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase opacity-50 block mb-1">Photo principale</label>
                      <ImageUpload name="image" defaultValue={event.image_url} />
                      <p className="text-[10px] opacity-40 mt-1">Laisse vide pour garder l&apos;ancienne image.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setEditingId(null)} className="px-6 py-2 rounded-lg text-sm font-bold border border-outline-variant/30 hover:bg-surface-container-high">Annuler</button>
                  <button type="submit" className="px-6 py-2 rounded-lg bg-secondary text-on-secondary text-sm font-bold shadow-lg shadow-secondary/20 transition-all hover:scale-105">Enregistrer les modifications</button>
                </div>
              </form>
            )}
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-center py-10 text-on-surface-variant italic">Aucun événement à gérer.</p>
        )}
      </div>
    </section>
  );
}
