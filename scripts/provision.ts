import { readFileSync } from "node:fs";
import { parseConfig, runProvision, type ProvisionConfig } from "./provision-lib";

type CliOptions = { configPath?: string; dryRun: boolean; json: boolean; migrate: boolean; seed: boolean; allowSeed: boolean; force: boolean; values: Record<string, string> };

function usage(): string {
  return `Uso: bun run project:provision -- --config <archivo.json> [opciones]

Opciones: --dry-run  --json  --migrate  --seed --allow-seed --force
También acepta --name, --short-name, --description, --url y --production-host.
`;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { dryRun: false, json: false, migrate: false, seed: false, allowSeed: false, force: false, values: {} };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--migrate") options.migrate = true;
    else if (arg === "--seed") options.seed = true;
    else if (arg === "--allow-seed") options.allowSeed = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--help") throw new Error(usage());
    else if (["--config", "--name", "--short-name", "--description", "--url", "--production-host"].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requiere un valor.`);
      if (arg === "--config") options.configPath = value;
      else {
        const key = arg.slice(2).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
        options.values[key] = value;
      }
    } else throw new Error(`Opción desconocida: ${arg}\n${usage()}`);
  }
  return options;
}

function loadConfig(options: CliOptions): ProvisionConfig {
  if (options.configPath && Object.keys(options.values).length > 0) throw new Error("Usa --config o flags de proyecto, no ambos.");
  if (options.configPath) return parseConfig(readFileSync(options.configPath, "utf8"));
  const env = process.env;
  const values = Object.keys(options.values).length > 0 ? options.values : {
    name: env.PROVISION_PROJECT_NAME,
    shortName: env.PROVISION_PROJECT_SHORT_NAME,
    description: env.PROVISION_PROJECT_DESCRIPTION,
    url: env.PROVISION_PROJECT_URL,
    productionHost: env.PROVISION_PROJECT_PRODUCTION_HOST,
  };
  if (!values.name) throw new Error("Falta configuración: usa --config, --name o PROVISION_PROJECT_NAME.");
  return parseConfig(JSON.stringify({ project: Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) }));
}

function output(value: unknown, asJson: boolean, error = false): void {
  const text = asJson ? JSON.stringify(value) : typeof value === "string" ? value : JSON.stringify(value, null, 2);
  (error ? console.error : console.log)(text);
}

const args = process.argv.slice(2);
let jsonOutput = args.includes("--json");
try {
  const options = parseArgs(args);
  jsonOutput = options.json;
  const config = loadConfig(options);
  const result = await runProvision(config, options);
  output({ ok: true, status: result.status, actions: result.plan.actions, written: result.written }, options.json);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  output({ ok: false, error: message }, jsonOutput, true);
  process.exitCode = 1;
}