import { useState, useCallback } from 'react';
import { generatePuzzleImage } from '@/app/actions/puzzle';
import { calculateGrid } from '@/utils/puzzleHelpers';
import { createPuzzleState, renderPuzzlePieces, PuzzleState, PieceData } from '@/utils/puzzleGenerator';
import { DIFFICULTY_SETTINGS, Difficulty } from '@/constants/puzzle';

export function usePuzzleGenerator(
  onPuzzleCreated: (state: PuzzleState, pieces: PieceData[]) => Promise<void> | void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createPuzzleFromImage = useCallback(async (imageUrl: string, difficulty: Difficulty) => {
    const { pieces } = DIFFICULTY_SETTINGS[difficulty];
    const { cols: computedCols, rows: computedRows } = await calculateGrid(
      imageUrl,
      pieces,
    );

    const newState = await createPuzzleState(
      imageUrl,
      computedCols,
      computedRows,
    );
    const renderedPieces = await renderPuzzlePieces(newState);
    
    await onPuzzleCreated(newState, renderedPieces);
  }, [onPuzzleCreated]);

  const generateAI = useCallback(async (prompt: string, aspectRatio: string, difficulty: Difficulty) => {
    setLoading(true);
    setError('');
    try {
      const result = await generatePuzzleImage(prompt, aspectRatio);

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Failed to generate image');
      }

      await createPuzzleFromImage(result.imageUrl, difficulty);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [createPuzzleFromImage]);

  const generatePreset = useCallback(async (imageUrl: string, difficulty: Difficulty) => {
    setLoading(true);
    setError('');
    try {
      await createPuzzleFromImage(imageUrl, difficulty);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [createPuzzleFromImage]);

  return {
    loading,
    error,
    setError,
    generateAI,
    generatePreset,
  };
}
