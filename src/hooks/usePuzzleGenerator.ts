import { generatePuzzleImage } from '@/app/actions/puzzle';
import { calculateGrid } from '@/utils/puzzleHelpers';
import {
  createPuzzleState,
  renderPuzzlePieces,
  PuzzleState,
  PieceData,
} from '@/utils/puzzleGenerator';
import { DIFFICULTY_SETTINGS, Difficulty } from '@/constants/puzzle';

export type AIActionState = {
  error: string | null;
  success: boolean;
};

export function usePuzzleGenerator(
  onPuzzleCreated: (
    state: PuzzleState,
    pieces: PieceData[],
  ) => Promise<void> | void,
) {
  const createPuzzleFromImage = async (
    imageUrl: string,
    difficulty: Difficulty,
  ) => {
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
  };

  const generateAIAction = async (
    prevState: AIActionState,
    formData: FormData,
  ): Promise<AIActionState> => {
    const prompt = formData.get('prompt') as string;
    const aspectRatio = formData.get('aspectRatio') as string;
    const difficulty = formData.get('difficulty') as Difficulty;

    if (!prompt) return { error: 'Prompt is required', success: false };

    try {
      const result = await generatePuzzleImage(
        prompt,
        aspectRatio,
        difficulty === 'hard',
      );

      if (!result.success || !result.imageUrl) {
        return {
          error: result.error || 'Failed to generate image',
          success: false,
        };
      }

      await createPuzzleFromImage(result.imageUrl, difficulty);
      return { error: null, success: true };
    } catch (err: unknown) {
      console.error('Error in generateAI:', err);
      return {
        error: err instanceof Error ? err.message : 'An unknown error occurred',
        success: false,
      };
    }
  };

  const generatePreset = async (imageUrl: string, difficulty: Difficulty) => {
    try {
      await createPuzzleFromImage(imageUrl, difficulty);
    } catch (err: unknown) {
      console.error('Error in generatePreset:', err);
      throw err;
    }
  };

  return {
    generateAIAction,
    generatePreset,
  };
}
