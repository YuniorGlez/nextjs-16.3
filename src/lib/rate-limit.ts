// Rate-limit en memoria (sin dependencias).
//
// LIMITACIÓN: el store vive en la instancia del proceso. En un despliegue
// serverless (Vercel) cada instancia/función tiene su propio contador, así que
// esto frena a atacantes dentro de una misma instancia pero no da un límite
// global. Para un límite estricto compartido habría que usar un store externo
// (Redis/Upstash). Es un freno pragmático para esta base sin añadir
// dependencias ni servicios.

export type RateLimitResult = {
  allowed: boolean;
  /** Intentos restantes dentro de la ventana (0 si bloqueado). */
  remaining: number;
  /** Segundos hasta que se reinicia la ventana (0 si allowed). */
  retryAfterSeconds: number;
};

export type RateLimiter = {
  /** Registra un intento para la clave y devuelve si está permitido. */
  check: (key: string) => RateLimitResult;
};

type Entry = { count: number; resetAt: number };

const DEFAULT_MAX_KEYS = 10_000;
const PRUNE_INTERVAL_MS = 1_000;

export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  /** Reloj inyectable para tests. */
  now?: () => number;
  /** Cap del Map: al superarlo se descarta la clave que expira antes. */
  maxKeys?: number;
}): RateLimiter {
  const { limit, windowMs } = options;
  const now = options.now ?? Date.now;
  const maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;
  const store = new Map<string, Entry>();
  let lastPruneAt = 0;

  function pruneExpired(t: number) {
    // Poda oportunista como máximo una vez por segundo (barrido O(n) barato).
    if (t - lastPruneAt < PRUNE_INTERVAL_MS) return;
    lastPruneAt = t;
    for (const [key, entry] of store) {
      if (entry.resetAt <= t) store.delete(key);
    }
  }

  return {
    check(key: string): RateLimitResult {
      const t = now();
      pruneExpired(t);

      let entry = store.get(key);
      // Ventana fija: expirada o nueva → se reinicia el contador.
      if (!entry || entry.resetAt <= t) {
        entry = { count: 0, resetAt: t + windowMs };
        store.set(key, entry);
      }

      // Cap de memoria: si el Map supera maxKeys, descartar la clave que
      // expira antes (la menos útil). Raro en la práctica; barrido O(n)
      // puntual al llegar al límite.
      if (store.size > maxKeys) {
        let oldestKey: string | null = null;
        let oldestResetAt = Infinity;
        for (const [k, e] of store) {
          if (e.resetAt < oldestResetAt) {
            oldestResetAt = e.resetAt;
            oldestKey = k;
          }
        }
        if (oldestKey !== null) store.delete(oldestKey);
      }

      entry.count += 1;
      const allowed = entry.count <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - entry.count),
        retryAfterSeconds: allowed
          ? 0
          : Math.max(1, Math.ceil((entry.resetAt - t) / 1000)),
      };
    },
  };
}

/**
 * IP del cliente: primer valor de `x-forwarded-for` (el proxy/CDN añade la IP
 * real al principio), con fallback a `x-real-ip` y por último "unknown".
 * Nota: `x-forwarded-for` es manipulable por el cliente si no hay proxy que
 * lo reescriba; en Vercel/CDN el valor llega ya saneado.
 */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "unknown";
}

// Singleton por proceso. El conteo incluye TODAS las peticiones de login
// (también las exitosas): frena fuerza bruta antes de llegar al coste de
// verificación de credenciales (scrypt) y evita que un atacante pueda hacer
// intentos ilimitados alternando credenciales válidas de su propia cuenta.
export const loginLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
});

// Subidas a Blob: solo admins autenticados llegan al contador (ver route.ts).
export const uploadLimiter = createRateLimiter({
  limit: 20,
  windowMs: 10 * 60 * 1000,
});
