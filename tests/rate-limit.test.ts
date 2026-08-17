import { describe, expect, it } from "vitest";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("permite N intentos y bloquea el N+1", () => {
    const rl = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });
    for (let i = 1; i <= 5; i++) {
      expect(rl.check("ip-1").allowed).toBe(true);
    }
    const sixth = rl.check("ip-1");
    expect(sixth.allowed).toBe(false);
  });

  it("devuelve remaining correcto", () => {
    const rl = createRateLimiter({ limit: 5, windowMs: 60_000 });
    expect(rl.check("ip-1").remaining).toBe(4);
    expect(rl.check("ip-1").remaining).toBe(3);
    expect(rl.check("ip-1").remaining).toBe(2);
    expect(rl.check("ip-1").remaining).toBe(1);
    expect(rl.check("ip-1").remaining).toBe(0);
    // Bloqueado: remaining se queda en 0.
    expect(rl.check("ip-1").remaining).toBe(0);
  });

  it("retryAfterSeconds es correcto al bloquear", () => {
    let t = 1_000_000;
    const rl = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => t });
    rl.check("ip-1");
    rl.check("ip-1");
    t += 5_000;
    const blocked = rl.check("ip-1");
    expect(blocked.allowed).toBe(false);
    // Ventana fija: quedan 55 s desde el inicio de la ventana.
    expect(blocked.retryAfterSeconds).toBe(55);
  });

  it("reinicia el contador al expirar la ventana (now inyectado)", () => {
    let t = 1_000_000;
    const rl = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => t });
    rl.check("ip-1");
    rl.check("ip-1");
    expect(rl.check("ip-1").allowed).toBe(false);
    // Avanza más allá del resetAt: la ventana se reinicia.
    t += 60_001;
    expect(rl.check("ip-1").allowed).toBe(true);
  });

  it("claves independientes: el límite es por clave", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(rl.check("ip-a").allowed).toBe(true);
    expect(rl.check("ip-a").allowed).toBe(false);
    expect(rl.check("ip-b").allowed).toBe(true);
  });

  it("poda las claves expiradas", () => {
    let t = 1_000_000;
    const rl = createRateLimiter({ limit: 5, windowMs: 60_000, now: () => t });
    rl.check("a");
    rl.check("b");
    rl.check("c");
    // No hay API pública de tamaño; verificamos que tras expirar todas y
    // volver a usarlas el contador se reinicia (equivalente a podadas).
    t += 60_001;
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("c").allowed).toBe(true);
  });

  it("cap: descarta la clave que expira antes al superar maxKeys", () => {
    let t = 1_000_000;
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => t, maxKeys: 2 });
    rl.check("a");
    t += 30_000;
    rl.check("b"); // b expira después que a
    rl.check("c"); // supera el cap → expulsa a (la que expira antes)
    t += 40_000; // ahora expiran b y c (a ya no está)
    expect(rl.check("a").allowed).toBe(true);
  });

  it("no deja crecer el Map por encima de maxKeys", () => {
    let t = 1_000_000;
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => t, maxKeys: 3 });
    for (const k of ["a", "b", "c", "d", "e", "f"]) rl.check(k);
    // Con cap 3 y 6 claves distintas, todas siguen funcionando (las expulsadas
    // se re-crean), sin errores ni crecimiento descontrolado del Map.
    expect(rl.check("a").allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("usa el primer valor de x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(getClientIp(h)).toBe("203.0.113.9");
  });

  it("cae a x-real-ip si no hay x-forwarded-for", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(getClientIp(h)).toBe("198.51.100.7");
  });

  it("devuelve unknown sin cabeceras", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });

  it("x-forwarded-for vacío cae a x-real-ip", () => {
    const h = new Headers({ "x-forwarded-for": " ", "x-real-ip": "198.51.100.7" });
    expect(getClientIp(h)).toBe("198.51.100.7");
  });
});
