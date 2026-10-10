"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
export default function ShopAdBanner({ images, eyebrow, title, description, action, english = false, destination = "/boutique", membershipPromo = false }: { images: string[]; eyebrow: string; title: string; description: string; action: string; english?: boolean; destination?: string; membershipPromo?: boolean }) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const activeRef = useRef(0);
  const previousRef = useRef<number | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const transitionTo = useCallback((nextIndex: number) => {
    if (nextIndex === activeRef.current) return;
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    previousRef.current = activeRef.current;
    setPrevious(activeRef.current);
    activeRef.current = nextIndex;
    setActive(nextIndex);
    setTransitioning(false);
  }, []);
  const finishTransition = useCallback(() => {
    if (previousRef.current === null) return;
    setTransitioning(true);
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      previousRef.current = null;
      setPrevious(null);
      setTransitioning(false);
      transitionTimer.current = null;
    }, 1300);
  }, []);
  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => transitionTo((activeRef.current + 1) % images.length), 6500);
    return () => {
      window.clearInterval(timer);
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    };
  }, [images.length, transitionTo]);
  const image = images[active] || images[0];
  const previousImage = previous === null ? null : images[previous];
  return <section aria-label={english ? "BDE shop feature" : "Mise en avant de la boutique du BDE"} className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="relative isolate grid overflow-hidden rounded-3xl border border-[#D6A64B]/50 bg-[#102A3A] shadow-[0_24px_70px_rgba(4,18,28,0.35)] md:grid-cols-[1.1fr_0.9fr]">
      <span title={english ? "Advertisement" : "Publicité"} className="absolute right-3 top-3 z-20 rounded-md border border-white/20 bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">PUB</span>
      <div className={`relative min-h-64 overflow-hidden sm:min-h-80 ${membershipPromo ? "flex items-center justify-center bg-gradient-to-br from-[#143F53] via-[#102A3A] to-[#081E2A] p-8" : "bg-surface-container-high"}`}>
        {membershipPromo ? <div aria-hidden="true" className="relative flex size-56 flex-col items-center justify-center rounded-full border border-[#E8C477]/40 bg-[#E8C477]/10 text-center shadow-[0_0_80px_rgba(232,196,119,0.16)] sm:size-64"><span className="material-symbols-outlined text-6xl text-[#F2D491]">card_membership</span><span className="mt-2 font-headline text-5xl font-black text-white">5 €</span><span className="mt-1 text-xs font-bold uppercase tracking-[.2em] text-[#F2D491]">{english ? "per year" : "par an"}</span><span className="material-symbols-outlined absolute -right-1 top-6 rotate-12 text-4xl text-white/25">sailing</span><span className="material-symbols-outlined absolute -bottom-1 left-1 rotate-[-18deg] text-3xl text-white/20">star</span></div> : <>
        {image && <Image key={`shop-current-${image}`} src={image} alt="" fill sizes="(max-width: 768px) 100vw, 55vw" loading="eager" onLoad={finishTransition} onError={finishTransition} className={`object-cover transition-opacity ease-in-out ${previousImage && !transitioning ? "opacity-0" : "opacity-100"}`} style={{ transitionDuration: "1200ms" }} />}
        {previousImage && <Image key={`shop-previous-${previousImage}`} src={previousImage} alt="" fill sizes="(max-width: 768px) 100vw, 55vw" className={`object-cover transition-opacity ease-in-out ${transitioning ? "opacity-0" : "opacity-100"}`} style={{ transitionDuration: "1200ms" }} />}
        </>}
      </div>
      <div className="relative isolate flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#16465A] via-[#103448] to-[#0A2232] p-6 sm:p-9 lg:p-12"><span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute bottom-0 right-1 rotate-[-14deg] text-[10rem] text-white/[0.045]">sailing</span><div className="relative z-10"><span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#E8C477]/25 bg-[#E8C477]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#F2D491]"><span aria-hidden="true" className="material-symbols-outlined text-base">sailing</span>{eyebrow}</span><h2 className="font-headline text-2xl font-bold text-white sm:text-3xl">{title}</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-200">{description}</p><Link href={destination} className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[#E8C477] px-5 py-3 text-sm font-bold text-[#102A3A] transition hover:-translate-y-0.5 hover:bg-[#F2D491] hover:shadow-lg">{action}<span aria-hidden="true" className="material-symbols-outlined text-lg">{membershipPromo ? "card_membership" : "sailing"}</span></Link></div></div>
    </div>
  </section>;
}
