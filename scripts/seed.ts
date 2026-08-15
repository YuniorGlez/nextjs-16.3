// Siembra la BD Neon con la tabla de settings + layout del CMS admin.
// Uso: bun --env-file=.env.local scripts/seed.ts
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no está. Ejecuta con --env-file=.env.local");
const sql = neon(url);

// Tablas del CMS (categorías/items opcionales para webs con carta/menú)
await sql`CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
)`;
await sql`CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
)`;
await sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value JSONB NOT NULL)`;

const settings: Record<string, unknown> = {
  contacto: {
    telefono: "",
    telefonoUrl: "",
    whatsapp: "",
    email: "",
    direccion: "",
    localidad: "",
  },
  hero: {
    titulo: "Tu etiqueta",
    subtitulo: "Breve descripción de tu negocio.",
    ubicacion: "Ciudad · País",
    imagen: "",
  },
  destacados: [
    { icon: "✨", titulo: "Destacado 1", texto: "Describe tu primer servicio o producto." },
    { icon: "✨", titulo: "Destacado 2", texto: "Describe tu segundo servicio o producto." },
    { icon: "✨", titulo: "Destacado 3", texto: "Describe tu tercer servicio o producto." },
  ],
  numeros: [
    { n: "100+", t: "Clientes" },
    { n: "24/7", t: "Disponibilidad" },
    { n: "★ 4.9", t: "Valoración" },
    { n: "0 €", t: "Empieza gratis" },
  ],
  local: {
    etiqueta: "Sobre nosotros",
    titulo: "Tu marca, tu historia",
    parrafo1: "Cuenta en unas líneas qué haces y por qué importa.",
    parrafo2: "Añade más contexto, valores o un segundo párrafo.",
  },
  galeria: { titulo: "Galería", texto: "Fotos de tu negocio.", fotos: [] },
  layout: [
    { key: "hero", visible: true },
    { key: "destacados", visible: true },
    { key: "menu", visible: false },
    { key: "local", visible: true },
    { key: "galeria", visible: true },
    { key: "contacto", visible: true },
  ],
  branding: { primary: "#f59e0b", font: "playfair", radius: 18 },
};

for (const [k, v] of Object.entries(settings)) {
  await sql`INSERT INTO settings (key, value) VALUES (${k}, ${JSON.stringify(v)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}
console.log("Seed del CMS completado. Ajustes:", Object.keys(settings).join(", "));