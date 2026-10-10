"use client";
import { useState } from "react";
import Image from "next/image";
export type MemberAward = { id: string; event_name: string; award: "first" | "second" | "third" | "jury_choice"; team_name: string; academic_year: string };
const awardInfo = {
  first: { fr: "1er prix", en: "1st place", image: "/logos/t1er.png" },
  second: { fr: "2e prix", en: "2nd place", image: "/logos/t2eme.png" },
  third: { fr: "3e prix", en: "3rd place", image: "/logos/t3eme.png" },
  jury_choice: { fr: "Coup de coeur du jury", en: "Jury choice", image: "/logos/trubis.png" },
};
export function MembershipStatus({ paid, english = false }: { paid: boolean; english?: boolean }) {
  const label = paid ? (english ? "Annual membership paid" : "Adhésion annuelle payée") : (english ? "Annual membership not yet paid" : "Adhésion annuelle non réglée");
  return <span role="img" title={label} aria-label={label} className="inline-flex size-7 shrink-0 items-center justify-center"><Image src={paid ? "/logos/coche-verte.png" : "/logos/croix-rouge.png"} alt="" width={28} height={28} sizes="28px" className="size-7 object-contain" /></span>;
}
export default function MemberAwards({ awards, english = false }: { awards: MemberAward[]; english?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (!awards.length) return null;
  const visible = expanded ? awards : awards.slice(0, 3);
  return <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={english ? "Awards" : "Récompenses"}>
    <span className="mr-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{english ? "Awards" : "Récompenses"}</span>
    {visible.map(item => { const info = awardInfo[item.award]; const title = item.event_name + " - " + (english ? info.en : info.fr) + " - " + item.team_name + " - " + item.academic_year; return <span key={item.id} role="img" tabIndex={0} title={title} aria-label={title} className="inline-flex size-9 shrink-0 cursor-help items-center justify-center transition-transform hover:scale-105 focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-tertiary"><Image src={info.image} alt="" width={36} height={36} sizes="36px" className="size-full object-contain" /></span>; })}
    {awards.length > 3 && <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-label={expanded ? (english ? "Show fewer awards" : "Afficher moins de badges") : (english ? "Show all awards" : "Afficher tous les badges")} className="inline-flex size-9 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-high text-sm font-bold text-on-surface-variant hover:border-tertiary/50 hover:text-tertiary">{expanded ? "−" : "…"}</button>}
  </div>;
}
