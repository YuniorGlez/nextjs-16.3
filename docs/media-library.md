# Biblioteca multimedia

La migración `0005_media_library` crea `media_assets` de forma aditiva e idempotente. No se ejecuta automáticamente: aplicar con `bun --env-file=.env.local run db:migrate` cuando corresponda.

Cada subida autorizada por `media.upload` se optimiza y se registra después de crear el Blob. Si Neon falla, el Blob no se borra de forma ficticia: se devuelve la URL con estado 503 y se registra un evento `media.orphaned_blob` en auditoría para reconciliación.

La API protegida es:

- `GET /api/media?search=&folder=&page=&pageSize=&deleted=1`: búsqueda y paginación.
- `GET /api/media/:id`: detalle.
- `PATCH /api/media/:id`: `altText`, `title`, `folder`, `tag` y `metadata` sanitizados.
- `DELETE /api/media/:id`: borrado lógico; `DELETE /api/media/:id?restore=1` restaura.

No se elimina el Blob al borrar un asset. Además, se rechaza el borrado lógico si su URL o pathname aparece en `settings`, `pages.content` o `pages.seo`; así se evita romper contenido existente. La página `/admin/imagenes` ofrece grid responsive, búsqueda, edición de metadatos, copiar URL, paginación y restauración.

El campo `metadata` está limitado a 50 claves y valores string de 500 caracteres; los campos de texto tienen límites equivalentes. Las consultas usan parámetros de Neon mediante tagged templates.

## Integración

`/api/upload` devuelve `{ url, asset }`, por lo que los consumidores existentes que solo leen `url` siguen funcionando. `ImageField` y `BlobUploader` continúan usando esa ruta y la biblioteca queda disponible para selección/reutilización desde el panel.

La tabla conserva `pathname` (la clave de Blob cuando el SDK la devuelve), dimensiones opcionales y `created_by` nullable para soportar assets importados o migraciones futuras.

No se ejecutó DDL ni seed desde el código de esta mejora.

## Verificación

Los tests de `tests/media.test.ts` cubren sanitización, nombres de Blob, migración y autorización RBAC. Ejecutar la suite y los comandos de calidad del repositorio antes de desplegar.
