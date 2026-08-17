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
await sql`CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb
)`;

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
    h1: "Tu titular principal en una línea potente",
    subtitulo: "Breve descripción de tu negocio que engancha y resume tu propuesta de valor.",
    cta1: "Empieza ahora",
    cta1Url: "#contacto",
    cta2: "Saber más",
    cta2Url: "#sobre-nosotros",
    ubicacion: "Ciudad · País",
    imagen: "/examples/hero-default.jpg",
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
    imagen: "/examples/local-default.jpg",
  },
  galeria: {
    titulo: "Galería",
    texto: "Fotos de tu negocio.",
    fotos: ["/examples/g1.jpg", "/examples/g2.jpg", "/examples/g3.jpg", "/examples/g4.jpg"],
  },
  testimonios: [
    { texto: "Un cliente feliz cuenta su experiencia con tu producto o servicio.", autor: "Nombre Apellido", rol: "Cargo · Empresa" },
    { texto: "Otro testimonio que refuerza tu credibilidad y resultados.", autor: "Nombre Apellido", rol: "Cargo · Empresa" },
    { texto: "Un tercer testimonio para cerrar la prueba social.", autor: "Nombre Apellido", rol: "Cargo · Empresa" },
  ],
  faq: [
    { pregunta: "¿Qué hace tu producto o servicio?", respuesta: "Responde aquí la duda más frecuente de tus clientes." },
    { pregunta: "¿Cuánto cuesta?", respuesta: "Explica tus precios o cómo pedir un presupuesto." },
    { pregunta: "¿Cómo empiezo?", respuesta: "Describe los pasos para contratar o contactar contigo." },
  ],
  cta: {
    titulo: "¿Hablamos de tu proyecto?",
    texto: "Cuéntanos qué necesitas y te responderemos en menos de 24 horas.",
    boton: "Contactar ahora",
    botonUrl: "#contacto",
  },
  layout: [
    { key: "hero", visible: true },
    { key: "destacados", visible: true },
    { key: "numeros", visible: true },
    { key: "local", visible: true },
    { key: "galeria", visible: true },
    { key: "testimonios", visible: true },
    { key: "faq", visible: true },
    { key: "cta", visible: true },
    { key: "menu", visible: false },
    { key: "contacto", visible: true },
  ],
  branding: { primary: "#f59e0b", font: "playfair", radius: 18 },
  seo: {
    title: "",
    description: "",
    keywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "/examples/og-default.jpg",
  },
  ai: {
    openrouterApiKey: "",
  },
  legal: {
    razonSocial: "Tu Empresa S.L.",
    cif: "B00000000",
    direccion: "Calle Ejemplo 1, 28001 Madrid",
    email: "legal@tudominio.com",
    telefono: "+34 900 000 000",
    registro: "Inscrita en el Registro Mercantil de Madrid, Tomo 00000, Folio 0, Hoja M-000000",
    dominio: "tudominio.com",
  },
};

