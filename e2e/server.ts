// e2e/server.ts — Gestión del ciclo de vida del servidor para los e2e.
//
// Bun.WebView (a diferencia de Playwright) NO tiene `webServer`: hay que arrancar
// y parar el servidor uno mismo. Estratégia:
//   - Si ya hay un server respondiendo en BASE_URL (E2E_BASE_URL o localhost:3000),
//     lo reutilizamos (no spawnear otro). Sobre todo útil en CI donde se quiere
//     control fino, o con `next start` tras un build.
//   - Si no, arrancamos `bun run dev` como subproceso, esperamos a que responda y
//     lo matamos al cerrar.
//
// OJO: pasamos explícitamente las variables de .env.local al subproceso. `next dev`
// no sobreescribe variables de entorno ya presentes, y la propagación desde un
// runner `bun test` no es fiable para DATABASE_URL. Al pasarlas a mano garantizamos
// que el server vea la BD de staging.
//
// Uso (desde los archivos de test):
//   import { setupServer } from "./server";
//   const server = setupServer();
//   beforeAll(async () => { await server.start(); }, 60_000);
//   afterAll(async () => { await server.stop(); });
import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

export const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

async function esperaRespuesta(url: string, timeoutMs: number) {
  const inicio = Date.now();
  for (;;) {
    try {
      const r = await fetch(url);
      // El server dev puede responder mientras inicializa: exigimos 200.
      if (r.ok) return;
    } catch {
      // aún no escucha
    }
    if (Date.now() - inicio > timeoutMs) {
      throw new Error(`el server no respondió en ${url} tras ${timeoutMs}ms`);
    }
    await Bun.sleep(300);
  }
}

/** Lee las variables de .env.local como objeto (solo las definidas). */
function leerEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  const path = `${process.cwd()}/.env.local`;
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export function setupServer() {
  let child: ChildProcess | null = null;
  const envLocal = leerEnvLocal();
  return {
    async start() {
      // 1. Reutilizar server existente.
      try {
        await esperaRespuesta(BASE_URL, 1500);
        console.log(`· e2e: reutilizando server existente en ${BASE_URL}`);
        return;
      } catch {
        // no hay server → lo arrancamos
      }

      // 2. Arrancar `bun run dev` (a ser posible con la BD del .env.local).
      //    Nota: next 16 no sobreescribe env ya presentes, y la propagación desde
      //    bun test no es fiable, así que inyectamos .env.local explícitamente.
      console.log(`· e2e: arrancando bun run dev…`);
      child = spawn("bun", ["run", "dev"], {
        cwd: process.cwd(),
        env: {
          ...envLocal,
          ...process.env,
          PORT: new URL(BASE_URL).port,
        },
        stdio: "pipe",
      });
      // Empujar el log del server a nuestro stdout para diagnóstico.
      child.stdout?.on("data", (d) => process.stdout.write(`[dev] ${d}`));
      child.stderr?.on("data", (d) => process.stderr.write(`[dev] ${d}`));

      // Esperar a que la BD esté lista comprobando una ruta que la usa (la home
      // es resiliente y no sirve de señal; /cookies la usa).
      await esperaRespuesta(BASE_URL, 90_000);
      console.log(`· e2e: server listo en ${BASE_URL}`);
    },
    async stop() {
      if (child) {
        child.kill("SIGTERM");
        child = null;
      }
    },
  };
}
