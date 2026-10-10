"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type HomeMember = {
  id: string;
  name: string;
  role: string;
  studyLevel: string;
  pole: string;
  photoUrl: string | null;
};

export default function HomeMemberCarousel({ members, english = false }: { members: HomeMember[]; english?: boolean }) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(1400);
  const activeRef = useRef(0);
  const transitionFrame = useRef<number | null>(null);
  const transitionTimeout = useRef<number | null>(null);
  const member = members[active];
  const nextMember = members.length > 1 ? members[(active + 1) % members.length] : null;
  const previousMember = previous === null ? null : members[previous];

  useEffect(() => {
    if (members.length < 2) return;
    const timer = window.setInterval(() => {
      const oldIndex = activeRef.current;
      const nextIndex = (oldIndex + 1) % members.length;
      const duration = nextIndex === 0 ? 1800 : 1300;
      activeRef.current = nextIndex;
      setPrevious(oldIndex);
      setActive(nextIndex);
      setTransitionDuration(duration);
      setTransitioning(false);
      if (transitionFrame.current !== null) window.cancelAnimationFrame(transitionFrame.current);
      transitionFrame.current = window.requestAnimationFrame(() => setTransitioning(true));
      if (transitionTimeout.current !== null) window.clearTimeout(transitionTimeout.current);
      transitionTimeout.current = window.setTimeout(() => {
        setPrevious(null);
        setTransitioning(false);
        transitionTimeout.current = null;
      }, duration + 100);
    }, 3000);
    return () => {
      window.clearInterval(timer);
      if (transitionFrame.current !== null) window.cancelAnimationFrame(transitionFrame.current);
      if (transitionTimeout.current !== null) window.clearTimeout(transitionTimeout.current);
    };
  }, [members.length]);

  return (
    <section aria-label={english ? "Meet the BDE team" : "Rencontrer les membres du BDE"} aria-roledescription="carousel"
      className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high shadow-2xl">
      {member?.photoUrl ? <Image key={`member-image-${member.id}`} src={member.photoUrl} alt="" fill sizes="(max-width: 768px) 100vw, 400px" loading="eager" className="object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-surface-container-high to-tertiary/30" />}
      {nextMember?.photoUrl && <Image key={`next-image-${nextMember.id}`} src={nextMember.photoUrl} alt="" fill sizes="(max-width: 768px) 100vw, 400px" loading="eager" className="pointer-events-none absolute inset-0 opacity-0" />}
      {previousMember?.photoUrl && <Image key={`previous-image-${previousMember.id}`} src={previousMember.photoUrl} alt="" fill sizes="(max-width: 768px) 100vw, 400px" className={`absolute inset-0 object-cover transition-opacity ease-in-out ${transitioning ? "opacity-0" : "opacity-100"}`} style={{ transitionDuration: `${transitionDuration}ms` }} />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40" />

      <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-white backdrop-blur-sm">
          <span aria-hidden="true" className="material-symbols-outlined text-sm">groups</span>{english ? "Meet the BDE crew" : "L’équipage du BDE"}
        </span>
      </div>

      {member ? <div key={`member-content-${member.id}`} className="absolute bottom-5 left-5 right-5 animate-in fade-in slide-in-from-bottom-2 duration-1000 sm:bottom-6 sm:left-7 sm:right-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-white/75">{member.role || (english ? "BDE member" : "Membre du BDE")}</p>
        <h2 className="font-headline text-2xl font-bold leading-tight text-white sm:text-3xl">{member.name}</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {member.pole && <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm"><span aria-hidden="true" className="material-symbols-outlined text-xs">hub</span><span className="truncate">{member.pole}</span></span>}
          {member.studyLevel && <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm"><span aria-hidden="true" className="material-symbols-outlined text-xs">school</span>{member.studyLevel}</span>}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3">
          <Link href={`/equipe/${member.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
            {english ? "View profile" : "Voir son profil"}<span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div> : <div className="absolute inset-x-6 bottom-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-white/75">BDE CERI</p>
        <h2 className="mt-2 font-headline text-2xl font-bold">{english ? "Meet the team" : "Rencontre l’équipe"}</h2>
        <Link href="/equipe" className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4">{english ? "Discover the team" : "Découvrir l’équipe"}<span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_forward</span></Link>
      </div>}
    </section>
  );
}
