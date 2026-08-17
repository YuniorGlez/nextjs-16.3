import { describe, expect, it, vi } from "vitest";
import { runTransaction } from "@/lib/transactions";

describe("transacciones de escritura", () => {
  it("envía las queries agrupadas y ejecuta el post-commit después", async () => {
    const committed: string[] = [];
    const runner = vi.fn(async (queries: readonly string[]) => {
      committed.push("commit");
      return queries.map((query) => ({ query }));
    });

    const result = await runTransaction(runner, ["snapshot", "page", "prune"], async () => {
      committed.push("invalidate");
    });

    expect(runner).toHaveBeenCalledWith(["snapshot", "page", "prune"]);
    expect(result).toEqual([{ query: "snapshot" }, { query: "page" }, { query: "prune" }]);
    expect(committed).toEqual(["commit", "invalidate"]);
  });

  it("no ejecuta invalidaciones si la transacción hace rollback", async () => {
    const invalidate = vi.fn();
    const runner = vi.fn(async () => {
      throw new Error("query failed");
    });

    await expect(runTransaction(runner, ["write"], invalidate)).rejects.toThrow("query failed");
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("mantiene el orden de las queries para el commit HTTP de Neon", async () => {
    const seen: readonly string[][] = [];
    const runner = async (queries: readonly string[]) => {
      (seen as string[][]).push([...queries]);
      return [];
    };

    await runTransaction(runner, ["truncate", "category", "item"]);
    expect(seen).toEqual([["truncate", "category", "item"]]);
  });
});