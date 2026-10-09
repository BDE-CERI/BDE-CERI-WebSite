"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPublicMemberName } from "@/utils/member-display";

interface MemberNode {
  id: string;
  first_name: string;
  last_name: string;
  hide_last_name?: boolean;
  photo_url: string | null;
  role_label: string;
  is_vp: boolean;
}

interface PoleNode {
  id: string;
  name: string;
  description: string;
  color: string;
  vp: MemberNode | null;
  members: MemberNode[];
}

interface PolesTreeProps {
  poles: PoleNode[];
  labels: {
    map_kicker: string;
    map_title: string;
    map_hint: string;
    map_anchor: string;
    map_current: string;
    map_crew: string;
    map_lead: string;
    member_count: string;
    discover_pole: string;
    no_poles: string;
    no_crew: string;
    map_currents: string;
    map_places: string;
  };
}

const islandPositions = [
  { x: 12, y: 30 },
  { x: 29, y: 70 },
  { x: 50, y: 13 },
  { x: 72, y: 25 },
  { x: 89, y: 48 },
  { x: 71, y: 77 },
  { x: 50, y: 88 },
  { x: 29, y: 30 },
  { x: 89, y: 80 },
  { x: 11, y: 72 },
];

const iconForPole = (name: string) => {
  const value = name.toLowerCase();
  if (value.includes("évén") || value.includes("even")) return "celebration";
  if (value.includes("com")) return "campaign";
  if (value.includes("jeu") || value.includes("gaming") || value.includes("esport")) return "sports_esports";
  if (value.includes("parten")) return "handshake";
  if (value.includes("sport")) return "sports_soccer";
  if (value.includes("taverne") || value.includes("bar")) return "local_cafe";
  return "groups";
};

