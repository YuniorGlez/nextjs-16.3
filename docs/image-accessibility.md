# Imágenes y accesibilidad

El texto alternativo se valida en servidor: se recortan espacios, se permiten
hasta 500 caracteres y se rechazan HTML y caracteres de control. Describe el
contenido o función de la imagen, no el nombre del archivo. `alt=""` se reserva
para imágenes decorativas y debe enviarse explícitamente como `decorative`.

La web pública usa `AccessibleImage` (Next Image) para rutas locales y Vercel
Blob, con `sizes` según el ancho real y `priority` solo para el hero/LCP. Las
URLs externas arbitrarias del CMS mantienen `<img>` como excepción documentada:
Next exige declarar cada dominio remoto en `next.config.ts`.

Las galerías pueden persistir `fotosAlt` junto a `fotos`, y las secciones local
pueden persistir `imagenAlt`, sin cambiar el formato existente: ambos campos son
opcionales. Mantén landmarks, headings ordenados, nombres accesibles en botones
de icono y el enlace de salto al contenido principal.