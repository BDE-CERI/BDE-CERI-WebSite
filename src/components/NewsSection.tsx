"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  published_at: string;
  is_anonymous?: boolean;
  members?: {
    first_name: string;
    last_name: string;
    photo_url?: string;
  };
}

export default function NewsSection({ news, dict, isAdmin }: { news: NewsItem[], dict: any, isAdmin: boolean }) {
  const [bootState, setBootState] = useState<"off" | "booting" | "desktop" | "app-open">("off");
  const [selectedId, setSelectedId] = useState(news[0]?.id);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showChauffleetModal, setShowChauffleetModal] = useState(false);
  const [dontShowChauffleetAgain, setDontShowChauffleetAgain] = useState(false);

  useEffect(() => {
    if (bootState === "app-open") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [bootState]);

  if (!news || news.length === 0) return null;

  const selectedNews = news.find((n) => n.id === selectedId) || news[0];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handlePowerOn = () => {
    if (bootState === "off") {
      setBootState("booting");
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          setLoadingProgress(100);
          clearInterval(interval);
          setTimeout(() => setBootState("desktop"), 800);
        } else {
          setLoadingProgress(progress);
        }
      }, 150);
    }
  };

  const handleChauffleetClick = () => {
    const skip = localStorage.getItem("skipChauffleetWarning") === "true";
    if (skip) {
      window.open("https://chauffleet.com", "_blank");
    } else {
      setShowChauffleetModal(true);
    }
  };

  const confirmChauffleet = () => {
    if (dontShowChauffleetAgain) {
      localStorage.setItem("skipChauffleetWarning", "true");
    }
    window.open("https://chauffleet.com", "_blank");
    setShowChauffleetModal(false);
  };

  return (
    <section className="py-32 bg-surface-container-lowest relative z-10 transition-colors duration-500 overflow-hidden flex flex-col items-center">
      <div className="max-w-6xl w-full px-6">
        <header className="mb-12 text-center">
          <h2 className="text-[10px] font-bold text-tertiary uppercase tracking-[0.4em] mb-2">{dict.news.workstation_label}</h2>
          <h3 className="text-4xl font-headline font-bold text-on-surface tracking-tighter">
            {dict.news.workstation_title.split('&')[0]} <span className="text-tertiary">& {dict.news.workstation_title.split('&')[1]}</span>
          </h3>
        </header>

        {/* The Monitor Simulation */}
        <div className="relative mx-auto flex flex-col items-center group w-full">
          {/* Bezel */}
          <div className="relative bg-[#1a1a1a] p-1.5 md:p-3 rounded-[1.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/5 w-full max-w-7xl aspect-[16/9] flex flex-col scale-[1.02] overflow-hidden">

            {/* ROG Style Gravure (Behind the screen container) */}
            <div className="absolute inset-0 pointer-events-none opacity-5 select-none overflow-hidden">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-headline font-bold text-white whitespace-nowrap rotate-[-25deg] tracking-tighter mix-blend-overlay">
                BDE CERI BDE CERI BDE CERI
              </span>
            </div>

            {/* Screen Container */}
            <div className="flex-grow bg-black rounded-[0.75rem] overflow-hidden relative shadow-inner border border-black/50 z-10">
              {/* Screen Reflection Overlay (Subtle shine) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/[0.05] pointer-events-none z-20"></div>

              <div className={`absolute inset-0 transition-all ${bootState !== 'off' ? 'cursor-crosshair' : 'cursor-pointer'}`}>
                <AnimatePresence mode="wait">
                  {/* OFF STATE */}
                  {bootState === "off" && (
                    <motion.div
                      key="off"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black transition-colors"
                    >
                      <button
                        onClick={handlePowerOn}
                        className="group flex flex-col items-center gap-4 transition-all"
                      >
                        <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center group-hover:border-tertiary/50 group-hover:shadow-[0_0_30px_rgba(123,208,255,0.2)] transition-all">
                          <span className="material-symbols-outlined text-white/20 group-hover:text-tertiary transition-colors animate-pulse">power_settings_new</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-tertiary/80 transition-colors">{dict.news.start_terminal}</span>
                      </button>
                      {/* Screen Reflection */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/2 to-transparent pointer-events-none"></div>
                    </motion.div>
                  )}

                  {/* BOOTING STATE */}
                  {bootState === "booting" && (
                    <motion.div
                      key="booting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-8"
                      >
                        <span className="material-symbols-outlined text-8xl text-white">phiv_icon</span>
                        <h4 className="text-white font-mono text-center mt-2 tracking-widest font-bold">{dict.news.os_name || "BDE OS 2.0"}</h4>
                      </motion.div>
                      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-tertiary shadow-[0_0_10px_rgba(123,208,255,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingProgress}%` }}
                        ></motion.div>
                      </div>
                      <p className="mt-4 text-[9px] font-mono text-white/40 uppercase tracking-[0.3em]">{dict.news.initializing}</p>
                    </motion.div>
                  )}

                  {/* DESKTOP STATE */}
                  {bootState === "desktop" && (
                    <motion.div
                      key="desktop"
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-[#070d1f] flex flex-col"
                      style={{
                        backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")',
                        backgroundColor: 'var(--color-surface-container-lowest)'
                      }}
                    >
                      {/* Desktop Icons */}
                      <div className="p-8 grid grid-cols-1 gap-12 content-start w-32">
                        <button
                          onClick={() => setBootState("app-open")}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-all shadow-lg group-hover:scale-110">
                            <span className="material-symbols-outlined text-3xl">mail</span>
                          </div>
                          <span className="text-[10px] font-bold text-white/70 tracking-wide text-shadow-sm group-hover:text-white">CERIMail</span>
                        </button>

                        <button
                          onClick={handleChauffleetClick}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:bg-white/10 transition-all shadow-lg group-hover:scale-110 relative">
                            <Image src="/logos/chauffleet-logo.svg" alt="Chauffleet" fill className="object-contain p-3" sizes="32px" />
                          </div>
                          <span className="text-[10px] font-bold text-white/70 tracking-wide text-shadow-sm group-hover:text-white">Chauffleet</span>
                        </button>

                        <div className="flex flex-col items-center gap-2 opacity-50 cursor-not-allowed filter grayscale">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                            <span className="material-symbols-outlined text-3xl">folder</span>
                          </div>
                          <span className="text-[10px] font-bold text-white/50 tracking-wide">Documents</span>
                        </div>
                      </div>

                      {/* Taskbar */}
                      <div className="mt-auto h-12 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center px-4 gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                          <span className="material-symbols-outlined text-sm">grid_view</span>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-2"></div>
                        <div className="text-[10px] font-mono text-white/40 ml-auto">
                          {new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* APP OPEN (CERIMail) - INTERNAL MONITOR OVERLAY */}
                  {bootState === "app-open" && (
                    <motion.div
                      key="app-open"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", damping: 25, stiffness: 120 }}
                      className="absolute inset-0 z-50 bg-black flex flex-col"
                    >
                      <div className="w-full h-full flex flex-col bg-surface overflow-hidden">
                        {/* Window Header */}
                        <div className="h-10 bg-[#1a1a1a] flex items-center px-4 justify-between border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-sm">mail</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{dict.news.inbox}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setBootState("desktop")} className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-highest hover:bg-red-500/20 text-on-surface-variant hover:text-red-500 transition-all group/close">
                              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">{dict.news.exit}</span>
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        </div>

                        {/* Window Content (The Reader) */}
                        <div className="flex flex-grow overflow-hidden bg-surface">
                          {/* Sidebar Feed */}
                          <aside className="w-[30%] border-r border-outline-variant/10 flex flex-col bg-surface-container-low/30 overflow-y-auto custom-scrollbar">
                            {news.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`w-full text-left p-4 border-b border-outline-variant/5 transition-all relative group ${selectedId === item.id ? "bg-surface-container-high" : "hover:bg-surface-container-low"
                                  }`}
                              >
                                {selectedId === item.id && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
                                )}
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between opacity-50 text-[8px] font-bold">
                                    <span>{formatDate(item.published_at)}</span>
                                    {isAdmin && (
                                      <Link
                                        href={`/profil?tab=news&edit_id=${item.id}`}
                                        className="p-1 hover:bg-tertiary/20 rounded transition-colors text-tertiary stop-click-propagation"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <span className="material-symbols-outlined text-[10px]">edit</span>
                                      </Link>
                                    )}
                                  </div>
                                  <h4 className={`text-xs font-headline font-bold leading-tight ${selectedId === item.id ? "text-tertiary" : "text-on-surface"
                                    }`}>
                                    {item.title}
                                  </h4>
                                  <p className="text-[9px] text-on-surface-variant line-clamp-1 opacity-60 font-body">
                                    {item.content}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </aside>

                          {/* Main Content */}
                          <main className="flex-grow p-6 md:p-12 lg:p-16 overflow-y-auto custom-scrollbar bg-surface relative">
                            <div className="max-w-4xl mx-auto">
                              <header className="mb-12 pb-12 border-b border-outline-variant/10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-transform hover:scale-105 overflow-hidden">
                                      {selectedNews.is_anonymous ? (
                                        <span className="material-symbols-outlined text-2xl">visibility_off</span>
                                      ) : selectedNews.members?.photo_url ? (
                                        <div className="relative w-full h-full">
                                          <Image src={selectedNews.members.photo_url} alt="Auteur" fill className="object-cover" sizes="48px" />
                                        </div>
                                      ) : (
                                        <span className="material-symbols-outlined text-2xl">person</span>
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-bold text-on-surface">
                                          {selectedNews.is_anonymous ? dict.news.author_hidden : (selectedNews.members ? `${selectedNews.members.first_name} ${selectedNews.members.last_name}` : "BDE CERI")}
                                        </span>
                                        {!selectedNews.is_anonymous && (
                                          <span className="text-xs text-on-surface-variant opacity-60 italic">&lt;presse@bde-ceri.fr&gt;</span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{dict.news.to_members}</p>
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-mono opacity-50 bg-surface-container px-2 py-1 rounded border border-outline-variant/10">
                                    ID: {selectedNews.id.substring(0, 8)} — {formatDate(selectedNews.published_at)}
                                  </div>
                                </div>

                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-on-surface tracking-tight leading-[1.1] mb-2 selection:bg-tertiary selection:text-on-tertiary drop-shadow-sm">
                                  {selectedNews.title}
                                </h2>
                              </header>

                              <div className="article-body max-w-full overflow-hidden">
                                <div className="flex flex-col md:flex-row gap-8 lg:gap-14 items-start">
                                  {/* Left Column: Image */}
                                  {selectedNews.image_url && (
                                    <div className="w-full md:w-[35%] lg:w-[30%] flex-shrink-0 group">
                                      <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-outline-variant/10 aspect-[3/4]">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                                        <Image
                                          src={selectedNews.image_url}
                                          alt={selectedNews.title}
                                          fill
                                          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                          sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                        <div className="absolute bottom-4 left-4 right-4 z-20 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                          <p className="text-[10px] text-white font-bold uppercase tracking-wider drop-shadow-md">{dict.news.official_doc}</p>
                                        </div>
                                      </div>
                                      <p className="text-[10px] mt-4 text-on-surface-variant italic font-body opacity-60 text-center md:text-left">
                                        {dict.news.photo_credit}
                                      </p>
                                    </div>
                                  )}

                                  {/* Right Column: Text */}
                                  <div className="flex-grow min-w-0 text-lg md:text-xl font-body leading-[1.7] text-on-surface/90 selection:bg-tertiary selection:text-on-tertiary">
                                    <p className="first-letter:text-7xl md:first-letter:text-8xl first-letter:font-bold first-letter:text-tertiary first-letter:mr-4 first-letter:float-left first-letter:leading-[0.85] first-letter:font-headline whitespace-pre-wrap break-words pt-1">
                                      {selectedNews.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </main>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* EXTERNAL LINK MODAL (Simulated OS Dialog) */}
                <AnimatePresence>
                  {showChauffleetModal && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
                    >
                      <div className="w-full max-w-[320px] bg-surface-container-high rounded-xl border border-white/10 shadow-2xl p-6 overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-warning-container/20 flex items-center justify-center text-warning">
                            <span className="material-symbols-outlined">warning</span>
                          </div>
                          <h4 className="text-sm font-bold text-on-surface">{dict.news.external_link}</h4>
                        </div>

                        <p className="text-xs text-on-surface-variant leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: dict.news.external_warning }}>
                        </p>

                        <div className="space-y-4">
                          <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={dontShowChauffleetAgain}
                                onChange={(e) => setDontShowChauffleetAgain(e.target.checked)}
                                className="peer h-4 w-4 appearance-none rounded border border-outline-variant bg-surface-container transition-all checked:bg-tertiary checked:border-tertiary"
                              />
                              <span className="material-symbols-outlined absolute left-0 text-on-tertiary text-[12px] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">check</span>
                            </div>
                            <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">
                              {dict.news.dont_show_again}
                            </span>
                          </label>

                          <div className="flex gap-3">
                            <button
                              onClick={() => setShowChauffleetModal(false)}
                              className="flex-1 py-2 rounded-lg bg-surface-container-highest text-on-surface text-[11px] font-bold hover:bg-surface-variant transition-colors"
                            >
                              {dict.news.cancel}
                            </button>
                            <button
                              onClick={confirmChauffleet}
                              className="flex-1 py-2 rounded-lg bg-tertiary text-on-tertiary text-[11px] font-bold shadow-lg shadow-tertiary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              {dict.news.ok}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Controls / Badge */}
            <div className="h-10 mt-auto flex items-center justify-center px-4 relative">
              <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.5em]">{dict.news.footer_label || "BDE CERI — Avignon"}</span>

              {/* Partenariat AMD Sticker */}
              <div className="absolute right-0 bottom-[-10px] w-9 md:w-13 opacity-80 hover:opacity-100 transition-opacity pointer-events-none select-none">
                <Image
                  src="/logos/amd-ryzen-7-sticker.png"
                  alt="AMD Ryzen 7"
                  width={52}
                  height={52}
                  className="w-full h-auto drop-shadow-xl brightness-110"
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>

          {/* Modern PC Stand */}
          <div className="flex flex-col items-center -mt-1 relative z-0">
            {/* Stand neck */}
            <div className="w-16 md:w-20 h-16 md:h-24 bg-gradient-to-b from-[#1a1a1a] via-[#111] to-black shadow-inner border-x border-white/5 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
            </div>
            {/* Stand base */}
            <div className="w-48 md:w-64 h-3 md:h-4 bg-gradient-to-b from-[#2a2a2a] to-black rounded-t-lg shadow-[0_10px_20px_rgba(0,0,0,0.8)] border-t border-white/10 relative">
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 md:w-48 h-4 bg-black/50 blur-md rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Utility for custom bars */}
      <style jsx>{`
        .text-shadow-sm {
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
      `}</style>
    </section>
  );
}
