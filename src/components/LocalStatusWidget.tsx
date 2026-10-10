"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocalOfficeStatus, localTimeMinutes, type LocalOfficeData } from "@/utils/local-office-shared";

const weekdayNumber: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export default function LocalStatusWidget({ data, english = false, initialTime }: { data: LocalOfficeData; english?: boolean; initialTime: string }) {
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => new Date(initialTime));
  const [hovered, setHovered] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const l = (fr: string, en: string) => english ? en : fr;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [expanded]);

  const status = useMemo(() => getLocalOfficeStatus(data, now, english), [data, english, now]);
  const opening = localTimeMinutes(data.settings.opens_at);
  const closing = localTimeMinutes(data.settings.closes_at);
  const duration = Math.max(1, closing - opening);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short" }).format(now);
  const todayShifts = data.shifts.filter(shift => shift.weekday === weekdayNumber[parts]);
  const dayLabel = new Intl.DateTimeFormat(english ? "en-GB" : "fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" }).format(now);
  const clockLabel = new Intl.DateTimeFormat(english ? "en-GB" : "fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(now);
  const isOffDay = status.weekday > 5 || !!status.holidayName;
  const ticks = Array.from({ length: Math.floor(duration / 90) + 1 }, (_, index) => opening + index * 90)
    .concat(duration % 90 === 0 ? [] : [closing]);
  const yForTime = (minutes: number) => Math.max(0, Math.min(100, ((minutes - opening) / duration) * 100));
  const currentInRange = status.nowMinutes >= opening && status.nowMinutes <= closing;

  useEffect(() => {
    if (expanded || !status.isOpen) return;
    let resetTimer: number | undefined;
    const timer = setInterval(() => {
      setSparkle(true);
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => setSparkle(false), 900);
    }, 20_000);
    return () => { clearInterval(timer); window.clearTimeout(resetTimer); };
  }, [expanded, status.isOpen]);

  useEffect(() => {
    if (!status.isOpen || expanded) return;
    let hideTimer: number | undefined;
    const show = () => {
      setMessageVisible(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setMessageVisible(false), 8_000);
    };
    const timer = window.setInterval(show, 60_000);
    return () => { window.clearInterval(timer); window.clearTimeout(hideTimer); };
  }, [expanded, status.isOpen]);

  const bubbleText = l("Eh psssst ! Le local est ouvert, viens checker ses horaires 👀", "Psst! The local is open. Come check today's hours 👀");

  return <>
    {expanded && <button type="button" className="fixed inset-0 z-[70] cursor-default bg-black/25 backdrop-blur-[3px] lg:hidden" onClick={() => setExpanded(false)} aria-label={l("Fermer la fenêtre des horaires", "Close the opening hours panel")} />}
    <div style={expanded ? { bottom: "max(0.75rem, env(safe-area-inset-bottom))" } : undefined} className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[71] flex flex-col items-end gap-3 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-6">
    {expanded && <section aria-label={l("Horaires du local du BDE", "BDE local opening hours")} style={{ maxHeight: "calc(100dvh - 1.5rem - env(safe-area-inset-bottom))" }} className="flex w-[min(27rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-low shadow-2xl shadow-black/45 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <header className="local-panel-header relative shrink-0 overflow-hidden border-b border-outline-variant/15 bg-gradient-to-br from-tertiary/15 via-surface-container-high/80 to-primary/10 p-4 sm:p-5">
          <div aria-hidden="true" className="absolute -right-12 -top-16 size-44 rounded-full bg-tertiary/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3.5">
              <span aria-hidden="true" className={"flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-inner " + (status.isOpen ? "bg-success/15 text-success" : "bg-tertiary/10 text-tertiary")}><span className="material-symbols-outlined block text-[1.5rem] leading-none">storefront</span></span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-tertiary">{l("La vie au BDE", "Life at the BDE")}</p>
                <h2 className="mt-1 font-headline text-lg font-bold leading-tight">{l("Le local", "The local")}</h2>
                <p className="mt-1 text-xs capitalize text-on-surface-variant">{dayLabel}</p>
              </div>
            </div>
            <button type="button" onClick={() => setExpanded(false)} aria-label={l("Fermer les horaires", "Close opening hours")} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-surface-container-high"><span aria-hidden="true" className="material-symbols-outlined">close</span></button>
          </div>
          <div className="relative mt-3 flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/75 px-3 py-2.5 backdrop-blur-sm">
            <div className="flex min-w-0 items-center gap-3">
              <span className={"relative flex size-3 shrink-0 rounded-full " + (status.isOpen ? "bg-success" : "bg-outline")}>
                {status.isOpen && <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-40" />}
              </span>
              <div className="min-w-0"><p className={"text-sm font-bold " + (status.isOpen ? "text-success" : "text-on-surface")}>{status.isOpen ? l("C’est ouvert !", "We're open!") : l("Le local se repose", "The local is resting")}</p>
                {status.isOpen && status.responsible && <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">{l("Avec", "With")} <strong className="text-on-surface">{status.responsible}</strong></p>}
              </div>
            </div>
            <time className="shrink-0 rounded-xl bg-surface-container-high px-3 py-2 font-mono text-sm font-bold tabular-nums text-on-surface" dateTime={clockLabel}>{clockLabel}</time>
          </div>
          <p className="relative mt-2 line-clamp-2 text-[11px] leading-4 text-on-surface-variant">{status.message}</p>
        </header>

        <div className="local-panel-body min-h-0 space-y-3 overflow-hidden p-3 sm:p-4">
          <div className="flex items-end justify-between gap-3">
            <div><h3 className="font-headline text-sm font-bold">{l("Aujourd’hui au local", "Today's schedule")}</h3><p className="mt-1 text-[10px] text-on-surface-variant">{data.settings.opens_at.slice(0, 5)}–{data.settings.closes_at.slice(0, 5)} · {l("heure de Paris", "Paris time")}</p></div>
            <span className="rounded-full border border-tertiary/15 bg-tertiary/5 px-2.5 py-1 text-[9px] font-bold text-tertiary">{l("Pas de 1 h 30", "90-minute slots")}</span>
          </div>

          <div className="local-timeline-card rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-2.5 sm:p-3">
            <div className="ml-[4.35rem] flex items-center justify-between rounded-t-xl border border-b-0 border-outline-variant/10 bg-surface-container-high/75 px-3 py-2 text-[9px] text-on-surface-variant/70"><span>{l("Avant", "Before")} {data.settings.opens_at.slice(0, 5)}</span><span className="font-semibold">{l("Fermé", "Closed")}</span></div>
            <div className="relative" style={{ height: "clamp(70px, calc(100dvh - 30rem), 420px)" }}>
              <div className="absolute inset-y-0 left-[4.35rem] right-0 overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-low">
                {ticks.map(tick => {
                  const top = yForTime(tick);
                  return <div key={tick} className="absolute inset-x-0 z-[1] border-t border-outline-variant/20" style={{ top: top + "%" }}><span className="absolute -top-px left-2 size-1.5 -translate-y-1/2 rounded-full bg-outline-variant/50" /></div>;
                })}

                {!isOffDay && todayShifts.map(shift => {
                  const top = yForTime(localTimeMinutes(shift.starts_at));
                  const bottom = yForTime(localTimeMinutes(shift.ends_at));
                  return <article key={shift.id} title={shift.note || undefined} className="absolute left-3 right-3 z-[2] flex flex-col justify-center overflow-hidden rounded-xl border-l-4 border-tertiary bg-gradient-to-r from-tertiary/25 via-tertiary/15 to-primary/10 px-3 shadow-[0_5px_18px_rgba(76,180,226,.12)]" style={{ top: top + "%", height: Math.max(3, bottom - top) + "%" }}>
                    <div className="flex min-h-0 items-center gap-2 overflow-hidden"><span aria-hidden="true" className="material-symbols-outlined shrink-0 text-base text-tertiary">key</span><div className="min-w-0"><p className="truncate text-[11px] font-bold text-on-surface">{shift.keyholder_name}</p><p className="truncate text-[9px] font-medium text-on-surface-variant">{shift.starts_at.slice(0, 5)}–{shift.ends_at.slice(0, 5)}{shift.note ? " · " + shift.note : ""}</p></div></div>
                  </article>;
                })}

                {isOffDay && <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center bg-surface-container-high/75 px-5 text-center backdrop-blur-[2px]"><span aria-hidden="true" className="material-symbols-outlined text-3xl text-on-surface-variant/50">{status.holidayName ? "celebration" : "bedtime"}</span><p className="mt-2 text-sm font-bold text-on-surface-variant">{status.holidayName || l("Le local est fermé le week-end", "The local is closed for the weekend")}</p><p className="mt-1 text-[10px] text-on-surface-variant/75">{l("Les permanences reprendront un jour ouvré.", "Shifts resume on the next working day.")}</p></div>}

                {!isOffDay && todayShifts.length === 0 && <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center bg-surface-container-high/60 px-5 text-center"><span aria-hidden="true" className="material-symbols-outlined text-3xl text-on-surface-variant/55">event_busy</span><p className="mt-2 text-xs font-bold text-on-surface-variant">{l("Pas de permanence annoncée", "No shift posted")}</p><p className="mt-1 max-w-48 text-[10px] leading-4 text-on-surface-variant/75">{l("Le local peut être fermé si aucun membre n’est présent.", "The local may be closed when no member is present.")}</p></div>}

                {currentInRange && !isOffDay && <div className="pointer-events-none absolute inset-x-0 z-[4] border-t-2 border-primary shadow-[0_0_12px_rgba(123,208,255,.65)]" style={{ top: yForTime(status.nowMinutes) + "%" }}><span className="absolute -left-1.5 -top-[5px] size-2.5 rounded-full border-2 border-surface bg-primary" /></div>}
              </div>
              {ticks.map((tick, index) => {
                const isEdge = index === 0 || index === ticks.length - 1;
                return <span key={"label-" + tick} className={"local-time-label absolute left-0 w-[3.8rem] -translate-y-1/2 pr-2 text-right font-mono text-[10px] font-semibold tabular-nums " + (isEdge ? "text-tertiary" : "text-on-surface-variant/75")} style={{ top: yForTime(tick) + "%" }}>{String(Math.floor(tick / 60)).padStart(2, "0")}:{String(tick % 60).padStart(2, "0")}</span>;
              })}
              {currentInRange && !isOffDay && <span className="pointer-events-none absolute left-0 w-[3.8rem] -translate-y-1/2 pr-2 text-right font-mono text-[9px] font-bold tabular-nums text-primary" style={{ top: yForTime(status.nowMinutes) + "%" }}>{clockLabel}</span>}
            </div>
            <div className="ml-[4.35rem] flex items-center justify-between rounded-b-xl border border-t-0 border-outline-variant/10 bg-surface-container-high/75 px-3 py-2 text-[9px] text-on-surface-variant/70"><span>{l("Après", "After")} {data.settings.closes_at.slice(0, 5)}</span><span className="font-semibold">{l("Fermé", "Closed")}</span></div>
            <div className="mt-3 flex items-center justify-center gap-2 text-[9px] text-on-surface-variant"><span className="size-2 rounded-sm bg-tertiary" />{l("Permanence confirmée", "Confirmed shift")}<span className="ml-2 size-2 rounded-sm bg-primary" />{l("Heure actuelle", "Current time")}</div>
          </div>
        </div>
      </section>}

      {!expanded && <div className="group relative flex items-center gap-2" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {messageVisible && status.isOpen && !expanded && <div role="status" className="relative max-w-[min(18rem,calc(100vw-6rem))] rounded-2xl rounded-br-sm border border-success/20 bg-surface-container-low px-4 py-3 text-xs font-semibold leading-5 text-on-surface shadow-xl animate-in fade-in slide-in-from-right-2 duration-300">
          {bubbleText}<span aria-hidden="true" className="absolute -bottom-1.5 right-3 size-3 rotate-45 border-b border-r border-success/20 bg-surface-container-low" />
        </div>}
        {hovered && !expanded && !messageVisible && <span className="rounded-full border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface shadow-xl animate-in fade-in slide-in-from-right-2 duration-150">{l("Horaires du local", "Local opening hours")}</span>}
        <button type="button" onClick={() => { setExpanded(value => !value); setMessageVisible(false); }} aria-expanded={expanded} aria-label={expanded ? l("Fermer les horaires du local", "Close local opening hours") : l("Afficher les horaires du local", "Show local opening hours")} className={"relative flex size-14 items-center justify-center rounded-full border shadow-xl transition duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary " + (status.isOpen ? "border-success/30 bg-success text-white" : "border-tertiary/30 bg-surface-container-high text-tertiary")}>
          <span className={"material-symbols-outlined flex size-7 items-center justify-center text-2xl leading-none transition-transform duration-300 group-hover:scale-110 " + (sparkle && status.isOpen && !expanded ? "local-boutique-shake" : "")}>storefront</span>
          <span className={"absolute right-0 top-0 size-3.5 rounded-full border-2 border-surface " + (status.isOpen ? "bg-success" : "bg-outline")}></span>
          {!status.isOpen && <span aria-hidden="true" className="local-zzz absolute -right-2 -top-3 text-[10px] font-black tracking-tight text-tertiary">Zzz</span>}
          {sparkle && status.isOpen && !expanded && <><span aria-hidden="true" className="material-symbols-outlined local-star-pop local-star-pop-1 absolute -right-2 -top-2 text-sm text-amber-300">auto_awesome</span><span aria-hidden="true" className="material-symbols-outlined local-star-pop local-star-pop-2 absolute -left-2 top-0 text-xs text-amber-200">kid_star</span><span aria-hidden="true" className="material-symbols-outlined local-star-pop local-star-pop-3 absolute -bottom-1 right-0 text-[10px] text-amber-300">auto_awesome</span></>}
        </button>
      </div>}
    </div>
    <style jsx global>{`
      @keyframes local-boutique-shake { 0%, 100% { transform: rotate(0) } 15% { transform: rotate(-13deg) } 30% { transform: rotate(12deg) } 45% { transform: rotate(-9deg) } 60% { transform: rotate(7deg) } 75% { transform: rotate(-3deg) } }
      @keyframes local-star-pop { 0% { opacity: 0; transform: scale(.25) translateY(5px) rotate(-30deg) } 35% { opacity: 1; transform: scale(1.2) translateY(-2px) rotate(12deg) } 100% { opacity: 0; transform: scale(.65) translateY(-10px) rotate(30deg) } }
      @keyframes local-zzz { 0%, 100% { opacity: .4; transform: translate(0, 3px) scale(.8) rotate(-8deg) } 50% { opacity: 1; transform: translate(2px, -3px) scale(1.05) rotate(7deg) } }
      .local-boutique-shake { animation: local-boutique-shake 700ms ease-in-out; }
      .local-star-pop { animation: local-star-pop 850ms ease-out both; }
      .local-star-pop-2 { animation-delay: 120ms; }
      .local-star-pop-3 { animation-delay: 240ms; }
      .local-zzz { animation: local-zzz 2.8s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { .local-boutique-shake, .local-star-pop, .local-zzz { animation: none !important; } }
      @media (max-height: 480px) { .local-time-label:not(:first-of-type):not(:last-of-type):nth-of-type(even) { display: none; } }
      @media (max-height: 540px) { .local-panel-header { padding: 10px !important; } .local-panel-body { padding: 8px !important; gap: 8px !important; } .local-timeline-card { padding: 6px !important; } }
    `}</style>
  </>;
}