for (const [k, v] of Object.entries(settings)) {
  await sql`INSERT INTO settings (key, value) VALUES (${k}, ${JSON.stringify(v)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

// ---------- Páginas estándar (ruta /[slug], editables desde /admin/paginas) ----------
const standardPages = [
  {
    slug: "sobre-nosotros",
    name: "Sobre nosotros",
    visible: true,
    sortOrder: 1,
    seo: { title: "", description: "" },
    layout: [
      { key: "cabecera", visible: true },
      { key: "texto", visible: true },
      { key: "cta", visible: true },
      { key: "contacto", visible: true },
    ],
    content: {
      cabecera: { titulo: "Sobre nosotros", subtitulo: "Quiénes somos y qué hacemos." },
      texto: {
        titulo: "Nuestra historia",
        parrafos: [
          "Cuenta aquí quién está detrás del proyecto, desde cuándo existe y qué te hace diferente.",
          "Añade un segundo párrafo con vuestra misión, los valores del equipo o los hitos más importantes.",
        ],
      },
      cta: { titulo: "", texto: "", boton: "", botonUrl: "" },
    },
  },
  {
    slug: "contacto",
    name: "Contacto",
    visible: true,
    sortOrder: 2,
    seo: { title: "", description: "" },
    layout: [
      { key: "cabecera", visible: true },
      { key: "contacto", visible: true },
      { key: "cta", visible: true },
    ],
    content: {
      cabecera: { titulo: "Contacto", subtitulo: "Estamos a un mensaje de distancia." },
      cta: { titulo: "", texto: "", boton: "", botonUrl: "" },
    },
  },
  {
    slug: "cookies",
    name: "Política de cookies",
    visible: true,
    sortOrder: 3,
    seo: { title: "", description: "" },
    layout: [
      { key: "cabecera", visible: true },
      { key: "texto", visible: true },
    ],
    content: {
      cabecera: {
        titulo: "Política de cookies",
        subtitulo: "Información sobre el uso de cookies en {{dominio}}.",
      },
      texto: {
        titulo: "¿Qué son las cookies y cómo las usamos?",
        parrafos: [
          "En {{dominio}}, titularidad de {{empresa}} ({{cif}}), utilizamos cookies propias y de terceros para garantizar el funcionamiento del sitio web, medir la audiencia y mejorar tu experiencia de navegación. Esta página explica qué son, para qué las usamos y cómo puedes gestionarlas.",
          "¿Qué es una cookie? Una cookie es un pequeño archivo de texto que se almacena en tu dispositivo (ordenador, móvil o tableta) al visitar una web. Permite, entre otras cosas, recordar tus preferencias, reconocerte en visitas sucesivas y elaborar estadísticas anónimas de navegación.",
          "¿Qué cookies utiliza esta web? Cookies técnicas: imprescindibles para el funcionamiento del sitio (por ejemplo, recordar el consentimiento otorgado o mantener tu sesión). Cookies de análisis: utilizamos Google Analytics 4 (GA4), que recoge información agregada y anónima sobre cómo navegan los visitantes (páginas visitadas, tiempo de estancia, origen del tráfico). Estas cookies solo se cargan si aceptas la política de cookies desde el banner de consentimiento.",
          "¿Cómo gestionar o retirar el consentimiento? Puedes aceptar o rechazar las cookies no esenciales desde el banner que se muestra al entrar en la web. También puedes configurar tu navegador para bloquear o eliminar cookies desde su menú de privacidad (Chrome, Firefox, Safari o Edge). Retirar el consentimiento no afecta a las cookies técnicas necesarias para el funcionamiento de la web.",
          "Base legal y derechos: el tratamiento de datos derivado de las cookies de análisis se ampara en tu consentimiento (art. 6.1.a del RGPD). Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {{email}}.",
          "Actualizaciones: esta política puede actualizarse cuando cambien los servicios ofrecidos o la normativa aplicable. Te animamos a revisarla periódicamente. Última actualización: agosto de 2026.",
        ],
      },
    },
  },
  {
    slug: "privacidad",
    name: "Política de privacidad",
    visible: true,
    sortOrder: 4,
    seo: { title: "", description: "" },
    layout: [
      { key: "cabecera", visible: true },
      { key: "texto", visible: true },
    ],
    content: {
      cabecera: {
        titulo: "Política de privacidad",
        subtitulo: "Qué datos recogemos, para qué y cuáles son tus derechos.",
      },
      texto: {
        titulo: "Responsable del tratamiento",
        parrafos: [
          "Responsable del tratamiento: {{empresa}}, con NIF/CIF {{cif}}, domicilio en {{direccion}}. {{registro}}. Correo electrónico de contacto: {{email}}.",
          "¿Con qué finalidad tratamos tus datos? Los datos personales que nos facilitas a través del formulario de contacto (nombre, email y mensaje) se tratan únicamente para atender tu consulta, gestionar la relación comercial y responder a tus solicitudes. Base legal: tu consentimiento (art. 6.1.a del RGPD) e interés legítimo en responder a comunicaciones previas a la contratación (art. 6.1.f del RGPD).",
          "¿Durante cuánto tiempo conservamos tus datos? Conservamos tus datos durante el tiempo necesario para atender tu consulta y, en su caso, mantener la relación contractual, y posteriormente durante los plazos legales de prescripción aplicables. No cedemos tus datos a terceros, salvo obligación legal o proveedores necesarios para la prestación del servicio (alojamiento web, servicios de email), que actúan como encargados del tratamiento.",
          "¿Cuáles son tus derechos? Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a {{email}}, adjuntando una copia de un documento identificativo. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).",
          "Menores de edad: este sitio web no está dirigido a menores de 14 años y no recogemos conscientemente datos personales de menores.",
          "Seguridad: aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos frente a accesos no autorizados, pérdida o alteración.",
          "Modificaciones: esta política se actualizará cuando sea necesario. {{empresa}} publicará la versión vigente en esta página. Última actualización: agosto de 2026.",
        ],
      },
    },
  },
];

for (const p of standardPages) {
  await sql`INSERT INTO pages (slug, name, visible, sort_order, seo, content, layout)
    VALUES (${p.slug}, ${p.name}, ${p.visible}, ${p.sortOrder}, ${JSON.stringify(p.seo)}::jsonb,
      ${JSON.stringify(p.content)}::jsonb, ${JSON.stringify(p.layout)}::jsonb)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name, visible = EXCLUDED.visible, sort_order = EXCLUDED.sort_order,
      seo = EXCLUDED.seo, content = EXCLUDED.content, layout = EXCLUDED.layout`;
}

console.log("Seed del CMS completado. Ajustes:", Object.keys(settings).join(", "));
console.log("Páginas estándar:", standardPages.map((p) => p.slug).join(", "));
