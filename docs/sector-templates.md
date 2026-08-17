# Plantillas sectoriales

El catálogo vive en `src/lib/templates.ts`, un módulo sin dependencias server-only que pueden consumir Server Components, acciones y componentes cliente. Cada entrada declara un `id`, sector, nombre, descripción, composición (`sections`) y estructura inicial (`initialContent`). Los valores son neutros y no pertenecen a ningún cliente.

## Añadir un sector

1. Añade un identificador literal a `TEMPLATE_IDS`.
2. Añade una entrada a `SECTOR_TEMPLATES` con las claves existentes de `src/lib/sections.ts`.
3. Usa `initialContent` solo para estructura o textos genéricos; nunca copies contenido real de un cliente.
4. Añade un caso al catálogo y a la prueba de validación en `src/lib/templates.test.ts`.
5. Si requiere un módulo nuevo, decláralo en `src/lib/admin-modules.ts` y asigna el permiso ya existente adecuado; no cambies RBAC sin una decisión explícita.

## Aplicación segura

`/admin/plantillas` requiere `branding.manage` tanto en el layout (por `routePermission`) como en `applySectorTemplateAction`. El preset seleccionado se guarda en `settings.template`. Aplicar preset es explícito y llama a `applyTemplateToSettings`, que solo rellena claves ausentes o vacías y conserva valores existentes; no borra páginas, drafts, publicados ni media. La migración 0006 solo establece el valor por defecto cuando la clave aún no existe (`ON CONFLICT DO NOTHING`) y no ejecuta el seed.

Para nuevos clientes se puede aplicar el preset desde el panel después de provisionar la base de datos. Para clientes existentes, la operación es igualmente no destructiva.

No se usa `eval`, imports dinámicos de plantillas ni datos de cliente en el catálogo.
