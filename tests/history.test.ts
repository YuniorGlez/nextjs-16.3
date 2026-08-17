import { describe, expect, it } from "vitest";
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "@/lib/history";

describe("history", () => {
  it("empieza sin undo ni redo", () => {
    const h = createHistory(1);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("undo restaura los estados previos en orden", () => {
    let h = createHistory("a");
    h = pushHistory(h, "b");
    h = pushHistory(h, "c");
    expect(h.present).toBe("c");
    h = undoHistory(h);
    expect(h.present).toBe("b");
    h = undoHistory(h);
    expect(h.present).toBe("a");
    expect(canUndo(h)).toBe(false);
  });

  it("redo reaplica en orden inverso al undo", () => {
    let h = createHistory(1);
    h = pushHistory(h, 2);
    h = pushHistory(h, 3);
    h = undoHistory(h);
    h = undoHistory(h);
    expect(h.present).toBe(1);
    expect(canRedo(h)).toBe(true);
    h = redoHistory(h);
    expect(h.present).toBe(2);
    h = redoHistory(h);
    expect(h.present).toBe(3);
    expect(canRedo(h)).toBe(false);
  });

  it("es no-op con historial vacío (no muta el estado)", () => {
    const h = createHistory("x");
    expect(undoHistory(h)).toBe(h);
    expect(redoHistory(h)).toBe(h);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("una mutación tras deshacer descarta el futuro", () => {
    let h = createHistory("a");
    h = pushHistory(h, "b");
    h = pushHistory(h, "c");
    h = undoHistory(h);
    expect(h.present).toBe("b");
    h = pushHistory(h, "d");
    expect(h.present).toBe("d");
    expect(canRedo(h)).toBe(false);
    h = undoHistory(h);
    expect(h.present).toBe("b");
  });

  it("respeta el límite de tamaño de la pila pasada", () => {
    let h = createHistory(0);
    for (let i = 1; i <= 10; i++) h = pushHistory(h, i, 3);
    expect(h.past).toHaveLength(3);
    expect(h.past).toEqual([7, 8, 9]);
    expect(h.present).toBe(10);
  });

  it("push de la misma referencia es no-op", () => {
    const initial = { a: 1 };
    let h = createHistory(initial);
    h = pushHistory(h, initial);
    expect(h.past).toHaveLength(0);
    expect(canUndo(h)).toBe(false);
  });

  it("push tras un estado nuevo guarda el presente en past", () => {
    let h = createHistory({ a: 1 });
    h = pushHistory(h, { a: 2 });
    h = pushHistory(h, { a: 3 });
    expect(h.past).toEqual([{ a: 1 }, { a: 2 }]);
    expect(h.present).toEqual({ a: 3 });
  });
});
