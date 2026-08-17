# Cache y revalidación pública

La superficie pública usa `unstable_cache` de Next 16 para consultas de Neon relativamente estables:

- `public-settings`: settings/configuración efectiva pública.
- `public-menu`: menú público.
- `public-pages`: listado y estado publicado de páginas.
- `public-page:<slug>`: página publicada individual.
- `public-redirects`: redirects para Server Components.

Las funciones cacheadas están en `src/lib/data.ts` (`getPublic*`). Las funciones
`get*` originales permanecen sin cachear y se usan en admin y preview, por lo
que un borrador nunca entra en la cache pública. Las mutaciones de admin llaman
a las invalidaciones centralizadas en `src/lib/cache.ts` y conservan además
`revalidatePath` para actualizar las pantallas del panel y rutas concretas.

## Consistencia y despliegue

Se usa `revalidateTag(tag, "max")`: la siguiente visita puede recibir stale-while-
revalidate mientras se obtiene el valor nuevo. Es consistencia eventual; para
una corrección inmediata de una Server Action puede usarse `updateTag` en una
futura migración, y `revalidatePath` sigue siendo útil cuando se quiere refrescar
una ruta concreta. No se cachean cookies, headers, sesión, admin, draft ni
preview.

`unstable_cache` es deliberado aquí porque funciona con funciones de BD sin
activar Cache Components y, según la documentación instalada de Next 16, puede
persistir entre peticiones/despliegues según el handler del despliegue. En
serverless la memoria puede ser efímera y cada instancia puede consultar Neon
de nuevo; no se debe asumir una cache global compartida. Las tags también deben
invalidarse en cada mutación que cambie contenido público.

## Redirects en `proxy.ts`

El proxy no puede llamar `revalidateTag` (la API no está soportada en Proxy) y
necesita resolver un 301 antes de renderizar la página. Por eso conserva una
consulta Neon directa, fail-open: si falta `DATABASE_URL` o Neon falla, deja
pasar la petición y nunca rompe el sitio. `getPublicPageRedirects` solo sirve a
Server Components y no se usa en el proxy. No se inventa soporte de cache API
para Edge/Proxy; si se necesita reducir esa consulta, la alternativa segura es
un almacenamiento edge explícito soportado por la plataforma, con invalidación
coordinada, no `unstable_cache` dentro del proxy.

## Verificación

Para comprobar una invalidación, publicar/editar desde admin y visitar la ruta
pública: se mantiene la respuesta mientras se marca el tag stale y la siguiente
revalidación obtiene Neon. En despliegues serverless hay que comprobar cada
instancia o usar un handler remoto si se necesita cache compartida.
