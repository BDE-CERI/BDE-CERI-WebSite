"use client";

import React, { useEffect, useState } from "react";
import SharkWallpaper from "@/components/SharkWallpaper";
import { en } from "@/locales/en";
import { fr } from "@/locales/fr";

export default function EsportClient({ lang }: { lang: "fr" | "en" }) {
  const copy = lang === "en" ? en : fr;
  const [hostname, setHostname] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("bdeceri"); // Default channel: OTP LoL (super popular French Esports channel)
  const [customChannelInput, setCustomChannelInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
    }
  }, []);

  const handleChannelChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customChannelInput.trim()) {
      setSelectedChannel(customChannelInput.trim().toLowerCase());
      setCustomChannelInput("");
    }
  };

  const formattedTwitchUrl = hostname
    ? `https://player.twitch.tv/?channel=${selectedChannel}&parent=${hostname}&parent=localhost&parent=127.0.0.1&parent=bdeceri.fr`
    : "";

  const formattedChatUrl = hostname
    ? `https://www.twitch.tv/embed/${selectedChannel}/chat?parent=${hostname}&parent=localhost&parent=127.0.0.1&parent=bdeceri.fr&darkpopout`
    : "";

  const defaultTournaments = [
    {
      id: 1,
      game: "Super Smash Bros. Ultimate",
      title: "CERI Smash Arena #4",
      date: { fr: "Vendredi 28 mai, 18 h", en: "Friday 28 May, 6 pm" },
      status: { fr: "Inscriptions ouvertes", en: "Registration open" },
      slots: { fr: "32 / 32 joueurs", en: "32 / 32 players" },
      color: "#FF5252",
    },
    {
      id: 2,
      game: "League of Legends",
      title: "Clash Inter-Promos 5v5",
      date: { fr: "Samedi 5 juin, 14 h", en: "Saturday 5 June, 2 pm" },
      status: { fr: "En attente", en: "Pending" },
      slots: { fr: "8 / 16 équipes", en: "8 / 16 teams" },
      color: "#448AFF",
    },
    {
      id: 3,
      game: "TrackMania",
      title: "CERI Cup Time Attack",
      date: { fr: "Mercredi 16 juin, 20 h", en: "Wednesday 16 June, 8 pm" },
      status: { fr: "Planifié", en: "Scheduled" },
      slots: { fr: "Places illimitées", en: "Unlimited places" },
      color: "#4caf50",
    },
  ];

  return (
    <div className="bg-surface min-h-screen relative overflow-hidden">
      <SharkWallpaper opacity={0.25} />

      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-tertiary/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-primary/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10 space-y-16">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-outline-variant/15 pb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-tertiary/20 bg-tertiary/5 text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              {copy.esport.live_badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-on-surface tracking-tight">
              CERI <span className="text-tertiary">eSport</span>
            </h1>
            <p className="max-w-2xl mt-4 text-on-surface-variant text-lg leading-relaxed font-body">
              {copy.esport.description}
            </p>
          </div>

          {/* Change stream controls */}
          <form onSubmit={handleChannelChange} className="flex gap-2 bg-surface-container-high/60 p-2 rounded-2xl border border-outline-variant/10 backdrop-blur-md max-w-sm w-full">
            <input
              type="text"
              placeholder={copy.esport.channel_placeholder}
              value={customChannelInput}
              onChange={(e) => setCustomChannelInput(e.target.value)}
              className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 text-sm text-on-surface px-3 py-2"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-tertiary hover:bg-tertiary/80 text-on-tertiary font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              {copy.esport.change_channel}
            </button>
          </form>
        </header>

        {/* Live Stream Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Video Stream Player */}
          <div className="lg:col-span-8 aspect-video w-full glass-panel rounded-3xl overflow-hidden border border-outline-variant/15 shadow-2xl relative bg-black">
            {formattedTwitchUrl ? (
              <iframe
                  title={`${copy.esport.live_badge} — ${selectedChannel}`}
                  src={formattedTwitchUrl}
                height="100%"
                width="100%"
                allowFullScreen
                className="w-full h-full border-none"
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant gap-3">
                <span className="material-symbols-outlined animate-spin">sync</span>
                <span>{copy.esport.loading_stream}</span>
              </div>
            )}
          </div>

          {/* Live Twitch Chat module (Only displayed on wider screens) */}
          <div className="lg:col-span-4 h-[400px] lg:h-auto w-full glass-panel rounded-3xl overflow-hidden border border-outline-variant/15 shadow-2xl bg-surface-container-low flex flex-col">
            <div className="p-4 border-b border-outline-variant/10 bg-surface-container-high/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm">chat</span>
                 <span className="text-xs font-bold uppercase tracking-wider text-on-surface">{copy.esport.live_chat}</span>
              </div>
              <span className="text-[10px] text-tertiary font-bold tracking-widest uppercase bg-tertiary/10 px-2 py-0.5 rounded">#{selectedChannel}</span>
            </div>

            <div className="flex-1 bg-surface-container-lowest">
              {formattedChatUrl ? (
                <iframe
                  src={formattedChatUrl}
                  height="100%"
                  width="100%"
                  className="w-full h-full border-none"
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  {copy.esport.loading_chat}
                </div>
              )}
            </div>
          </div>

        </section>

        {/* Esports Tournaments & Schedule */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-10">

          {/* Tournament Listings */}
          <div className="md:col-span-8 space-y-6">
            <h2 className="text-3xl font-headline font-bold text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary">emoji_events</span>
              {copy.esport.tournaments}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {defaultTournaments.map((t) => (
                <div
                  key={t.id}
                  className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low/40 hover:bg-surface-container-high/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: t.color, boxShadow: `0 0 15px ${t.color}30` }}
                    >
                      <span className="material-symbols-outlined">sports_esports</span>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: t.color }}>{t.game}</p>
                      <h4 className="text-lg font-headline font-bold text-on-surface mt-0.5 group-hover:text-primary transition-colors">{t.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                        {t.date[lang]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-outline-variant/10 pt-4 sm:pt-0">
                    <div className="text-left sm:text-right">
                       <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t.status[lang]}</p>
                       <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{copy.esport.registrations}</p>
                       <p className="text-xs font-bold text-on-surface">{t.slots[lang]}</p>
                    </div>
                    <button className="px-5 py-3 rounded-xl bg-surface-container-high hover:bg-tertiary hover:text-on-tertiary font-bold transition-all text-xs border border-outline-variant/10">
                       {copy.esport.register}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Esports Schedule / Team Info */}
          <div className="md:col-span-4 glass-panel p-8 rounded-3xl border border-outline-variant/10 bg-surface-container-low shadow-xl space-y-6">
            <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">military_tech</span>
              {copy.esport.league_title}
            </h3>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {copy.esport.league_description}
            </p>

            <div className="border-t border-outline-variant/10 pt-6 space-y-4">
              <div className="flex justify-between items-center text-xs">
                 <span className="font-medium text-on-surface-variant">{copy.esport.matches_won}</span>
                <span className="font-bold text-success">14</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="font-medium text-on-surface-variant">{copy.esport.matches_lost}</span>
                <span className="font-bold text-error">3</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="font-medium text-on-surface-variant">{copy.esport.national_ranking}</span>
                <span className="font-bold text-tertiary">#12 (Top 5%)</span>
              </div>
            </div>

            <button className="w-full mt-4 py-4 rounded-xl bg-tertiary text-on-tertiary font-bold transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              <span className="material-symbols-outlined text-sm">groups</span>
               {copy.esport.join_team}
            </button>
          </div>

        </section>

      </div>
    </div>
  );
}
