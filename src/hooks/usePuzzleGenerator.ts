import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { generatePuzzleImage } from '@/app/actions/puzzle';
import { calculateGrid } from '@/utils/puzzleHelpers';
import {
  createPuzzleState,
  renderPuzzlePieces,
  PuzzleState,
  PieceData,
} from '@/utils/puzzleGenerator';
import { DIFFICULTY_SETTINGS, Difficulty } from '@/constants/puzzle';

export function usePuzzleGenerator(
  onPuzzleCreated: (
    state: PuzzleState,
    pieces: PieceData[],
  ) => Promise<void> | void,
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // 🚨 렌더링 최적화: 부모 컴포넌트(PuzzleApp)에서 인라인 함수를 넘길 때 
  // 매번 내부 useCallback이 깨지는(재생성되는) Anti-pattern을 방지하기 위한 Ref 보관 기법
  const onPuzzleCreatedRef = useRef(onPuzzleCreated);
  useEffect(() => {
    onPuzzleCreatedRef.current = onPuzzleCreated;
  }, [onPuzzleCreated]);

  const createPuzzleFromImage = useCallback(
    async (imageUrl: string, difficulty: Difficulty) => {
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

      await onPuzzleCreatedRef.current(newState, renderedPieces);
    },
    [], // 이제 deps를 완전히 비울 수 있어 함수가 절대 재생성되지 않습니다!
  );

  const generateAI = useCallback(
    (prompt: string, aspectRatio: string, difficulty: Difficulty) => {
      setError('');
      startTransition(async () => {
        try {
          const result = await generatePuzzleImage(prompt, aspectRatio, difficulty === 'hard');

          if (!result.success || !result.imageUrl) {
            throw new Error(result.error || 'Failed to generate image');
          }

          await createPuzzleFromImage(result.imageUrl, difficulty);
        } catch (err: unknown) {
          console.error('Error in generateAI:', err);
          setError(
            err instanceof Error ? err.message : 'An unknown error occurred',
          );
        }
      });
    },
    [createPuzzleFromImage],
  );

  const generatePreset = useCallback(
    (imageUrl: string, difficulty: Difficulty) => {
      setError('');
      startTransition(async () => {
        try {
          await createPuzzleFromImage(imageUrl, difficulty);
        } catch (err: unknown) {
          console.error('Error in generatePreset:', err);
          setError(
            err instanceof Error ? err.message : 'An unknown error occurred',
          );
        }
      });
    },
    [createPuzzleFromImage],
  );

  return {
    loading: isPending,
    error,
    setError,
    generateAI,
    generatePreset,
  };
}
