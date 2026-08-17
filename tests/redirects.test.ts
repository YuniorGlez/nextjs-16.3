import { describe, expect, it } from "vitest";
import { computeRedirectMoves, type RedirectRow } from "@/lib/redirects";

describe("computeRedirectMoves", () => {
  it("no genera movimientos si el slug no cambia", () => {
    const moves = computeRedirectMoves("sobre-nosotros", "sobre-nosotros", []);
    expect(moves).toEqual({ inserts: [], updates: [] });
  });

  it("inserta una redirección simple al renombrar", () => {
    const moves = computeRedirectMoves("old-slug", "new-slug", []);
    expect(moves).toEqual({
      inserts: [{ from: "old-slug", to: "new-slug" }],
      updates: [],
    });
  });

  it("encadena: a→b y luego b→c deja a→c y crea b→c", () => {
    const existing: RedirectRow[] = [{ from: "a", to: "b" }];
    const moves = computeRedirectMoves("b", "c", existing);
    expect(moves.inserts).toEqual([{ from: "b", to: "c" }]);
    expect(moves.updates).toEqual([{ from: "a", to: "c" }]);
  });

  it("encadena varias filas que apuntaban al slug antiguo", () => {
    const existing: RedirectRow[] = [
      { from: "x", to: "b" },
      { from: "y", to: "b" },
    ];
    const moves = computeRedirectMoves("b", "c", existing);
    expect(moves.inserts).toEqual([{ from: "b", to: "c" }]);
    expect(moves.updates).toEqual([
      { from: "x", to: "c" },
      { from: "y", to: "c" },
    ]);
  });

  it("dedupe: ya existe from con el mismo destino → no hace nada", () => {
    const existing: RedirectRow[] = [{ from: "a", to: "b" }];
    const moves = computeRedirectMoves("a", "b", existing);
    expect(moves).toEqual({ inserts: [], updates: [] });
  });

  it("reescribe la fila existente si apuntaba a otro destino", () => {
    const existing: RedirectRow[] = [{ from: "a", to: "viejo" }];
    const moves = computeRedirectMoves("a", "nuevo", existing);
    expect(moves.inserts).toEqual([]);
    expect(moves.updates).toEqual([{ from: "a", to: "nuevo" }]);
  });

  it("ignora el auto-bucle (from === to)", () => {
    const moves = computeRedirectMoves("a", "a", [{ from: "b", to: "a" }]);
    expect(moves).toEqual({ inserts: [], updates: [] });
  });

  it("ignora slugs vacíos", () => {
    expect(computeRedirectMoves("", "b", [])).toEqual({
      inserts: [],
      updates: [],
    });
    expect(computeRedirectMoves("a", "", [])).toEqual({
      inserts: [],
      updates: [],
    });
  });

  it("colapsa los eslabones que apuntaban directamente al slug antiguo", () => {
    const existing: RedirectRow[] = [
      { from: "a", to: "b" },
      { from: "b", to: "c" },
    ];
    const moves = computeRedirectMoves("c", "d", existing);
    expect(moves.inserts).toEqual([{ from: "c", to: "d" }]);
    expect(moves.updates).toEqual([{ from: "b", to: "d" }]);
  });
});
