#!/bin/bash
# Verifica las 3 capas de protección SEO anti-indexación.
# Uso: ./scripts/check-seo-blocking.sh <url> [production-host]
# Ej:  ./scripts/check-seo-blocking.sh https://my-app.vercel.app
# Ej:  ./scripts/check-seo-blocking.sh https://example.com example.com
#
# Si no se pasa el segundo argumento, se toma de la variable de entorno
# NEXT_PUBLIC_SITE_URL (extrayendo el host) o de src/lib/site.ts.

URL="${1:?Uso: $0 <url> [production-host]}"
HOST=$(echo "$URL" | sed -E 's|https?://||' | sed 's|/.*||')

# Determinar el host de producción
if [ -n "$2" ]; then
  PRODUCTION_HOST="$2"
elif [ -n "$NEXT_PUBLIC_SITE_URL" ]; then
  PRODUCTION_HOST=$(echo "$NEXT_PUBLIC_SITE_URL" | sed -E 's|https?://||' | sed 's|/.*||')
else
  PRODUCTION_HOST=$(grep 'productionHost:' src/lib/site.ts 2>/dev/null | sed -E 's/.*"([^"]+)".*/\1/' || echo "")
fi

if [ -z "$PRODUCTION_HOST" ]; then
  echo "ERROR: No se pudo determinar el host de producción."
  echo "Pásalo como segundo argumento o define NEXT_PUBLIC_SITE_URL."
  exit 1
fi

echo "═══════════════════════════════════════════════════════════"
echo "  Verificación SEO para: $URL"
echo "  Host:                  $HOST"
echo "  Host de producción:    $PRODUCTION_HOST"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Determinar si esperamos bloqueo (no-prod) o indexación (prod)
if [ "$HOST" = "$PRODUCTION_HOST" ]; then
  EXPECTING="index"
  echo "  Modo: PRODUCCIÓN (esperamos indexación permitida)"
else
  EXPECTING="noindex"
  echo "  Modo: NO-PRODUCCIÓN (esperamos indexación bloqueada)"
fi
echo ""

PASS=0
FAIL=0

# ─── Capa 1: X-Robots-Tag (header HTTP) ───────────────────
echo "── Capa 1: X-Robots-Tag (header HTTP) ──────────────────"
ROBOTS_HEADER=$(curl -sI "$URL" 2>/dev/null | grep -i "x-robots-tag" | tr -d '\r' || echo "")

if [ "$EXPECTING" = "noindex" ]; then
  if echo "$ROBOTS_HEADER" | grep -qi "noindex"; then
    echo "  ✅ PASS — Header: $ROBOTS_HEADER"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL — No se encontró X-Robots-Tag: noindex"
    [ -n "$ROBOTS_HEADER" ] && echo "         Header encontrado: $ROBOTS_HEADER"
    FAIL=$((FAIL + 1))
  fi
else
  if echo "$ROBOTS_HEADER" | grep -qi "noindex"; then
    echo "  ❌ FAIL — En producción no debería haber X-Robots-Tag: noindex"
    echo "         Header encontrado: $ROBOTS_HEADER"
    FAIL=$((FAIL + 1))
  else
    echo "  ✅ PASS — Sin header noindex (correcto para producción)"
    PASS=$((PASS + 1))
  fi
fi
echo ""

# ─── Capa 2: robots.txt ───────────────────────────────────
echo "── Capa 2: robots.txt ──────────────────────────────────"
ROBOTS_TXT=$(curl -s "${URL}/robots.txt" 2>/dev/null || echo "")

if [ "$EXPECTING" = "noindex" ]; then
  if echo "$ROBOTS_TXT" | grep -qi "disallow: /"; then
    echo "  ✅ PASS — robots.txt bloquea con Disallow: /"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL — robots.txt NO bloquea"
    echo "         Contenido:"
    echo "$ROBOTS_TXT" | sed 's/^/         /'
    FAIL=$((FAIL + 1))
  fi
else
  if echo "$ROBOTS_TXT" | grep -qi "allow: /"; then
    echo "  ✅ PASS — robots.txt permite indexación (Allow: /)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL — robots.txt no permite indexación"
    echo "         Contenido:"
    echo "$ROBOTS_TXT" | sed 's/^/         /'
    FAIL=$((FAIL + 1))
  fi
fi
echo ""

# ─── Capa 3: meta robots (HTML) ───────────────────────────
echo "── Capa 3: <meta name=\"robots\"> (HTML) ────────────────"
META_ROBOTS=$(curl -s "$URL" 2>/dev/null | grep -io '<meta name="robots"[^>]*>' || echo "")

if [ "$EXPECTING" = "noindex" ]; then
  if echo "$META_ROBOTS" | grep -qi "noindex"; then
    echo "  ✅ PASS — Meta tag: $META_ROBOTS"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL — No se encontró <meta name=\"robots\" content=\"noindex\">"
    [ -n "$META_ROBOTS" ] && echo "         Meta encontrado: $META_ROBOTS"
    FAIL=$((FAIL + 1))
  fi
else
  if echo "$META_ROBOTS" | grep -qi "noindex"; then
    echo "  ❌ FAIL — En producción no debería tener noindex"
    echo "         Meta encontrado: $META_ROBOTS"
    FAIL=$((FAIL + 1))
  else
    echo "  ✅ PASS — Sin noindex en meta tag (correcto para producción)"
    [ -n "$META_ROBOTS" ] && echo "         Meta: $META_ROBOTS"
    PASS=$((PASS + 1))
  fi
fi
echo ""

# ─── Resumen ──────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "  Resultado: $PASS pasaron, $FAIL fallaron de 3 capas"
if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ TODAS LAS CAPAS OK"
else
  echo "  ❌ HAY CAPAS FALLANDO — revisar arriba"
fi
echo "═══════════════════════════════════════════════════════════"

exit $FAIL