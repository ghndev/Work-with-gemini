import { useState, useEffect, useRef } from 'react';
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function initializePuzzle() {
      try {
        const savedState = await get<PuzzleState>('savedPuzzle');
        if (!savedState) return;

        const renderedPieces = await renderPuzzlePieces(savedState);
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
        isInitialized.current = true;
      }
    }

    initializePuzzle();
  }, []);

  useEffect(() => {
    if (!isInitialized.current || !puzzleState) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      set('savedPuzzle', puzzleState).catch(console.error);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [puzzleState]);

  const updatePieces = (newPieces: PieceData[]) => {
    setPieces(newPieces);

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
  };

  const loadNewPuzzle = async (
    newState: PuzzleState,
    renderedPieces: PieceData[],
  ) => {
    setPuzzleState(newState);
    setPieces(renderedPieces);
    setPuzzleId((prev) => prev + 1);
    setShowPuzzle(true);
    await set('savedPuzzle', newState);
  };

  const giveUp = async () => {
    try {
      await del('savedPuzzle');
    } catch (e) {
      console.error('Error deleting saved puzzle:', e);
    }
    setPieces(null);
    setPuzzleState(null);
    setShowPuzzle(false);
  };

  const clearSave = async () => {
    try {
      await del('savedPuzzle');
    } catch (e) {
      console.error('Error clearing saved puzzle:', e);
    }
  };

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
