import { describe, expect, it } from "vitest";
import migration, { normalizePageState, publishPageState } from "./0002_page_drafts";

describe("migración de borradores", () => {
  it("es aditiva y copia el esquema legacy al estado inicial", () => {
    expect(migration.version).toBe(2);
    expect(migration.statements.some((sql) => sql.includes("ADD COLUMN IF NOT EXISTS draft_content"))).toBe(true);
    const state = normalizePageState({ slug: "inicio", name: "Inicio", visible: true, seo: { title: "v1" }, content: { body: "v1" }, layout: [] });
    expect(state.draft.content).toEqual({ body: "v1" });
    expect(state.published.content).toEqual({ body: "v1" });
  });

  it("publicar toma exclusivamente el borrador", () => {
    const state = normalizePageState({
      slug: "viejo", name: "Viejo", seo: {}, content: { body: "publicado" }, layout: [],
      draft_slug: "nuevo", draft_name: "Nuevo", draft_content: { body: "borrador" }, draft_layout: [],
      published_slug: "viejo", published_name: "Viejo", published_content: { body: "publicado" }, published_layout: [],
    });
    expect(publishPageState(state).content).toEqual({ body: "borrador" });
    expect(publishPageState(state).slug).toBe("nuevo");
  });
});
