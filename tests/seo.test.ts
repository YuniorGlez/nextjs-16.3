import { describe, expect, it } from "bun:test";
import { normalizeSeoSettings, parseKeywords } from "@/lib/seo";

describe("normalizeSeoSettings", () => {
  it("devuelve campos vacíos cuando no hay datos", () => {
    expect(normalizeSeoSettings(undefined)).toEqual({
      title: "",
      description: "",
      keywords: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
    });
  });

  it("extrae y recorta los campos string", () => {
    const s = normalizeSeoSettings({
      title: "  Mi web  ",
      description: "Descripción",
      keywords: "a, b ,c",
      ogTitle: "Compartir",
      ogImage: "/og.png",
    });
    expect(s.title).toBe("Mi web");
    expect(s.description).toBe("Descripción");
    expect(s.keywords).toBe("a, b ,c");
    expect(s.ogTitle).toBe("Compartir");
    expect(s.ogImage).toBe("/og.png");
  });

  it("ignora tipos no string", () => {
    const s = normalizeSeoSettings({ title: 42, keywords: ["a"], ogImage: null });
    expect(s.title).toBe("");
    expect(s.keywords).toBe("");
    expect(s.ogImage).toBe("");
  });
});

describe("parseKeywords", () => {
  it("divide por comas y filtra vacíos", () => {
    expect(parseKeywords("a, b ,, c ")).toEqual(["a", "b", "c"]);
    expect(parseKeywords("")).toEqual([]);
  });
});
