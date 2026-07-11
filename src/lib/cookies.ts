"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "cookie-consent";

export type CookieConsent = "accepted" | "rejected" | null;

function readConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  window.addEventListener("cookie-consent-change", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener("cookie-consent-change", listener);
  };
}

function getSnapshot(): CookieConsent {
  return readConsent();
}

function getServerSnapshot(): CookieConsent {
  return null;
}

function writeConsent(value: Exclude<CookieConsent, null>) {
  localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(
    new CustomEvent("cookie-consent-change", { detail: value }),
  );
}

export function useCookieConsent() {
  const consent = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const accept = useCallback(() => writeConsent("accepted"), []);
  const reject = useCallback(() => writeConsent("rejected"), []);

  return { consent, loaded: true, accept, reject };
}
