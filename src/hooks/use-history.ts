import { useCallback, useState } from "react";
import {
  canRedo as canRedoState,
  canUndo as canUndoState,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type HistoryState,
} from "@/lib/history";

// Hook fino que envuelve la lógica pura de @/lib/history en estado de React.
// Expone el historial, push/undo/redo y flags para deshabilitar botones.

export function useHistory<T>(initial: T, limit = 50) {
  const [state, setState] = useState<HistoryState<T>>(() => createHistory(initial));

  const push = useCallback((next: T) => setState((s) => pushHistory(s, next, limit)), [limit]);
  const undo = useCallback(() => setState((s) => undoHistory(s)), []);
  const redo = useCallback(() => setState((s) => redoHistory(s)), []);

  return {
    state,
    push,
    undo,
    redo,
    canUndo: canUndoState(state),
    canRedo: canRedoState(state),
  };
}
