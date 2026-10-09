"use client";

import { useEffect, useState } from "react";

export type LoadingEstimateState = {
  progress: number;
  remainingMs: number | null;
  overdue: boolean;
  elapsedMs: number;
  source: "history" | "initial";
};

type Sample = { durationMs: number; recordedAt: number };
type ConnectionInfo = { effectiveType?: string; saveData?: boolean; rtt?: number };

const MIN_SAMPLE_MS = 500;
const MAX_SAMPLE_MS = 60_000;
const MAX_SAMPLES = 8;
const MAX_SAMPLE_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const activeLoads = new Map<string, Set<symbol>>();
const initialState: LoadingEstimateState = { progress: 0, remainingMs: null, overdue: false, elapsedMs: 0, source: "initial" };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function readSamples(routeKey: string): Sample[] {
  try {
    const raw = window.localStorage.getItem("bde-loading-samples:" + routeKey);
    const stored: unknown = raw ? JSON.parse(raw) : null;
    const now = Date.now();
    if (stored && typeof stored === "object" && "version" in stored && stored.version === 1 && "samples" in stored && Array.isArray(stored.samples)) {
      const samples = stored.samples.filter((sample: unknown): sample is Sample => {
        if (!sample || typeof sample !== "object" || !("durationMs" in sample) || !("recordedAt" in sample)) return false;
        return typeof sample.durationMs === "number" && Number.isFinite(sample.durationMs) && sample.durationMs >= MIN_SAMPLE_MS && sample.durationMs <= MAX_SAMPLE_MS &&
          typeof sample.recordedAt === "number" && Number.isFinite(sample.recordedAt) && sample.recordedAt <= now && now - sample.recordedAt <= MAX_SAMPLE_AGE_MS;
      });
      if (samples.length) return samples.slice(-MAX_SAMPLES);
    }
    // Reuse the smoothed duration recorded by the former LoadingEstimate component.
    const legacy = Number(window.localStorage.getItem("bde-loading-estimate:" + routeKey));
    if (Number.isFinite(legacy) && legacy >= MIN_SAMPLE_MS && legacy <= MAX_SAMPLE_MS) return [{ durationMs: legacy, recordedAt: now }];
  } catch {
    // Private browsing and disabled storage must never prevent the page from loading.
  }
  return [];
}

function estimateFromSamples(samples: Sample[]) {
  const sorted = samples.map(sample => sample.durationMs).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const recent = samples.slice(-4);
  let weighted = 0;
  let weights = 0;
  recent.forEach((sample, index) => {
    const weight = index + 1;
    weighted += clamp(sample.durationMs, median * 0.5, median * 2) * weight;
    weights += weight;
  });
  // The median limits the effect of an isolated slow load; recent samples adapt gradually.
  return Math.round(clamp(median * 0.7 + weighted / weights * 0.3, 1_200, 20_000));
}

function initialEstimate() {
  const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
  const durations: Record<string, number> = { "slow-2g": 10_000, "2g": 8_000, "3g": 5_000, "4g": 3_000 };
  let estimate = connection?.effectiveType ? durations[connection.effectiveType] ?? 4_000 : 4_000;
  if (connection?.saveData) estimate *= 1.2;
  if (typeof connection?.rtt === "number" && Number.isFinite(connection.rtt) && connection.rtt > 500) estimate += Math.min(connection.rtt, 2_000);
  return Math.round(clamp(estimate, 2_000, 12_000));
}

function snapshot(elapsedMs: number, estimateMs: number, source: LoadingEstimateState["source"]): LoadingEstimateState {
  const ratio = elapsedMs / estimateMs;
  const overdue = ratio >= 1;
  const progress = ratio < 1
    ? 90 * (1 - Math.pow(1 - ratio, 1.7))
    : 90 + 5 * (1 - Math.exp(-(elapsedMs - estimateMs) / Math.max(estimateMs * 2, 4_000)));
  return {
    progress: clamp(progress, 0, 95),
    remainingMs: overdue ? null : Math.max(500, Math.round(estimateMs - elapsedMs)),
    overdue,
    elapsedMs: Math.round(elapsedMs),
    source,
  };
}

function routeMatches(routeKey: string, initialUrl: string) {
  if (routeKey === "global") return window.location.pathname + window.location.search === initialUrl;
  const path = "/" + routeKey.replace(/^\/+|\/+$/g, "");
  return window.location.pathname === path || (path !== "/" && window.location.pathname.startsWith(path + "/"));
}

/**
 * Estimates the visible fallback's lifetime; it does not measure transferred bytes.
 * Only the real page removing its loading fallback ends the indicator.
 */
export function useLoadingEstimate(routeKey: string): LoadingEstimateState {
  const key = routeKey.trim() || "global";
  const [state, setState] = useState<{ key: string; value: LoadingEstimateState }>(() => ({ key, value: initialState }));

  useEffect(() => {
    const samples = readSamples(key);
    const source = samples.length ? "history" : "initial";
    const estimateMs = samples.length ? estimateFromSamples(samples) : initialEstimate();
    const startedAt = performance.now();
    const initialUrl = window.location.pathname + window.location.search;
    const token = Symbol(key);
    const instances = activeLoads.get(key) ?? new Set<symbol>();
    instances.add(token);
    activeLoads.set(key, instances);
    let timer: number | null = null;
    let disposed = false;
    let abandoned = false;
    let wasHidden = document.hidden;

    const stopTimer = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    };
    const update = () => {
      timer = null;
      if (disposed || document.hidden) return;
      setState({ key, value: snapshot(performance.now() - startedAt, estimateMs, source) });
      timer = window.setTimeout(update, 250);
    };
    const visibility = () => {
      stopTimer();
      if (document.hidden) {
        wasHidden = true;
        return;
      }
      // Recompute elapsed wall time on return without running background render timers.
      timer = window.setTimeout(update, 0);
    };
    const abandon = () => { abandoned = true; };
    const navigationClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (!["http:", "https:"].includes(destination.protocol)) return;
      if (destination.origin !== window.location.origin || destination.pathname + destination.search !== window.location.pathname + window.location.search) abandoned = true;
    };

    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("click", navigationClick, true);
    window.addEventListener("popstate", abandon);
    window.addEventListener("pagehide", abandon);
    if (!document.hidden) timer = window.setTimeout(update, 0);

    return () => {
      disposed = true;
      stopTimer();
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("click", navigationClick, true);
      window.removeEventListener("popstate", abandon);
      window.removeEventListener("pagehide", abandon);
      instances.delete(token);
      if (!instances.size) activeLoads.delete(key);
      const durationMs = performance.now() - startedAt;
      if (abandoned || wasHidden || document.hidden || durationMs < MIN_SAMPLE_MS || durationMs > MAX_SAMPLE_MS) return;
      // A cleanup can also mean StrictMode replay, cancellation or fallback replacement.
      // Wait until its DOM is removed and exclude another still-visible loading screen.
      queueMicrotask(() => {
        if (activeLoads.has(key) || document.hidden || !routeMatches(key, initialUrl) || document.querySelector("[data-page-loading-screen]")) return;
        const nextSamples = [...readSamples(key), { durationMs: Math.round(durationMs), recordedAt: Date.now() }].slice(-MAX_SAMPLES);
        try {
          window.localStorage.setItem("bde-loading-samples:" + key, JSON.stringify({ version: 1, samples: nextSamples }));
        } catch {
          // This optional timing history stays local; no requests or analytics are sent.
        }
      });
    };
  }, [key]);

  return state.key === key ? state.value : initialState;
}

export default useLoadingEstimate;
