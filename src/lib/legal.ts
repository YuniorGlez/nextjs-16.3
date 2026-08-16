// Datos legales de la empresa (settings.legal) + sustitución de tokens en textos.
// Los textos legales del CMS pueden usar {{empresa}}, {{cif}}, {{direccion}},
// {{email}}, {{telefono}}, {{registro}} y {{dominio}}; se rellenan aquí.

export type LegalData = {
  razonSocial: string;
  cif: string;
  direccion: string;
  email: string;
  telefono: string;
  registro: string;
  dominio: string;
};

const EMPTY: LegalData = {
  razonSocial: "",
  cif: "",
  direccion: "",
  email: "",
  telefono: "",
  registro: "",
  dominio: "",
};

export function normalizeLegal(v: unknown): LegalData {
  const o = (v ?? {}) as Record<string, unknown>;
  const pick = (k: string) => (typeof o[k] === "string" ? (o[k] as string).trim() : "");
  return {
    razonSocial: pick("razonSocial"),
    cif: pick("cif"),
    direccion: pick("direccion"),
    email: pick("email"),
    telefono: pick("telefono"),
    registro: pick("registro"),
    dominio: pick("dominio"),
  };
}

const TOKENS: [string, keyof LegalData][] = [
  ["empresa", "razonSocial"],
  ["cif", "cif"],
  ["direccion", "direccion"],
  ["email", "email"],
  ["telefono", "telefono"],
  ["registro", "registro"],
  ["dominio", "dominio"],
];

/** Sustituye {{token}} por el valor legal correspondiente. Si falta, deja el token. */
export function fillLegal(text: string, legal: LegalData): string {
  let out = text;
  for (const [token, key] of TOKENS) {
    const value = legal[key];
    if (value) out = out.split(`{{${token}}}`).join(value);
  }
  return out;
}

export function emptyLegal(): LegalData {
  return { ...EMPTY };
}
