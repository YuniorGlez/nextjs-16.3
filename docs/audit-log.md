# Registro de auditoría

La migración `0004_admin-audit-log` crea la tabla `audit_log` para registrar cambios sensibles del CMS. Es aditiva e idempotente y debe aplicarse con `bun run db:migrate`.

## Campos e integridad

- `admin_id`: FK nullable a `admins`, `ON DELETE SET NULL`.
- `admin_email`: snapshot para conservar contexto si se elimina el admin.
- `action`, `entity_type`, `entity_id`: identifican la operación.
- `metadata`: JSONB pequeño y sanitizado.
- `ip`, `user_agent`, `created_at`: contexto de la petición y fecha.

Hay índices por fecha, administrador, acción y entidad. El historial no se puede borrar desde el panel.

## Privacidad

`src/lib/audit.ts` expone `recordAudit` y `recordCurrentAdminAudit`. El segundo obtiene la identidad exclusivamente de la sesión actual y captura IP/user-agent desde headers del servidor; nunca acepta identidad enviada por el cliente.

`sanitizeAuditMetadata` elimina claves relacionadas con contraseñas, tokens, secretos, API keys, autorización, cookies, credenciales, claves privadas, prompts, referencias de entrada y cuerpos de mensajes. También limita profundidad, strings, arrays y claves. No pasar cuerpos completos, credenciales ni payloads arbitrarios al helper.

La escritura es best-effort: si falla el insert o no puede obtenerse el contexto, la mutación principal continúa y se emite una señal `[audit]` con el nombre de la acción.

## Acceso y consulta

`/admin/auditoria` comprueba el permiso en servidor y requiere `audit.read` o `security.manage`. La navegación solo se muestra a admins autorizados, pero la protección real está en la página/layout. La vista ofrece filtros por acción, entidad, admin y fechas, paginación y metadata serializada como JSON seguro.

## Eventos instrumentados

Se registran, después de completar la escritura primaria:

- login correcto e incorrecto, cambio de contraseña y revocación de sesiones;
- alta, baja y cambios de acceso/RBAC de administradores;
- páginas: creación, guardado, restauración, publicación, visibilidad y borrado;
- ajustes, módulos, menú, categorías y platos;
- mensajes: marcar leído y borrar;
- subida y generación de imágenes.

Las lecturas normales no generan eventos. Las acciones siguen la convención `dominio.verbo`, por ejemplo `page.publish` o `admin.access_update`.

## Operación y límites

Los eventos no son fuente transaccional de verdad: el estado real permanece en la tabla de la mutación. La IP usa el primer valor de `x-forwarded-for` o `x-real-ip`; el proxy de despliegue debe configurar esos headers de forma confiable. La retención/archivado debe gestionarse fuera del CMS mediante una política explícita.

Si una instalación aún no tiene la migración, las operaciones continúan pero los logs contienen `[audit]`; aplicar la migración y revisar esa señal. No incluir secretos de `.env.local`, cookies, contraseñas o claves en logs, fixtures o eventos.

## Pruebas

`src/lib/audit.test.ts` prueba sanitización, construcción de eventos y autorización sin conectar a una base real. Verificación completa:

```bash
bun run test
bun run typecheck
bun run lint
bun run build
git diff --check
```

Este cambio no implementa caché, transacciones, media library, accesibilidad de imágenes, templates, SEO, i18n ni Google Analytics.

## Extensión

Toda nueva server action que cambie datos debe llamar a `recordCurrentAdminAudit` tras la operación y pasar únicamente metadata mínima no sensible.
