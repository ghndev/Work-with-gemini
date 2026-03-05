import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';
import { PieceData, PuzzleState, renderPuzzlePieces } from '@/utils/puzzleGenerator';

export function usePuzzleState() {
  const [pieces, setPieces] = useState<PieceData[] | null>(null);
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [puzzleId, setPuzzleId] = useState(0);
  const [showPuzzle, setShowPuzzle] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedState = (await get('savedPuzzle')) as PuzzleState | undefined;
        if (savedState) {
          const renderedPieces = await renderPuzzlePieces(savedState);
          setPuzzleState(savedState);
          setPieces(renderedPieces);
        }
      } catch (e) {
        console.error('Failed to load saved puzzle', e);
        try {
          await del('savedPuzzle');
        } catch {
          // Ignore errors removing saved puzzle
        }
      }
    })();
  }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  
  const debouncedSave = useMemo(
    () => (state: PuzzleState) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        set('savedPuzzle', state).catch(console.error);
      }, 500);
    },
    [],
  );

  const updatePieces = useCallback((newPieces: PieceData[]) => {
    setPieces(newPieces);
    setPuzzleState((currentState) => {
      if (!currentState) return null;
      const updatedState = {
        ...currentState,
        pieces: newPieces.map((p) => ({
          id: p.id,
          groupId: p.groupId,
          x: p.x,
          y: p.y,
          col: p.col,
          row: p.row,
        })),
      };
      debouncedSave(updatedState);
      return updatedState;
    });
  }, [debouncedSave]);

  const loadNewPuzzle = useCallback(async (newState: PuzzleState, renderedPieces: PieceData[]) => {
    setPuzzleState(newState);
    setPieces(renderedPieces);
    setPuzzleId((prev) => prev + 1);
    setShowPuzzle(true);
    await set('savedPuzzle', newState);
  }, []);

  const giveUp = useCallback(async () => {
    if (
      window.confirm(
        'Are you sure you want to give up? All current puzzle progress will be lost.',
      )
    ) {
      try {
        await del('savedPuzzle');
      } catch (e) {
        console.error('Failed to delete saved puzzle', e);
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
      console.error(e);
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
