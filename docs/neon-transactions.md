# Transacciones de escritura con Neon HTTP

`src/lib/db.ts` expone `runDbTransaction`, que delega en `sql.transaction` de
`@neondatabase/serverless`. El driver envía el lote como una única transacción
PostgreSQL no interactiva: si una query falla, Neon hace rollback de todas las
queries del lote y no se ejecutan los efectos `afterCommit`.

## Limitaciones

- Las queries deben construirse antes de invocar `transaction`; el callback del
driver es síncrono y debe devolver un array de queries. No se puede hacer
`await` entre queries para usar el resultado de la anterior.
- Para dependencias entre escrituras se usa una única sentencia SQL con CTEs,
o se pasan valores conocidos al construir el lote. `saveMenu`, por ejemplo,
usa `TRUNCATE` y un CTE parametrizado para insertar categorías e ítems.
- La transacción HTTP es apropiada para estos lotes cortos de escritura, pero
no sustituye una sesión interactiva para flujos que necesiten cursores,
`SAVEPOINT` o lecturas intermedias. No se ejecutan seeds ni DDL mediante esta
capa.
- Los fragmentos `sql.unsafe` solo pueden contener constantes de esquema bajo
control del servidor. Los datos del CMS siempre se interpolan como parámetros
con tagged templates.
- La invalidación de cache y la auditoría se ejecutan después de que la
promesa transaccional resuelve. Un fallo de auditoría se registra y no revierte
la operación principal.

Los tests unitarios cubren el agrupamiento, el orden del lote y que un rechazo
no dispare invalidaciones; no requieren una base Neon real.

Referencia instalada: `node_modules/@neondatabase/serverless/CONFIG.md`,
sección `transaction(...)`.
