"use client";

import Script from "next/script";
import { useCookieConsent } from "@/lib/cookies";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const DEFAULT_CONSENT = process.env.NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT === "true";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export function GoogleAnalytics() {
  const { consent } = useCookieConsent();

  if (!GA_ID) return null;

  const enabled = DEFAULT_CONSENT || consent === "accepted";

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: '${enabled ? "granted" : "denied"}',
            analytics_storage: '${enabled ? "granted" : "denied"}',
            ad_user_data: '${enabled ? "granted" : "denied"}',
            ad_personalization: '${enabled ? "granted" : "denied"}',
          });
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}
      </Script>
      {consent !== null && (
        <Script id="ga-consent-update" strategy="afterInteractive">
          {`
            gtag('consent', 'update', {
              ad_storage: '${consent === "accepted" ? "granted" : "denied"}',
              analytics_storage: '${consent === "accepted" ? "granted" : "denied"}',
              ad_user_data: '${consent === "accepted" ? "granted" : "denied"}',
              ad_personalization: '${consent === "accepted" ? "granted" : "denied"}',
            });
          `}
        </Script>
      )}
    </>
  );
}

export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
