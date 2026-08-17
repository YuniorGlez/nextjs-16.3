# Provisionamiento de proyectos para agentes

`scripts/provision.ts` prepara un proyecto cliente sin prompts ni acceso a APIs cloud. Es un CLI deliberadamente pequeño: valida un contrato JSON (o flags/variables equivalentes), genera archivos de configuración permitidos y, solo si se solicita, ejecuta el runner de migraciones o el seed demo.

## Contrato de entrada

```json
{
  "project": {
    "name": "Acme Café",
    "shortName": "acme-cafe",
    "description": "Sitio público de Acme Café",
    "url": "https://acme.example",
    "productionHost": "acme.example"
  }
}
```

`project.name` es obligatorio (2–100 caracteres). `shortName` es kebab-case; `url` debe ser HTTPS. Se rechazan claves desconocidas. El archivo puede estar en cualquier ruta fuera del repositorio:

```bash
bun run project:provision -- --config /ruta/acme.json --dry-run --json
bun run project:provision -- --config /ruta/acme.json --json
```

Alternativamente, `--name`, `--short-name`, `--description`, `--url` y `--production-host`, o las variables `PROVISION_PROJECT_NAME`, `PROVISION_PROJECT_SHORT_NAME`, `PROVISION_PROJECT_DESCRIPTION`, `PROVISION_PROJECT_URL` y `PROVISION_PROJECT_PRODUCTION_HOST`. No mezclar `--config` con flags de proyecto.

## Flujo recomendado para una IA

1. `bun run db:migrate:status` (requiere `DATABASE_URL` cargado en el entorno).
2. `bun run project:provision -- --config /ruta/cliente.json --dry-run --json`.
3. Revisar el plan y ejecutar sin `--dry-run`; usar `--force` solo tras comparar el diff.
4. Si corresponde, `bun run project:provision -- --config /ruta/cliente.json --migrate --json`.
5. Verificar de nuevo con `bun run db:migrate:status`.
6. Para datos demo únicamente: añadir **ambos** `--seed --allow-seed` y revisar que la base no sea producción.

`--json` produce un objeto estable con `ok`, `status`, `actions` y `written`; los errores tienen `ok: false`, `error` y código de salida distinto de cero. Nunca hay preguntas interactivas.

## Archivos y límites de seguridad

El CLI solo escribe `.provisioning/client.json` y `.provisioning/site-overrides.json`. Si ya existen con contenido distinto, falla y exige `--force`; si son idénticos, no hace nada. No modifica `src/lib/site.ts`, `package.json`, migraciones, assets ni `.env*`. El loader server-side de `src/lib/site-config.ts` consume `site-overrides.json` (y usa `client.json` como fallback) con precedencia `defaults de plataforma < provisioning < settings.site/settings.client de BD`; no se importa el JSON mutable en el bundle de Next. La BD puede sobreescribir los campos que tenga. Si no hay BD, se mantienen los valores provisionados y, si tampoco hay archivo, los defaults seguros.

`--migrate` ejecuta `bun run db:migrate`; `--seed` ejecuta `bun scripts/seed.ts`. Ambos requieren `DATABASE_URL` presente, pero el CLI nunca imprime su valor ni crea proyectos Neon. El seed hace UPSERT de datos demo y por ello nunca se ejecuta implícitamente. El CLI no crea credenciales, no solicita secretos, no llama a APIs cloud y no puede sustituir la revisión de producción.

Ejemplo incluido: `docs/examples/project-provisioning.json` (sin secretos).

## Pruebas

```bash
bun run test -- tests/provision.test.ts
bun run test
bun run typecheck
bun run lint
bun run build
```

No se prueba contra una base real; migración y seed se delegan a sus comandos existentes.

## Variables necesarias

Para validación y generación de archivos no hace falta ninguna variable. Para `--migrate` o `--seed`, `DATABASE_URL` debe estar cargada de forma segura, por ejemplo mediante el mecanismo de entorno del despliegue. Nunca incluir `.env.local` en el JSON, logs o commits.

## Qué nunca debe hacer un agente

- No ejecutar `--seed` sin `--allow-seed` ni contra producción.
- No usar `--force` sin comparar el contenido existente.
- No inventar URLs, credenciales, proyectos Neon o respuestas de proveedores.
- No pasar secretos por flags, JSON, logs o archivos generados.
- No interpretar este CLI como automatización de Vercel, Blob, RBAC, contenido, SEO, i18n o analytics.
