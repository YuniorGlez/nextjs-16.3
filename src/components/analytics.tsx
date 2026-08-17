"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useCookieConsent } from "@/lib/cookies";
import { hasAnalyticsConsent, normalizeAnalyticsSettings, sanitizeEventParams, type AnalyticsEventName, type AnalyticsSettings } from "@/lib/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    __analyticsConsent?: boolean;
  }
}

export function GoogleAnalytics({ settings }: { settings: AnalyticsSettings }) {
  const { consent } = useCookieConsent();
  const config = normalizeAnalyticsSettings(settings);
  const consentGranted = hasAnalyticsConsent(consent, config.consentDefault);
  const canLoad = config.enabled && consentGranted;

  useEffect(() => {
    window.__analyticsConsent = canLoad;
    if (typeof window.gtag === "function") {
      const storage = consent === "accepted" ? "granted" : "denied";
      window.gtag("consent", "update", {
        ad_storage: storage,
        analytics_storage: storage,
        ad_user_data: storage,
        ad_personalization: storage,
      });
    }
  }, [canLoad, consent]);

  if (!canLoad) return null;

  const id = JSON.stringify(config.measurementId);
  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('consent','default',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});window.gtag('config',${id},{send_page_view:true});`}
      </Script>
    </>
  );
}

export function trackEvent(
  name: AnalyticsEventName,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || window.__analyticsConsent !== true) return;
  if (typeof window.gtag !== "function") return;
  const clean = sanitizeEventParams(name, params);
  if (!clean) return;
  window.gtag("event", name, clean);
}
