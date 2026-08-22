import { describe, expect, it } from "bun:test";
import { escapeHtml, renderMarkdown, renderInline, sanitizeUrl } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("convierte negrita", () => {
    expect(renderMarkdown("Hola **mundo**")).toContain("<strong>mundo</strong>");
  });

  it("convierte cursiva", () => {
    expect(renderMarkdown("Hola *mundo*")).toContain("<em>mundo</em>");
  });

  it("convierte enlaces válidos", () => {
    const html = renderMarkdown("Visita [Google](https://google.com)");
    expect(html).toContain('<a href="https://google.com">Google</a>');
  });

  it("permite mailto, anclas y rutas relativas", () => {
    expect(renderMarkdown("[Mail](mailto:hola@x.com)")).toContain(
      '<a href="mailto:hola@x.com">Mail</a>'
    );
    expect(renderMarkdown("[Ancla](#contacto)")).toContain('<a href="#contacto">Ancla</a>');
    expect(renderMarkdown("[Relativa](/contacto)")).toContain('<a href="/contacto">Relativa</a>');
  });

  it("convierte listas desordenadas", () => {
    expect(renderMarkdown("- uno\n- dos")).toBe("<ul><li>uno</li><li>dos</li></ul>");
  });

  it("convierte listas ordenadas", () => {
    expect(renderMarkdown("1. uno\n2. dos")).toBe("<ol><li>uno</li><li>dos</li></ol>");
  });

  it("separa párrafos por línea en blanco y convierte saltos simples en <br />", () => {
    expect(renderMarkdown("Línea 1\nLínea 2\n\nPárrafo 2")).toBe(
      "<p>Línea 1<br />Línea 2</p>\n<p>Párrafo 2</p>"
    );
  });

  it("escapa HTML crudo y lo muestra como texto", () => {
    const html = renderMarkdown("<b>hola</b>");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;hola&lt;/b&gt;");
  });

  it("neutraliza <script> inyectado (no ejecutable)", () => {
    const html = renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain("&lt;script&gt;");
  });

  it("bloquea javascript: en URLs", () => {
    const html = renderMarkdown("[x](javascript:alert(1))");
    expect(html).not.toContain("<a");
    expect(html).toContain("[x](javascript:alert(1))");
  });

  it("bloquea data: en URLs", () => {
    const html = renderMarkdown("[x](data:text/html;base64,PHNjcmlwdD4=)");
    expect(html).not.toContain("<a");
    expect(html).toContain("data:text/html");
  });

  it("mantiene texto plano sin cambios", () => {
    expect(renderMarkdown("Hola mundo, esto es texto plano")).toBe(
      "<p>Hola mundo, esto es texto plano</p>"
    );
  });

  it("aplica markdown inline dentro de listas", () => {
    expect(renderMarkdown("- **negrita**\n- [enlace](https://x.com)")).toBe(
      '<ul><li><strong>negrita</strong></li><li><a href="https://x.com">enlace</a></li></ul>'
    );
  });

  it("los asteriscos sin cerrar se muestran como texto", () => {
    expect(renderMarkdown("3 * 4")).toBe("<p>3 * 4</p>");
  });

  it("no interpreta un año como lista ordenada", () => {
    expect(renderMarkdown("2024. Madrid")).toBe("<p>2024. Madrid</p>");
  });

  it("soporta negrita y cursiva combinadas", () => {
    expect(renderMarkdown("***énfasis***")).toBe("<p><strong><em>énfasis</em></strong></p>");
  });

  it("devuelve cadena vacía para entrada vacía", () => {
    expect(renderMarkdown("")).toBe("");
    expect(renderMarkdown("   ")).toBe("");
  });
});

describe("renderInline", () => {
  it("anida un enlace dentro de negrita", () => {
    expect(renderInline("**[enlace](https://x.com)**")).toBe(
      '<strong><a href="https://x.com">enlace</a></strong>'
    );
  });
});

describe("sanitizeUrl", () => {
  it("rechaza protocolos peligrosos", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("JaVaScRiPt:alert(1)")).toBeNull();
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBeNull();
    expect(sanitizeUrl("file:///etc/passwd")).toBeNull();
    expect(sanitizeUrl("https://x.com/a b")).toBeNull();
    expect(sanitizeUrl("")).toBeNull();
  });

  it("permite http(s), mailto, # y /", () => {
    expect(sanitizeUrl("https://x.com")).toBe("https://x.com");
    expect(sanitizeUrl("http://x.com")).toBe("http://x.com");
    expect(sanitizeUrl("mailto:a@b.c")).toBe("mailto:a@b.c");
    expect(sanitizeUrl("#contacto")).toBe("#contacto");
    expect(sanitizeUrl("/ruta/relativa")).toBe("/ruta/relativa");
  });
});

describe("escapeHtml", () => {
  it("escapa los caracteres HTML", () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
  });
});