export default function PolesTree({ poles, labels }: PolesTreeProps) {
  const [activeId, setActiveId] = useState(poles[0]?.id ?? "");
  const active = poles.find((pole) => pole.id === activeId) ?? poles[0] ?? null;

  if (!poles.length) {
    return (
      <div className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-low px-6 py-16 text-center text-on-surface-variant">
        {labels.no_poles}
      </div>
    );
  }

  const crew = active ? [...(active.vp ? [active.vp] : []), ...active.members] : [];

  return (
    <section className="current-atlas relative">
      <div className="mb-5 flex flex-col justify-between gap-3 px-1 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-tertiary">
            <span className="h-px w-7 bg-tertiary" />
            {labels.map_kicker}
          </p>
          <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">{labels.map_title}</h2>
        </div>
        <p className="max-w-sm text-xs leading-5 text-on-surface-variant sm:text-right">{labels.map_hint}</p>
      </div>

      <div className="ocean-chart relative isolate min-h-[390px] overflow-hidden rounded-[2rem] border border-[#83d9ff]/20 bg-[#071725] shadow-[0_35px_100px_rgba(1,9,18,.5)] sm:min-h-[480px] lg:min-h-[540px]">
        <div aria-hidden="true" className="ocean-depth absolute inset-0" />
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 1000 520" preserveAspectRatio="none" fill="none">
          <defs>
            <radialGradient id="oceanGlow" cx="0" cy="0" r="1" gradientTransform="matrix(0 360 -470 0 500 260)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#17618a" stopOpacity=".6" />
              <stop offset="1" stopColor="#071725" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="currentLine" x1="130" y1="260" x2="870" y2="260" gradientUnits="userSpaceOnUse">
              <stop stopColor="#83d9ff" stopOpacity="0" />
              <stop offset=".5" stopColor="#83d9ff" stopOpacity=".78" />
              <stop offset="1" stopColor="#83d9ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="1000" height="520" fill="url(#oceanGlow)" />
          <path className="atlas-contour atlas-contour-a" d="M-40 120C94 40 159 212 305 156s167-149 295-100 212 154 453 48" />
          <path className="atlas-contour atlas-contour-b" d="M-20 210c167-122 221 102 369 15S512 81 640 169s205 139 390 35" />
          <path className="atlas-contour atlas-contour-c" d="M-36 340c131-117 223-27 342-67s171-149 309-89 210 168 417 58" />
          <path className="atlas-contour atlas-contour-a" d="M-28 458c156-102 219 22 375-31s169-120 289-52 191 97 394 8" />
          <path d="M0 260H1000M500 0V520" stroke="#b7e9ff" strokeOpacity=".055" strokeDasharray="2 12" />
          <circle cx="500" cy="260" r="128" stroke="#83d9ff" strokeOpacity=".11" strokeDasharray="2 9" />
          <circle cx="500" cy="260" r="190" stroke="#83d9ff" strokeOpacity=".08" strokeDasharray="1 13" />
          {poles.map((pole, index) => {
            const point = islandPositions[index % islandPositions.length];
            const x = point.x * 10;
            const y = point.y * 5.2;
            const activePoint = pole.id === active?.id;
            const controlX = Math.round((500 + x) / 2);
            const controlY = Math.round(y + (y < 260 ? 44 : -44));
            return (
              <g key={pole.id}>
                <path
                  d={"M 500 260 Q " + controlX + " " + controlY + " " + x + " " + y}
                  stroke={activePoint ? (pole.color || "#83d9ff") : "url(#currentLine)"}
                  strokeOpacity={activePoint ? ".86" : ".3"}
                  strokeWidth={activePoint ? "2.1" : "1"}
                  strokeDasharray={activePoint ? "7 7" : "3 10"}
                  className={activePoint ? "atlas-route atlas-route-active" : "atlas-route"}
                />
                <circle cx={x} cy={y} r={activePoint ? "13" : "7"} fill={pole.color || "#83d9ff"} fillOpacity={activePoint ? ".18" : ".09"} />
              </g>
            );
          })}
          <circle className="atlas-sonar" cx="500" cy="260" r="48" stroke="#a8e7ff" strokeOpacity=".32" />
          <circle cx="500" cy="260" r="35" fill="#0b263b" stroke="#83d9ff" strokeOpacity=".45" />
        </svg>

        <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-[#06131f]/70 px-3 py-2 text-[9px] font-bold uppercase tracking-[.2em] text-[#b8d9e9]/75 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[#74e4d0] shadow-[0_0_10px_#74e4d0]" />
          {labels.map_anchor}
        </div>
        <div className="absolute right-5 top-5 z-10 hidden text-right font-mono text-[9px] leading-5 tracking-widest text-[#b8d9e9]/40 sm:block">
          43°56′ N · 4°48′ E<br />AVIGNON / CERI
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 flex h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#8bdfff]/35 bg-[#dceef5] shadow-[0_0_50px_rgba(78,195,245,.22)] sm:h-[90px] sm:w-[90px]">
          <Image src="/logos/BDE-CERI-logo.png" alt="BDE CERI" width={72} height={72} className="h-14 w-14 object-contain sm:h-[68px] sm:w-[68px]" sizes="72px" />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-[calc(50%+52px)] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#06131f]/80 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.18em] text-[#c7e4f1]/65 backdrop-blur sm:top-[calc(50%+59px)]">
          BDE CERI · Avignon
        </div>

        {poles.map((pole, index) => {
          const point = islandPositions[index % islandPositions.length];
          const isActive = pole.id === active?.id;
          const accent = pole.color || "#83d9ff";
          const style = {
            left: point.x + "%",
            top: point.y + "%",
            "--island-color": accent,
            animationDelay: (index * 90) + "ms",
          } as CSSProperties;
          return (
            <button
              key={pole.id}
              type="button"
              aria-label={pole.name}
              aria-pressed={isActive}
              title={pole.name}
              onClick={() => setActiveId(pole.id)}
              className={"atlas-island absolute z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-mono font-bold shadow-lg outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071725] sm:h-14 sm:w-14 " + (isActive ? "is-active border-[var(--island-color)] bg-[var(--island-color)] text-[#06131f]" : "border-white/20 bg-[#0b2538]/90 text-[#d0e7f3] hover:border-[var(--island-color)] hover:text-white")}
              style={style}
            >
              <span className="material-symbols-outlined absolute -top-1.5 right-0 text-[15px] text-[var(--island-color)]">{iconForPole(pole.name)}</span>
              <span>{(index + 1).toString().padStart(2, "0")}</span>
              {isActive && <span className="atlas-ping absolute inset-[-8px] rounded-full border border-[var(--island-color)]" />}
            </button>
          );
        })}

        <div className="pointer-events-none absolute bottom-5 left-5 z-10 hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#c7e4f1]/35 sm:flex">
          <span>{labels.map_currents}</span><span className="h-px w-10 bg-[#83d9ff]/40" /><span>{labels.map_crew}</span>
        </div>
        <div className="pointer-events-none absolute bottom-5 right-5 z-10 font-mono text-[9px] uppercase tracking-widest text-[#c7e4f1]/35">
          {labels.map_places.replace("{count}", String(poles.length))}
        </div>
      </div>

      <nav aria-label={labels.map_title} className="atlas-index mt-3 flex gap-2 overflow-x-auto pb-2">
        {poles.map((pole, index) => {
          const isActive = pole.id === active?.id;
          const accent = pole.color || "#83d9ff";
          return (
            <button
              key={pole.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveId(pole.id)}
              className={"shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors " + (isActive ? "border-[var(--island-color)] bg-[var(--island-color)]/10 text-on-surface" : "border-outline-variant/20 bg-surface-container-low/60 text-on-surface-variant hover:border-outline-variant/50")}
              style={{ "--island-color": accent } as CSSProperties}
            >
              <span className="mr-2 font-mono text-[9px] opacity-55">{(index + 1).toString().padStart(2, "0")}</span>
              {pole.name}
            </button>
          );
        })}
      </nav>

      {active && (
        <article key={active.id} className="atlas-detail mt-5 grid overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-low md:grid-cols-[1.05fr_.95fr]">
          <div className="relative overflow-hidden p-6 sm:p-9">
            <div aria-hidden="true" className="absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[.11] blur-3xl" style={{ backgroundColor: active.color || "#83d9ff" }} />
            <p className="relative mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: active.color || "#83d9ff" }}>
              <span>{labels.map_current}</span><span className="h-px w-8 bg-current opacity-50" />
              {String(poles.findIndex((pole) => pole.id === active.id) + 1).padStart(2, "0")} / {String(poles.length).padStart(2, "0")}
            </p>
            <h3 className="relative max-w-xl font-headline text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">{active.name}</h3>
            <p className="relative mt-4 max-w-xl text-sm leading-7 text-on-surface-variant sm:text-base">{active.description}</p>
            <Link href={"/poles/" + active.id} className="group relative mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-bold text-[#071725] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ backgroundColor: active.color || "#83d9ff" }}>
              {labels.discover_pole}
              <span aria-hidden="true" className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>

          <div className="relative border-t border-outline-variant/10 bg-surface-container-lowest/35 p-6 sm:p-9 md:border-l md:border-t-0">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-on-surface-variant">{labels.map_crew}</p>
              <span className="rounded-full border border-outline-variant/15 px-2.5 py-1 text-[10px] font-mono text-on-surface-variant">
                {labels.member_count.replace("{count}", String(crew.length))}
              </span>
            </div>
            {active.vp && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-low/65 p-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-outline-variant/20 bg-surface-container-high">
                  {active.vp.photo_url ? <Image src={active.vp.photo_url} alt="" fill sizes="48px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center font-bold text-on-surface-variant">{active.vp.first_name.charAt(0)}</span>}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-on-surface">{getPublicMemberName(active.vp)}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-on-surface-variant">{labels.map_lead}</p>
                </div>
                <span className="material-symbols-outlined ml-auto text-xl" style={{ color: active.color || "#83d9ff" }}>workspace_premium</span>
              </div>
            )}
            {crew.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {crew.map((member) => (
                  <Link key={member.id} href={"/equipe/" + member.id} className="group flex max-w-full items-center gap-2 rounded-full border border-outline-variant/10 bg-surface-container-low/45 py-1 pl-1 pr-3 transition hover:border-outline-variant/35">
                    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                      {member.photo_url ? <Image src={member.photo_url} alt="" fill sizes="28px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center text-[9px] font-bold text-on-surface-variant">{member.first_name.charAt(0)}</span>}
                    </span>
                    <span className="truncate text-[11px] font-medium text-on-surface-variant group-hover:text-on-surface">{getPublicMemberName(member)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-on-surface-variant">{labels.no_crew}</p>
            )}
          </div>
        </article>
      )}
    </section>
  );
}
