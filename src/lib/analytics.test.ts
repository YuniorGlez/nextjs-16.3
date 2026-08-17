import { describe, expect, it } from "vitest";
import {
  ANALYTICS_EVENTS,
  normalizeAnalyticsSettings,
  sanitizeEventParams,
  sanitizeMeasurementId,
} from "@/lib/analytics";

describe("configuración de Google Analytics", () => {
  it("acepta únicamente measurement IDs GA4 válidos", () => {
    expect(sanitizeMeasurementId("G-ABC123")).toBe("G-ABC123");
    expect(sanitizeMeasurementId(" UA-12345 ")).toBeNull();
    expect(sanitizeMeasurementId("G-<script>")).toBeNull();
  });

  it("respeta aceptación, rechazo y el consentimiento por defecto", async () => {
    const { hasAnalyticsConsent } = await import("@/lib/analytics");
    expect(hasAnalyticsConsent(null, false)).toBe(false);
    expect(hasAnalyticsConsent("rejected", true)).toBe(false);
    expect(hasAnalyticsConsent("accepted", false)).toBe(true);
    expect(hasAnalyticsConsent(null, true)).toBe(true);
  });

  it("normaliza configuración inválida a GA deshabilitado", () => {
    expect(normalizeAnalyticsSettings({ enabled: true, measurementId: "UA-1" })).toEqual({
      enabled: false,
      measurementId: "",
      consentDefault: false,
    });
    expect(normalizeAnalyticsSettings({ enabled: true, measurementId: "G-ABC", consentDefault: true })).toEqual({
      enabled: true,
      measurementId: "G-ABC",
      consentDefault: true,
    });
  });
});

describe("eventos de analytics", () => {
  it("permite solo eventos definidos y elimina PII y claves peligrosas", () => {
    expect(sanitizeEventParams("contact_submit", {
      email: "persona@example.com",
      phone: "600000000",
      name: "Ana",
      page_location: "https://example.com/contact?email=persona@example.com#form",
      form_id: "contacto",
      send_to: "evil",
    })).toEqual({ page_location: "https://example.com/contact", form_id: "contacto" });
    expect(sanitizeEventParams("unknown_event", { form_id: "x" })).toBeNull();
    expect(ANALYTICS_EVENTS).toContain("page_view");
  });
});

it("limita valores y cantidad de parámetros", () => {
  const params = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, "x".repeat(300)]));
  const clean = sanitizeEventParams("cta_click", params);
  expect(Object.keys(clean ?? {})).toHaveLength(10);
  expect(clean?.k0).toHaveLength(100);
});
