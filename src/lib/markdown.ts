// Markdown ligero y seguro para la sección «Texto» del CMS.
//
// Módulo plano (sin "use client" ni imports de servidor): puede usarse tanto
// en server components (render público) como en client components (preview
// del editor admin).
//
// Estrategia de seguridad: primero se escapa TODO el HTML de entrada
// (& < > " ') y después se aplican los patrones markdown sobre el texto ya
// escapado. Así, cualquier HTML crudo (<script>, <img onerror>, ...) queda
// inertizado como texto y el parser solo puede emitir un conjunto fijo de
// etiquetas seguras: <p>, <br />, <strong>, <em>, <a>, <ul>, <ol>, <li>.
// Las URLs de enlaces se validan con una allowlist (sanitizeUrl): solo
// http(s):, mailto:, #ancla y /ruta-relativa; el resto se muestra como texto
// plano. Lo que no se reconoce como markdown se muestra literalmente.

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapa los caracteres que podrían formar HTML/atributos. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

/**
 * Valida una URL para usarla en href. Devuelve la URL normalizada o null si
 * no es segura (protocolos peligrosos, whitespace interno, protocolos
 * desconocidos). Allowlist: http(s)://, mailto:, #ancla, /ruta-relativa.
 */
export function sanitizeUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  // Rechaza whitespace interno: impide romper el atributo y URLs inválidas.
  if (/\s/.test(url)) return null;
  if (/^(https?:\/\/)/i.test(url)) return url;
  if (/^mailto:/i.test(url)) return url;
  if (url.startsWith("#") || url.startsWith("/")) return url;
  return null;
}

const UL_RE = /^(\s*)[-*]\s+(.*)$/;
const OL_RE = /^(\s*)\d{1,3}[.)]\s+(.*)$/;

function isListStart(line: string): boolean {
  return UL_RE.test(line) || OL_RE.test(line);
}

/**
 * Intenta parsear un enlace `[texto](url)` en la posición `start`.
 * Devuelve el HTML emitido y la posición siguiente, o null si no es un
 * enlace (entonces se muestra como texto plano).
 */
function tryLink(
  text: string,
  start: number
): { html: string; next: number } | null {
  const close = text.indexOf("]", start + 1);
  if (close === -1 || text[close + 1] !== "(") return null;
  // Escanea hasta el paréntesis de cierre balanceado (soporta URLs con
  // paréntesis anidados, p.ej. Wikipedia).
  let depth = 1;
  let j = close + 2;
  while (j < text.length && depth > 0) {
    if (text[j] === "(") depth++;
    else if (text[j] === ")") depth--;
    j++;
  }
  if (depth > 0) return null;
  const label = text.slice(start + 1, close);
  const rawUrl = text.slice(close + 2, j - 1);
  const url = sanitizeUrl(rawUrl);
  if (url === null) return null;
  return { html: `<a href="${url}">${renderInline(label)}</a>`, next: j };
}

/**
 * Procesa el markdown inline (negrita, cursiva y enlaces) sobre texto ya
 * escapado. Soporta anidamiento simple: **negrita con *cursiva***,
 * **[enlace](url)** y [**negrita**](url).
 */
export function renderInline(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "*" && text[i + 1] === "*" && text[i + 2] === "*") {
      const end = text.indexOf("***", i + 3);
      if (end !== -1) {
        out += `<strong><em>${renderInline(text.slice(i + 3, end))}</em></strong>`;
        i = end + 3;
        continue;
      }
    } else if (ch === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        out += `<strong>${renderInline(text.slice(i + 2, end))}</strong>`;
        i = end + 2;
        continue;
      }
    } else if (ch === "*") {
      const end = text.indexOf("*", i + 1);
      if (end !== -1) {
        out += `<em>${renderInline(text.slice(i + 1, end))}</em>`;
        i = end + 1;
        continue;
      }
    } else if (ch === "[") {
      const link = tryLink(text, i);
      if (link) {
        out += link.html;
        i = link.next;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

/**
 * Convierte markdown ligero a HTML sanitizado.
 *
 * Soporta: **negrita**, *cursiva*, [texto](url), listas desordenadas
 * (- / *) y ordenadas (1. 2. …), párrafos separados por línea en blanco y
 * saltos de línea simples (→ <br />). Cualquier HTML crudo queda escapado
 * y las URLs inseguras se muestran como texto plano.
 */
export function renderMarkdown(src: string): string {
  const lines = escapeHtml(src).split(/\r?\n/);
  const blocks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    const ul = UL_RE.exec(line);
    const ol = OL_RE.exec(line);
    if (ul || ol) {
      const ordered = !ul;
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === "") break;
        const m = ordered ? OL_RE.exec(l) : UL_RE.exec(l);
        if (!m) break;
        items.push(m[2].trim());
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      blocks.push(
        `<${tag}>${items
          .map((it) => `<li>${renderInline(it)}</li>`)
          .join("")}</${tag}>`
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === "" || isListStart(l)) break;
      para.push(l.trim());
      i++;
    }
    blocks.push(
      `<p>${para.map((pl) => renderInline(pl)).join("<br />")}</p>`
    );
  }
  return blocks.join("\n");
}
