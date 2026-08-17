# RBAC del panel CMS

El panel usa autorización en servidor. Ocultar enlaces del sidebar es solo una
ayuda de UX; las server actions y las rutas API llaman a `requirePermission`.
Un acceso denegado se responde con `notFound()` para no revelar la existencia del
recurso.

## Persistencia y bootstrap

La migración `0003_rbac` añade, sin eliminar `is_superadmin`, `admins.role` y
`admins.permissions` (JSONB). Los admins existentes se convierten a `superadmin`
si `is_superadmin` es verdadero y a `admin` en otro caso. El bootstrap del primer
admin sigue creando el superadmin y las sesiones siguen usando `token_version`.

`superadmin` siempre obtiene el catálogo completo, incluso si el JSONB está vacío.
Los permisos explícitos se filtran contra el catálogo central para impedir valores
arbitrarios.

## Roles iniciales

- `superadmin`: acceso total; no puede degradarse ni editar sus propios permisos.
- `admin`: todos los permisos operativos, salvo gestionar módulos.
- `editor`: lectura y edición/publicación de contenido y navegación.
- `seo`: lectura de contenido y gestión SEO.
- `media`: lectura de contenido, subida e imágenes IA.
- `messages`: lectura y gestión de mensajes.
- `viewer`: lectura limitada de contenido, SEO y mensajes.

El superadmin puede asignar un rol y una lista explícita de permisos desde
`/admin/seguridad`. Un usuario no puede editarse a sí mismo y el sistema rechaza
la operación que dejaría cero superadmins.

## Catálogo

Los permisos se declaran en `src/lib/rbac.ts`. Entre ellos están
`content.read`, `content.write`, `content.publish`, `seo.manage`,
`branding.manage`, `contact.manage`, `menu.manage`, `media.upload`, `media.ai`,
`messages.read`, `messages.manage`, `security.manage`, `modules.manage`,
`legal.manage` y `navigation.manage`.

Para una nueva acción sensible, usar `requirePermission(PERMISSIONS.x)` en el
servidor. Para una ruta nueva, añadir su resolución en `routePermission` y su
entrada de navegación con `permission`.

## Seguridad

No se aceptan permisos desconocidos, no se confía en la UI, y las rutas API de
subida/IA validan el permiso antes de procesar el cuerpo de la petición. Los
cambios de contraseña y revocación mantienen el mecanismo existente de
`token_version`.

Los tests unitarios de `tests/rbac.test.ts` prueban presets, superadmin,
sanearizado de catálogo y resolución de rutas sin usar una base de datos real.
Además, `tests/migrations.test.ts` cubre el ejecutor de migraciones con una BD
falsa.

> Ejecutar `bun run db:migrate` en cada entorno con la URL de base de datos
> configurada para aplicar la migración.
