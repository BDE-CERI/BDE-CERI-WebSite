"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import SharkWallpaper from "@/components/SharkWallpaper";
import { en } from "@/locales/en";
import { fr } from "@/locales/fr";
import { formatParisDateTime } from "@/utils/paris-time";

type EsportEvent = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  date_start: string | null;
  date_is_tbd: boolean;
  location: string | null;
  registration_enabled: boolean;
  registration_is_paid: boolean;
};

export default function EsportClient({
  lang,
  events,
  schemaMissing,
  eventsError,
}: {
  lang: "fr" | "en";
  events: EsportEvent[];
  schemaMissing: boolean;
  eventsError: boolean;
}) {
  const copy = lang === "en" ? en : fr;
  const [hostname, setHostname] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("bdeceri");
  const [customChannelInput, setCustomChannelInput] = useState("");
  const [channelError, setChannelError] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHostname(window.location.hostname);
      try {
        const saved = window.localStorage.getItem("bde-esport-twitch-channel");
        if (saved && /^[a-zA-Z0-9_]{1,25}$/.test(saved)) setSelectedChannel(saved);
      } catch {
        // The player remains usable when browser storage is unavailable.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const connectChannel = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const channel = customChannelInput.trim().replace(/^@/, "");
    if (!/^[a-zA-Z0-9_]{1,25}$/.test(channel)) {
      setChannelError(true);
      return;
    }
    setSelectedChannel(channel.toLowerCase());
    try {
      window.localStorage.setItem("bde-esport-twitch-channel", channel.toLowerCase());
    } catch {
      // Channel selection still applies for the current page session.
    }
    setCustomChannelInput("");
    setChannelError(false);
  };

  const playerUrl = hostname
    ? `https://player.twitch.tv/?channel=${encodeURIComponent(selectedChannel)}&parent=${encodeURIComponent(hostname)}&autoplay=false&muted=true`
    : "";
  const chatUrl = hostname
    ? `https://www.twitch.tv/embed/${encodeURIComponent(selectedChannel)}/chat?parent=${encodeURIComponent(hostname)}&darkpopout`
    : "";
  const twitchChannelUrl = `https://www.twitch.tv/${encodeURIComponent(selectedChannel)}`;
  const archiveLink = <Link href="/esport/archives" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2.5 text-sm font-bold text-on-surface transition hover:border-[#9146FF]/50 hover:bg-surface-container-high"><span aria-hidden="true" className="material-symbols-outlined text-lg text-[#B98BFF]">history</span>{copy.esport.event_archive}<span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span></Link>;

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface">
      <SharkWallpaper opacity={0.18} />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/4 top-1/4 size-80 rounded-full bg-[#9146FF]/10 blur-[150px]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-1/4 right-1/4 size-96 rounded-full bg-primary/10 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-12 px-4 py-14 sm:px-6 sm:py-20 lg:space-y-16">
        <header className="flex flex-col gap-7 border-b border-outline-variant/15 pb-9 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#9146FF]/25 bg-[#9146FF]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#c7a5ff]">
              <span aria-hidden="true" className="size-2 rounded-full bg-[#9146FF] shadow-[0_0_12px_#9146FF]" />
              {copy.esport.live_badge}
            </div>
            <h1 className="flex flex-wrap items-center gap-3 font-headline text-5xl font-bold tracking-tight text-on-surface sm:text-7xl">
              <svg aria-label="Twitch" role="img" viewBox="0 0 24 24" className="size-10 shrink-0 fill-[#9146FF] sm:size-14"><path d="M11.571 4.714h1.715v5.143h-1.715zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428H6V24l4.286-4.286h3.428L21.429 12V0H6zm13.714 11.143-3.428 3.429h-3.429l-3 3v-3H6V1.714h13.714v9.429z" /></svg>
              <span>CERI <span className="text-[#B98BFF]">eSport</span></span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant sm:text-lg">{copy.esport.description}</p>
          </div>
          <form onSubmit={connectChannel} className="w-full max-w-lg rounded-2xl border border-outline-variant/15 bg-surface-container-high/60 p-3 backdrop-blur-md">
            <label htmlFor="twitch-channel" className="mb-2 block px-1 text-xs font-bold text-on-surface">{copy.esport.twitch_connect}</label>
            <div className="flex gap-2">
              <input id="twitch-channel" type="text" autoComplete="off" spellCheck={false} placeholder={copy.esport.channel_placeholder} value={customChannelInput} onChange={(change) => { setCustomChannelInput(change.target.value); setChannelError(false); }} aria-invalid={channelError} aria-describedby={channelError ? "twitch-channel-error" : undefined} className="min-w-0 flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none focus:border-[#9146FF]" />
              <button type="submit" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#9146FF] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#7c35df]"><span aria-hidden="true" className="material-symbols-outlined text-base">cable</span>{copy.esport.change_channel}</button>
            </div>
            {channelError && <p id="twitch-channel-error" role="alert" className="mt-2 text-xs text-error">{copy.esport.twitch_invalid}</p>}
          </form>
        </header>

        <section aria-label={copy.esport.live_badge} className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="overflow-hidden rounded-3xl border border-outline-variant/15 bg-black shadow-2xl">
            <div className="hidden aspect-video min-h-[300px] w-full sm:block">
              {playerUrl ? <iframe title={`${copy.esport.live_badge} — ${selectedChannel}`} src={playerUrl} width="100%" height="100%" allowFullScreen loading="lazy" referrerPolicy="origin" className="block h-full w-full border-0" /> : <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">{copy.esport.loading_stream}</div>}
            </div>
            <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center sm:hidden">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-10 fill-[#9146FF]"><path d="M11.571 4.714h1.715v5.143h-1.715zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428H6V24l4.286-4.286h3.428L21.429 12V0H6zm13.714 11.143-3.428 3.429h-3.429l-3 3v-3H6V1.714h13.714v9.429z" /></svg>
              <p className="text-sm text-on-surface-variant">{copy.esport.twitch_fallback}</p>
              <a href={twitchChannelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#9146FF] px-4 py-2.5 text-sm font-bold text-white"><span aria-hidden="true" className="material-symbols-outlined text-lg">live_tv</span>{copy.esport.twitch_open}</a>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-surface-container-low px-4 py-3 sm:px-5">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-on-surface"><span className="size-2 rounded-full bg-[#9146FF]" />{selectedChannel}</span>
              <div className="flex flex-wrap items-center gap-2">
                <a href={twitchChannelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#9146FF]/30 px-3 py-2 text-xs font-bold text-[#c7a5ff] hover:bg-[#9146FF]/10"><span aria-hidden="true" className="material-symbols-outlined text-base">open_in_new</span>{copy.esport.twitch_open}</a>
                <button type="button" onClick={() => setShowChat((visible) => !visible)} aria-expanded={showChat} className="hidden min-h-10 items-center gap-1.5 rounded-lg border border-outline-variant/25 px-3 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high sm:inline-flex"><span aria-hidden="true" className="material-symbols-outlined text-base">forum</span>{showChat ? copy.esport.twitch_chat_close : copy.esport.twitch_chat_open}</button>
              </div>
            </div>
          </div>
          <aside className="flex flex-col justify-between gap-5 rounded-3xl border border-outline-variant/15 bg-surface-container-low p-5 sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#B98BFF]">Twitch</p>
              <h2 className="mt-2 font-headline text-xl font-bold text-on-surface">{copy.esport.live_chat}</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy.esport.twitch_fallback}</p>
              <a href={`https://help.twitch.tv/s/article/Disconnect-Protection?language=${lang === "en" ? "en_US" : "fr"}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-start gap-1.5 text-xs leading-5 text-on-surface-variant underline decoration-[#9146FF]/50 underline-offset-4 hover:text-on-surface"><span aria-hidden="true" className="material-symbols-outlined mt-0.5 text-sm text-[#B98BFF]">wifi_tethering</span>{copy.esport.stream_protection}</a>
            </div>
            {showChat && chatUrl ? <iframe title={`${copy.esport.live_chat} — ${selectedChannel}`} src={chatUrl} width="100%" height="360" loading="lazy" referrerPolicy="origin" className="min-h-72 w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest" /> : <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-high/30 text-center text-sm text-on-surface-variant"><span>{lang === "en" ? "Chat loads only when you open it." : "Le chat ne se charge que lorsque tu l’ouvres."}</span></div>}
            <a href={twitchChannelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#9146FF] px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#7c35df]"><span aria-hidden="true" className="material-symbols-outlined text-lg">live_tv</span>{copy.esport.twitch_open}</a>
          </aside>
        </section>

        <section className="space-y-6" aria-labelledby="esport-events-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[#B98BFF]">CERI eSport</p>
              <h2 id="esport-events-heading" className="font-headline text-3xl font-bold text-on-surface">{copy.esport.tournaments}</h2>
            </div>
            {archiveLink}
          </div>
          {schemaMissing || eventsError ? <div role="status" className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-7 text-sm leading-6 text-on-surface-variant"><span aria-hidden="true" className="material-symbols-outlined mb-2 block text-2xl text-[#B98BFF]">info</span>{schemaMissing ? copy.esport.event_schema_missing : copy.esport.event_load_error}</div> : events.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => {
              const date = event.date_is_tbd || !event.date_start ? copy.esport.event_coming_soon : formatParisDateTime(event.date_start, { dateStyle: "medium", timeStyle: "short" }, lang === "en" ? "en-GB" : "fr-FR");
              return <Link key={event.id} href={`/evenement/${event.id}`} className="group flex min-h-64 flex-col overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low transition hover:-translate-y-1 hover:border-[#9146FF]/40 hover:shadow-xl">
                {event.image_url && <div className="relative h-36 overflow-hidden bg-surface-container-high"><div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url("${event.image_url.replaceAll('"', '%22')}")` }} /></div>}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#9146FF]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#c7a5ff]">{date}</span><span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-bold text-on-surface-variant">{event.registration_enabled ? copy.esport.event_registration : copy.esport.event_informational}</span></div>
                  <h3 className="font-headline text-xl font-bold text-on-surface group-hover:text-[#c7a5ff]">{event.title}</h3>
                  <p className="mt-2 line-clamp-4 whitespace-pre-line break-words text-sm leading-6 text-on-surface-variant">{event.description}</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-[#c7a5ff]">{copy.esport.event_details}<span aria-hidden="true" className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span></span>
                </div>
              </Link>;
            })}
          </div> : <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-8 text-center"><span aria-hidden="true" className="material-symbols-outlined text-3xl text-[#B98BFF]">sports_esports</span><p className="mt-3 text-sm text-on-surface-variant">{copy.esport.event_empty}</p></div>}
        </section>
      </div>
    </main>
  );
}
