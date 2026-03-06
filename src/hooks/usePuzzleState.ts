import { useState, useEffect, useRef, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';
import {
  PieceData,
  PuzzleState,
  renderPuzzlePieces,
} from '@/utils/puzzleGenerator';

export function usePuzzleState() {
  const [pieces, setPieces] = useState<PieceData[] | null>(null);
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [puzzleId, setPuzzleId] = useState(0);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const isInitialized = useRef(false);

  // Load saved puzzle on mount
  useEffect(() => {
    let isMounted = true;

    async function initializePuzzle() {
      try {
        const savedState = await get<PuzzleState>('savedPuzzle');
        if (!savedState || !isMounted) return;

        const renderedPieces = await renderPuzzlePieces(savedState);
        if (!isMounted) return;

        setPuzzleState(savedState);
        setPieces(renderedPieces);
      } catch (e) {
        console.error('Error loading saved puzzle:', e);
        try {
          await del('savedPuzzle');
        } catch {
          /* ignore */
        }
      } finally {
        if (isMounted) {
          isInitialized.current = true;
        }
      }
    }

    initializePuzzle();
    return () => {
      isMounted = false;
    };
  }, []);

  // Autosave when puzzleState changes
  useEffect(() => {
    if (!isInitialized.current || !puzzleState) return;

    const timeoutId = setTimeout(() => {
      set('savedPuzzle', puzzleState).catch(console.error);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [puzzleState]);

  const updatePieces = useCallback((newPieces: PieceData[]) => {
    setPieces(newPieces);

    // Pure state updater: no side-effects allowed inside
    setPuzzleState((currentState) => {
      if (!currentState) return null;
      return {
        ...currentState,
        pieces: newPieces.map(({ id, groupId, x, y, col, row }) => ({
          id,
          groupId,
          x,
          y,
          col,
          row,
        })),
      };
    });
  }, []);

  const loadNewPuzzle = useCallback(
    async (newState: PuzzleState, renderedPieces: PieceData[]) => {
      setPuzzleState(newState);
      setPieces(renderedPieces);
      setPuzzleId((prev) => prev + 1);
      setShowPuzzle(true);
      await set('savedPuzzle', newState);
    },
    [],
  );

  const giveUp = useCallback(async () => {
    if (
      window.confirm(
        'Are you sure you want to give up? All current puzzle progress will be lost.',
      )
    ) {
      try {
        await del('savedPuzzle');
      } catch (e) {
        console.error('Error deleting saved puzzle:', e);
      }
      setPieces(null);
      setPuzzleState(null);
      setShowPuzzle(false);
    }
  }, []);

  const clearSave = useCallback(async () => {
    try {
      await del('savedPuzzle');
    } catch (e) {
      console.error('Error clearing saved puzzle:', e);
    }
  }, []);

  return {
    pieces,
    puzzleState,
    puzzleId,
    showPuzzle,
    setShowPuzzle,
    updatePieces,
    loadNewPuzzle,
    giveUp,
    clearSave,
  };
}
