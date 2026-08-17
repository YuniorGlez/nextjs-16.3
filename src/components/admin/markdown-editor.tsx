"use client";

import { useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

// Editor de la sección «Texto» del CMS: textarea con toolbar de markdown
// ligero (negrita, cursiva, enlace, listas) y previsualización en vivo del
// HTML sanitizado (renderMarkdown de @/lib/markdown).

type Tab = "escribir" | "preview";

const toolCls =
  "rounded-md border border-white/15 bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-400";
const tabCls = (active: boolean) =>
  active
    ? "rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400"
    : "rounded-md px-2.5 py-1 text-xs font-semibold text-zinc-500 transition hover:text-zinc-300";

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [tab, setTab] = useState<Tab>("escribir");
  const taRef = useRef<HTMLTextAreaElement>(null);

  /** Inserta `prefix`+`suffix` alrededor de la selección (o un placeholder). */
  function applySyntax(prefix: string, suffix: string, hint: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = value.slice(s, e);
    const insert = selected ? prefix + selected + suffix : prefix + hint + suffix;
    onChange(value.slice(0, s) + insert + value.slice(e));
    requestAnimationFrame(() => {
      ta.focus();
      const from = s + prefix.length;
      const to = selected ? from + selected.length : from + hint.length;
      ta.setSelectionRange(from, to);
    });
  }

  /** Inserta un enlace `[texto](https://)` dejando la URL seleccionada. */
  function applyLink() {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = value.slice(s, e);
    const label = selected || "texto del enlace";
    const insert = `[${label}](https://)`;
    onChange(value.slice(0, s) + insert + value.slice(e));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + label.length + 2, s + insert.length - 1);
    });
  }

  /** Prefija cada línea de la selección con el marcador de lista. */
  function applyList(marker: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = value.slice(s, e);
    if (selected) {
      const prefixed = selected
        .split("\n")
        .map((l) => marker + l)
        .join("\n");
      onChange(value.slice(0, s) + prefixed + value.slice(e));
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(s, s + prefixed.length);
      });
    } else {
      onChange(value.slice(0, s) + marker + value.slice(e));
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(s + marker.length, s + marker.length);
      });
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/15 bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-zinc-900/70 px-2 py-1.5">
        <div className="flex gap-1">
          <button type="button" className={tabCls(tab === "escribir")} onClick={() => setTab("escribir")}>
            Escribir
          </button>
          <button type="button" className={tabCls(tab === "preview")} onClick={() => setTab("preview")}>
            Previsualizar
          </button>
        </div>
        {tab === "escribir" && (
          <div className="flex flex-wrap gap-1">
            <button type="button" className={toolCls} title="Negrita (**texto**)" onClick={() => applySyntax("**", "**", "texto en negrita")}>
              <b>B</b>
            </button>
            <button type="button" className={toolCls} title="Cursiva (*texto*)" onClick={() => applySyntax("*", "*", "texto en cursiva")}>
              <i>I</i>
            </button>
            <button type="button" className={toolCls} title="Enlace ([texto](url))" onClick={applyLink}>
              🔗
            </button>
            <button type="button" className={toolCls} title="Lista con viñetas" onClick={() => applyList("- ")}>
              • Lista
            </button>
            <button type="button" className={toolCls} title="Lista numerada" onClick={() => applyList("1. ")}>
              1. Lista
            </button>
          </div>
        )}
      </div>
      {tab === "escribir" ? (
        <textarea
          ref={taRef}
          className="min-h-24 w-full resize-y bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="min-h-24 px-3 py-2">
          {value.trim() ? (
            <div
              className="markdown text-sm text-zinc-300"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          ) : (
            <p className="text-xs text-zinc-600">Sin contenido que previsualizar.</p>
          )}
        </div>
      )}
    </div>
  );
}
