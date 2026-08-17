import { describe, expect, it } from "vitest";
import { buildPlan, parseConfig, runProvision, type ProvisionConfig } from "../scripts/provision-lib";

const config: ProvisionConfig = {
  project: {
    name: "Acme Café",
    shortName: "acme-cafe",
    description: "Sitio de Acme Café",
    url: "https://acme.example",
  },
};

describe("provisionamiento", () => {
  it("valida el contrato estricto y rechaza claves desconocidas", () => {
    expect(parseConfig(JSON.stringify(config))).toEqual(config);
    expect(() => parseConfig('{"project":{"name":"Acme","unexpected":true}}')).toThrow("project.unexpected");
  });

  it("construye un plan seguro sin seed implícito", () => {
    const plan = buildPlan(config, { migrate: true });
    expect(plan.actions.map(({ kind }) => kind)).toEqual(["write", "write", "migrate"]);
    expect(plan.actions.some(({ kind }) => kind === "seed")).toBe(false);
  });

  it("dry-run no escribe ni ejecuta comandos", async () => {
    const writes: string[] = [];
    const commands: string[] = [];
    const result = await runProvision(config, {
      cwd: "/repo",
      dryRun: true,
      fs: { exists: () => false, write: (path) => writes.push(path) },
      exec: (command) => {
        commands.push(command.join(" "));
        return 0;
      },
    });
    expect(result.status).toBe("dry-run");
    expect(writes).toEqual([]);
    expect(commands).toEqual([]);
  });

  it("dry-run puede planificar migraciones sin conexión", async () => {
    const result = await runProvision(config, { cwd: "/repo", dryRun: true, migrate: true, fs: { exists: () => false, write: () => undefined }, exec: () => 0 });
    expect(result.plan.actions.at(-1)?.kind).toBe("migrate");
  });

  it("exige --allow-seed cuando se solicita seed", async () => {
    await expect(runProvision(config, { cwd: "/repo", seed: true, fs: { exists: () => false, write: () => undefined }, exec: () => 0 })).rejects.toThrow(
      "--allow-seed",
    );
  });
});