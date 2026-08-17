/**
 * Ejecuta un lote como una única transacción y solo dispara efectos externos
 * después de que el driver confirme el commit.
 *
 * Neon HTTP transactions son no interactivas: las queries deben construirse
 * antes de llamar al runner. Si una falla, Neon hace rollback del lote completo.
 */
export async function runTransaction<TQuery, TResult>(
  runner: (queries: readonly TQuery[]) => Promise<TResult>,
  queries: readonly TQuery[],
  afterCommit?: () => void | Promise<void>,
): Promise<TResult> {
  const result = await runner(queries);
  await afterCommit?.();
  return result;
}
