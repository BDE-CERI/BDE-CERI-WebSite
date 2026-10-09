"use client";

import { useId, useSyncExternalStore } from "react";
import LoadingShark from "./LoadingShark";
import { useLoadingEstimate } from "../hooks/useLoadingEstimate";
import styles from "./PageLoadingScreen.module.css";

function subscribeLanguage(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  return () => observer.disconnect();
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const readEnglish = () => document.documentElement.lang === "en";
const readHidden = () => document.hidden;
const serverFalse = () => false;

export default function PageLoadingScreen({ routeKey }: { routeKey: string }) {
  const english = useSyncExternalStore(subscribeLanguage, readEnglish, serverFalse);
  const paused = useSyncExternalStore(subscribeVisibility, readHidden, serverFalse);
  const { progress, remainingMs, overdue, source } = useLoadingEstimate(routeKey);
  const titleId = useId();
  const progressId = useId();
  const displayedProgress = Math.floor(Math.min(95, Math.max(0, progress)));
  const copy = english ? {
    title: "Diving into the next page",
    subtitle: "Our little shark is on its way.",
    progress: "Estimated progress",
    remaining: "Estimated time remaining",
    moment: "Less than a second",
    calculating: "Estimating…",
    waiting: "A little longer than expected…",
    waitingHint: "The page is still loading. Thanks for your patience.",
    initial: "An initial estimate, refined as you browse.",
    history: "Based on your recent page loads.",
    loading: "Loading page.",
  } : {
    title: "On plonge dans la page",
    subtitle: "Notre petit requin arrive.",
    progress: "Progression estimée",
    remaining: "Temps restant estimé",
    moment: "Moins d’une seconde",
    calculating: "Estimation en cours…",
    waiting: "Un peu plus long que prévu…",
    waitingHint: "La page se charge encore. Merci de votre patience.",
    initial: "Une première estimation, affinée au fil des visites.",
    history: "D’après vos chargements récents.",
    loading: "Chargement de la page.",
  };
  const seconds = remainingMs === null ? null : Math.max(1, Math.ceil(remainingMs / 1000));
  const remaining = overdue
    ? copy.waiting
    : remainingMs === null ? copy.calculating : remainingMs < 1000 ? copy.moment : (english ? "About " : "Environ ") + seconds + " s";

  return (
    <section className={styles.screen} aria-labelledby={titleId} aria-busy="true"
      data-page-loading-screen={routeKey} data-paused={paused ? "true" : undefined}>
      <div className={styles.ambient} aria-hidden="true" />
      <p className={styles.brand} aria-hidden="true"><span /> BDE CERI</p>
      <div className={styles.content}>
        <div className={styles.intro}>
          <h2 id={titleId} className={styles.title}>{copy.title}</h2>
          <p className={styles.subtitle}>{copy.subtitle}</p>
        </div>
        <LoadingShark paused={paused} />
        <div className={styles.below}>
          <div className={styles.progressPanel}>
            <div className={styles.progressLabels}>
              <span id={progressId}>{copy.progress}</span>
              <span className={styles.percentage} aria-hidden="true">{displayedProgress}<span>%</span></span>
            </div>
            <div className={styles.track} role="progressbar" aria-labelledby={progressId}
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={displayedProgress}
              aria-valuetext={displayedProgress + " %. " + copy.remaining + " : " + remaining}>
              <div className={styles.fill} style={{ transform: "scaleX(" + Math.min(95, Math.max(0, progress)) / 100 + ")" }} />
            </div>
            <div className={styles.time} aria-live="off">
              <span className={styles.clock} aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" /><path d="M10 5.8V10l2.8 1.6" /></svg>
              </span>
              <span className={styles.timeLabel}>{copy.remaining}</span>
              <span className={styles.remaining}>{remaining}</span>
            </div>
          </div>
          <p role="status" aria-live="polite" aria-atomic="true" className={styles.note}>
            {overdue ? copy.waitingHint : source === "history" ? copy.history : copy.initial}
            <span className={styles.srOnly}>{copy.loading}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
