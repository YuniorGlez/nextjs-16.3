# GA4 configurable por cliente

## Provisioning

1. Inicia sesión en `/admin` con un admin que tenga `analytics.manage` (superadmin y admin lo reciben por defecto).
2. Abre **Analytics**, introduce el Measurement ID de GA4 con formato `G-XXXXXXXXXX` y activa **Activar GA4**.
3. Mantén **Consentimiento por defecto** desactivado salvo que la base legal y la política de cookies del cliente permitan medir antes de una acción explícita. Con ese valor desactivado, el banner existente debe ser aceptado antes de cargar GA4.
4. Guarda y publica el despliegue habitual. No hace falta ejecutar una migración: la configuración vive en `settings.analytics` (JSONB).

La configuración pública contiene únicamente `enabled`, `measurementId` y `consentDefault`. Un ID inválido o una configuración desactivada dejan GA4 inactivo. La configuración se valida de nuevo en la Server Action y el registro de auditoría guarda solo la clave `analytics`, nunca el ID ni otros valores.

## Eventos

Usa `trackEvent` desde `@/components/analytics`:

```tsx
trackEvent("cta_click", { cta_id: "reservar" });
trackEvent("contact_submit", { form_id: "contact" });
```

Eventos permitidos: `page_view`, `generate_lead`, `contact_submit`, `cta_click` y `form_start`. Los nombres y parámetros se filtran, los valores se limitan y se rechazan claves de PII (email, teléfono, nombres, mensajes, identificadores, cookies y secretos). `page_location` se reduce a origen y pathname, sin query string ni hash. No envíes datos de formularios ni URLs con parámetros sensibles.

Rechazar o revocar el consentimiento impide nuevas cargas y eventos. La integración no añade ni sustituye el banner de consentimiento existente.

## CSP

La CSP de producción permite únicamente los endpoints de carga y envío de GA4 ya necesarios: `googletagmanager.com`, `google-analytics.com`, `analytics.google.com` y `region1.google-analytics.com`. No se habilitan dominios adicionales.

El fallback de `NEXT_PUBLIC_GA_ID` y `NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT` se conserva para instalaciones que todavía no tienen `settings.analytics`; la configuración guardada en el admin prevalece.

## Uso desde componentes

Añade eventos solo en acciones claras (por ejemplo, envío correcto de contacto o clic en un CTA), no globalmente en cada interacción. `trackEvent` no hace nada durante SSR, sin consentimiento, sin GA4 válido o antes de que gtag esté disponible.

## Seguridad y caché

`settings.analytics` no contiene secretos y puede viajar en la configuración pública cacheada. Los settings reservados (`ai` y `mensajes`) siguen fuera de esa respuesta. No se ejecuta DDL ni seed durante el provisioning.
