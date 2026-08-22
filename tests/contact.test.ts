import { describe, expect, it } from "bun:test";
import {
  MAX_MESSAGE_LENGTH,
  normalizeContactInput,
  validateContactInput,
} from "@/lib/contact";

describe("normalizeContactInput", () => {
  it("recorta todos los campos", () => {
    const input = normalizeContactInput({
      name: "  Ana  ",
      email: " ana@example.com ",
      message: "  Hola, ¿tenéis disponibilidad?  ",
      website: " ",
    });
    expect(input).toEqual({
      name: "Ana",
      email: "ana@example.com",
      message: "Hola, ¿tenéis disponibilidad?",
      website: "",
    });
  });

  it("tolera valores que no son string (los convierte a vacío)", () => {
    expect(
      normalizeContactInput({ name: 123, email: null, message: undefined, website: ["x"] }),
    ).toEqual({ name: "", email: "", message: "", website: "" });
  });

  it("tolera body null o no objeto", () => {
    expect(normalizeContactInput(null)).toEqual({ name: "", email: "", message: "", website: "" });
    expect(normalizeContactInput("texto")).toEqual({ name: "", email: "", message: "", website: "" });
  });
});

describe("validateContactInput", () => {
  it("acepta un mensaje válido", () => {
    const input = { name: "Ana", email: "ana@example.com", message: "Hola", website: "" };
    expect(validateContactInput(input)).toEqual({ kind: "ok", data: input });
  });

  it("honeypot relleno → bot (ok silencioso, sin guardar ni enviar)", () => {
    const input = { name: "Bot", email: "bot@example.com", message: "spam", website: "http://spam" };
    expect(validateContactInput(input)).toEqual({ kind: "bot" });
  });

  it("email con formato inválido → bot (mismo comportamiento que el route actual)", () => {
    const input = { name: "Ana", email: "no-es-un-email", message: "Hola", website: "" };
    expect(validateContactInput(input)).toEqual({ kind: "bot" });
  });

  it("campos vacíos → error 400", () => {
    const input = { name: "", email: "ana@example.com", message: "Hola", website: "" };
    const res = validateContactInput(input);
    expect(res.kind).toBe("invalid");
    if (res.kind === "invalid") {
      expect(res.error).toBe("Completa nombre, email y mensaje.");
    }
  });

  it("mensaje demasiado largo → error", () => {
    const input = {
      name: "Ana",
      email: "ana@example.com",
      message: "x".repeat(MAX_MESSAGE_LENGTH + 1),
      website: "",
    };
    const res = validateContactInput(input);
    expect(res.kind).toBe("invalid");
    if (res.kind === "invalid") {
      expect(res.error).toContain("demasiado largo");
    }
  });

  it("acepta un mensaje justo en el límite de longitud", () => {
    const input = {
      name: "Ana",
      email: "ana@example.com",
      message: "x".repeat(MAX_MESSAGE_LENGTH),
      website: "",
    };
    expect(validateContactInput(input).kind).toBe("ok");
  });
});
