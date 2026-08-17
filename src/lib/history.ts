// Historial undo/redo genérico y puro (sin React): pila de estados pasados y
// futuros alrededor del estado presente. Las funciones reciben el estado y
// devuelven uno nuevo (reducer puro), por lo que son testeables sin React.

export type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

export function createHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [] };
}

/**
 * Registra `next` como nuevo estado presente, moviendo el actual a `past`.
 * Descartar el futuro (una mutación tras deshacer invalida el redo).
 * Si `next` es la misma referencia que el presente, no hace nada.
 */
export function pushHistory<T>(state: HistoryState<T>, next: T, limit = 50): HistoryState<T> {
  if (state.present === next) return state;
  const past = [...state.past, state.present];
  if (past.length > limit) past.splice(0, past.length - limit);
  return { past, present: next, future: [] };
}

/** Vuelve al estado anterior. No-op si no hay historial pasado. */
export function undoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.past.length === 0) return state;
  const present = state.past[state.past.length - 1];
  return {
    past: state.past.slice(0, -1),
    present,
    future: [state.present, ...state.future],
  };
}

/** Reaplica el siguiente estado deshecho. No-op si no hay historial futuro. */
export function redoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.future.length === 0) return state;
  const [present, ...future] = state.future;
  return { past: [...state.past, state.present], present, future };
}

export function canUndo<T>(state: HistoryState<T>): boolean {
  return state.past.length > 0;
}

export function canRedo<T>(state: HistoryState<T>): boolean {
  return state.future.length > 0;
}
