"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  category: string;
  description: string;
  short_description?: string;
  image_url: string;
  date_start: string;
  location: string;
}

export default function EventCarousel({ events, dict }: { events: any[], dict: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (events.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [events.length]);

  if (!events || events.length === 0) return null;

  const mainEvent = events[currentIndex];
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="md:col-span-2 reveal-card rounded-xl p-8 relative overflow-hidden group flex flex-col justify-end min-h-[400px] transition-all duration-700">
      <div className="absolute inset-0 z-0">
        <img
          alt={mainEvent.title}
          className="w-full h-full object-cover animate-fade-in opacity-40 group-hover:scale-105 transition-transform duration-1000"
          key={mainEvent.image_url} // Force animation on image change
          src={mainEvent.image_url || "https://images.unsplash.com/photo-1514525253361-bee8a187499b?auto=format&fit=crop&q=80&w=1000"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
      </div>
      
      <div className="relative z-10 animate-slide-up" key={mainEvent.id}>
        <div className="inline-flex bg-tertiary text-on-tertiary text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider mb-4">
          {mainEvent.category || "Event"}
        </div>
        <h4 className="text-3xl font-headline font-bold text-on-surface mb-2">{mainEvent.title}</h4>
        <p className="text-on-surface-variant font-body mb-6 max-w-lg">{mainEvent.short_description || mainEvent.description}</p>
        <div className="flex items-center justify-between border-t border-outline-variant/15 pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-on-surface-variant space-x-1">
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>{formatDate(mainEvent.date_start)}</span>
            </div>
            <div className="flex items-center text-sm text-on-surface-variant space-x-1">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>{mainEvent.location || "CERI"}</span>
            </div>
          </div>
          <Link href={`/evenement/${mainEvent.id}`}>
            <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-tertiary hover:text-on-tertiary transition-colors">
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Indicators */}
      {events.length > 1 && (
        <div className="absolute top-8 right-8 z-20 flex space-x-1">
          {events.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-ter' : 'w-2 bg-outline-variant/30'}`}
              style={{ backgroundColor: i === currentIndex ? 'var(--md-sys-color-tertiary)' : undefined }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}
