import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  mergeClientConfig,
  withPlatformConfig,
  type EffectiveSiteConfig,
} from "@/lib/site";

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

/** Lee overrides generados por provisioning sin importarlos en el bundle de Next. */
export function loadProvisioningConfig(cwd = process.cwd()): unknown {
  const override = readJson(join(cwd, ".provisioning", "site-overrides.json"));
  if (override && typeof override === "object" && !Array.isArray(override)) {
    const site = (override as Record<string, unknown>).site;
    if (site) return site;
  }
  const client = join(cwd, ".provisioning", "client.json");
  const clientConfig = existsSync(client) ? readJson(client) : undefined;
  return clientConfig && typeof clientConfig === "object"
    ? (clientConfig as Record<string, unknown>).project
    : undefined;
}

/**
 * Precedencia explícita: defaults de plataforma < provisioning < settings.site
 * (y settings.client por compatibilidad). Los fallos de BD son fallback seguro.
 */
export async function resolveSiteConfig(databaseSettings?: unknown): Promise<EffectiveSiteConfig> {
  let database = databaseSettings;
  if (database === undefined) {
    try {
      const { getSettings } = await import("@/lib/data");
      database = await getSettings();
    } catch {
      database = undefined;
    }
  }
  const settings = database && typeof database === "object" ? (database as Record<string, unknown>) : {};
  const client = settings.site ?? settings.client ?? settings;
  const provisioning = loadProvisioningConfig();
  const environment = process.env.NEXT_PUBLIC_SITE_URL ? { url: process.env.NEXT_PUBLIC_SITE_URL } : undefined;
  return withPlatformConfig(mergeClientConfig(environment, provisioning, client));
}

export function resolveSiteConfigSync(
  provisioning: unknown,
  database?: unknown,
): EffectiveSiteConfig {
  const source = database && typeof database === "object"
    ? ((database as Record<string, unknown>).site ?? (database as Record<string, unknown>).client ?? database)
    : database;
  return withPlatformConfig(mergeClientConfig(provisioning, source));
}
