export const ANALYTICS_EVENTS = [
  "page_view",
  "generate_lead",
  "contact_submit",
  "cta_click",
  "form_start",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsSettings = {
  enabled: boolean;
  measurementId: string;
  consentDefault: boolean;
};

const MEASUREMENT_ID_RE = /^G-[A-Z0-9]+$/i;
const PARAM_KEY_RE = /^[a-z][a-z0-9_]{0,39}$/;
const PII_KEY_RE = /(?:^|_|-)(?:email|e-mail|phone|tel|telephone|name|nombre|apellido|address|direccion|message|mensaje|user_id|client_id|ip|cookie|password|token|secret)(?:$|_|-)/i;
const BLOCKED_KEYS = new Set([
  "send_to",
  "event_callback",
  "event_timeout",
  "user_data",
  "user_properties",
  "gtag",
]);
const MAX_PARAMS = 10;
const MAX_STRING_LENGTH = 100;

export function sanitizeMeasurementId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return MEASUREMENT_ID_RE.test(id) ? id : null;
}

export function normalizeAnalyticsSettings(value: unknown): AnalyticsSettings {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const measurementId = sanitizeMeasurementId(input.measurementId);
  return {
    enabled: input.enabled === true && measurementId !== null,
    measurementId: measurementId ?? "",
    consentDefault: input.consentDefault === true,
  };
}

function sanitizeUrl(value: string): string | null {
  try {
    const url = new URL(value, typeof window === "undefined" ? "https://invalid.local" : window.location.origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function sanitizeEventParams(
  name: string,
  params: Record<string, unknown> | undefined,
): Record<string, string | number | boolean> | null {
  if (!(ANALYTICS_EVENTS as readonly string[]).includes(name)) return null;
  if (!params || typeof params !== "object") return {};

  const clean: Record<string, string | number | boolean> = {};
  for (const [key, raw] of Object.entries(params)) {
    if (Object.keys(clean).length >= MAX_PARAMS) break;
    if (!PARAM_KEY_RE.test(key) || BLOCKED_KEYS.has(key) || PII_KEY_RE.test(key)) continue;
    if (key === "page_location") {
      if (typeof raw === "string") {
        const url = sanitizeUrl(raw);
        if (url) clean[key] = url;
      }
      continue;
    }
    if (typeof raw === "string") clean[key] = raw.slice(0, MAX_STRING_LENGTH);
    else if (typeof raw === "number" && Number.isFinite(raw)) clean[key] = raw;
    else if (typeof raw === "boolean") clean[key] = raw;
  }
  return clean;
}

export function hasAnalyticsConsent(consent: "accepted" | "rejected" | null, consentDefault: boolean): boolean {
  return consent === "accepted" || (consent === null && consentDefault === true);
}

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

export const ANALYTICS_LIMITS = { maxParams: MAX_PARAMS, maxStringLength: MAX_STRING_LENGTH } as const;
