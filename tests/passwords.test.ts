import { describe, expect, it } from "bun:test";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/passwords";

describe("hashPassword / verifyPassword (scrypt)", () => {
  it("roundtrip: la contraseña correcta se verifica", () => {
    const hash = hashPassword("Temporal1234!");
    expect(verifyPassword("Temporal1234!", hash)).toBe(true);
  });

  it("una contraseña distinta no se verifica", () => {
    const hash = hashPassword("Temporal1234!");
    expect(verifyPassword("Temporal1234?", hash)).toBe(false);
  });

  it("cada hash es distinto (salt aleatorio)", () => {
    const a = hashPassword("misma-password");
    const b = hashPassword("misma-password");
    expect(a).not.toBe(b);
    expect(verifyPassword("misma-password", a)).toBe(true);
    expect(verifyPassword("misma-password", b)).toBe(true);
  });

  it("el formato es salt:hash en base64", () => {
    const hash = hashPassword("password-segura");
    const [salt, derived] = hash.split(":");
    expect(salt).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(derived).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(Buffer.from(salt, "base64")).toHaveLength(16);
    expect(Buffer.from(derived, "base64")).toHaveLength(64);
  });

  it("formato inválido: se devuelve false sin lanzar", () => {
    expect(verifyPassword("cualquiera", "")).toBe(false);
    expect(verifyPassword("cualquiera", "solo-un-segmento")).toBe(false);
    expect(verifyPassword("cualquiera", "a:b:c")).toBe(false);
    expect(verifyPassword("cualquiera", "no-es-base64-!!:no-es-base64-!!")).toBe(false);
    expect(verifyPassword("cualquiera", ":::")).toBe(false);
  });

  it("entradas no string: false", () => {
    const hash = hashPassword("password-segura");
    // @ts-expect-error probamos entradas de runtime inválidas
    expect(verifyPassword(undefined, hash)).toBe(false);
    // @ts-expect-error probamos entradas de runtime inválidas
    expect(verifyPassword("password-segura", undefined)).toBe(false);
    // @ts-expect-error probamos entradas de runtime inválidas
    expect(verifyPassword(null, null)).toBe(false);
  });
});

describe("validatePassword", () => {
  it("rechaza contraseñas de menos de 8 caracteres", () => {
    expect(validatePassword("corta12")).not.toBeNull();
    expect(validatePassword("1234567")).not.toBeNull();
  });

  it("rechaza contraseñas de más de 128 caracteres", () => {
    expect(validatePassword("a".repeat(129))).not.toBeNull();
  });

  it("acepta el rango válido [8, 128]", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
    expect(validatePassword("a".repeat(MAX_PASSWORD_LENGTH))).toBeNull();
  });
});

describe("hashPassword con entradas inválidas", () => {
  it("lanza antes de hashear si la contraseña es demasiado corta o larga", () => {
    expect(() => hashPassword("1234567")).toThrow(/al menos 8/);
    expect(() => hashPassword("a".repeat(129))).toThrow(/128/);
  });
});
