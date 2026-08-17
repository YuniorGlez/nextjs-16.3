import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type ProvisionConfig = {
  project: {
    name: string;
    shortName?: string;
    description?: string;
    url?: string;
    productionHost?: string;
  };
};

type ActionKind = "write" | "migrate" | "seed";
export type ProvisionAction = { kind: ActionKind; target: string; detail: string };
export type ProvisionPlan = { actions: ProvisionAction[]; files: Record<string, string> };

type ProvisionOptions = {
  cwd?: string;
  dryRun?: boolean;
  migrate?: boolean;
  seed?: boolean;
  allowSeed?: boolean;
  force?: boolean;
  fs?: FileSystem;
  exec?: (command: string[]) => number;
};

type FileSystem = {
  exists: (path: string) => boolean;
  read?: (path: string) => string;
  write: (path: string, content: string) => void;
};

const configKeys = ["project"] as const;
const projectKeys = ["name", "shortName", "description", "url", "productionHost"] as const;

function fail(message: string): never {
  throw new Error(`Configuración inválida: ${message}`);
}

export function parseConfig(input: string): ProvisionConfig {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    fail("el archivo debe contener JSON válido");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("la raíz debe ser un objeto");
  const root = value as Record<string, unknown>;
  for (const key of Object.keys(root)) if (!configKeys.includes(key as (typeof configKeys)[number])) fail(`clave no permitida: ${key}`);
  const project = root.project;
  if (!project || typeof project !== "object" || Array.isArray(project)) fail("project es obligatorio y debe ser un objeto");
  const data = project as Record<string, unknown>;
  for (const key of Object.keys(data)) if (!projectKeys.includes(key as (typeof projectKeys)[number])) fail(`project.${key}`);
  if (typeof data.name !== "string" || data.name.trim().length < 2 || data.name.trim().length > 100) fail("project.name debe tener entre 2 y 100 caracteres");
  for (const key of ["shortName", "description", "url", "productionHost"] as const) {
    if (data[key] !== undefined && typeof data[key] !== "string") fail(`project.${key} debe ser texto`);
  }
  if (data.shortName !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.shortName as string)) fail("project.shortName debe usar kebab-case");
  if (data.url !== undefined) {
    let url: URL;
    try {
      url = new URL(data.url as string);
    } catch {
      fail("project.url debe ser una URL válida");
    }
    if (url.protocol !== "https:") fail("project.url debe usar HTTPS");
  }
  if (data.productionHost !== undefined && !/^[a-z0-9.-]+$/i.test(data.productionHost as string)) fail("project.productionHost no es válido");
  return { project: { ...data, name: (data.name as string).trim() } } as ProvisionConfig;
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function buildPlan(config: ProvisionConfig, options: Pick<ProvisionOptions, "migrate" | "seed"> = {}): ProvisionPlan {
  const clientPath = ".provisioning/client.json";
  const overridesPath = ".provisioning/site-overrides.json";
  const overrides = { site: config.project };
  const actions: ProvisionAction[] = [
    { kind: "write", target: clientPath, detail: "guardar contrato validado" },
    { kind: "write", target: overridesPath, detail: "preparar overrides de site sin tocar src/lib/site.ts" },
  ];
  if (options.migrate) actions.push({ kind: "migrate", target: "DATABASE_URL", detail: "ejecutar migraciones pendientes" });
  if (options.seed) actions.push({ kind: "seed", target: "DATABASE_URL", detail: "ejecutar seed demo explícitamente autorizado" });
  return { actions, files: { [clientPath]: json(config), [overridesPath]: json(overrides) } };
}

const defaultFs: FileSystem = {
  exists: existsSync,
  read: (path) => readFileSync(path, "utf8"),
  write: (path, content) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, "utf8");
  },
};

export async function runProvision(config: ProvisionConfig, options: ProvisionOptions = {}) {
  if (options.seed && !options.allowSeed) throw new Error("El seed requiere --allow-seed explícito; nunca se ejecuta implícitamente.");
  if (!options.dryRun && (options.migrate || options.seed) && !process.env.DATABASE_URL) throw new Error("DATABASE_URL es obligatorio para --migrate/--seed; no se ha leído ni mostrado ningún secreto.");
  const cwd = options.cwd ?? process.cwd();
  const fs = options.fs ?? defaultFs;
  const plan = buildPlan(config, options);
  const written: string[] = [];
  if (!options.dryRun) {
    const pendingWrites: Array<[string, string, string]> = [];
    for (const [relative, content] of Object.entries(plan.files)) {
      const path = join(cwd, relative);
      if (fs.exists(path)) {
        const current = fs.read?.(path);
        if (current !== content && !options.force) throw new Error(`${relative} ya existe con otro contenido; usa --force para reemplazarlo de forma explícita.`);
        if (current === content) continue;
      }
      pendingWrites.push([relative, path, content]);
    }
    for (const [relative, path, content] of pendingWrites) {
      fs.write(path, content);
      written.push(relative);
    }
    const commands: string[][] = [];
    if (options.migrate) commands.push(["bun", "run", "db:migrate"]);
    if (options.seed) commands.push(["bun", "scripts/seed.ts"]);
    for (const command of commands) {
      const code = (options.exec ?? ((args) => spawnSync(args[0], args.slice(1), { cwd }).status ?? 1))(command);
      if (code !== 0) throw new Error(`Falló ${command.join(" ")} con código ${code}`);
    }
  }
  return { status: options.dryRun ? "dry-run" : "completed", plan, written } as const;
}