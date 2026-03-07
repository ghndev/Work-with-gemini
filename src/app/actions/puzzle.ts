'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { userPuzzles } from '@/db/schema';
import { GoogleGenAI } from '@google/genai';
import { puzzleRateLimit } from '@/utils/rateLimit';
import { eq, and } from 'drizzle-orm';

const MAX_PROMPT_LENGTH = 500;
const VALID_ASPECT_RATIOS = ['1:1', '16:9', '9:16'] as const;

export async function generatePuzzleImage(
  prompt: string,
  aspectRatio: string = '1:1',
  difficulty: 'easy' | 'medium' | 'hard' = 'easy',
) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: 'Authentication required' };
  }

  const identifier = session.user.id || session.user.email || 'anonymous';
  const { success: isAllowed, reset } = await puzzleRateLimit.limit(
    `puzzle_${identifier}`,
  );

  if (!isAllowed) {
    const resetMinutes = Math.max(
      1,
      Math.ceil((reset - Date.now()) / 1000 / 60),
    );
    return {
      success: false,
      error: `Too many requests. Please try again in ${resetMinutes} minute(s).`,
    };
  }

  const trimmed = prompt.trim();
  if (!trimmed || trimmed.length > MAX_PROMPT_LENGTH) {
    return {
      success: false,
      error: `Prompt must be 1-${MAX_PROMPT_LENGTH} characters`,
    };
  }

  if (
    !VALID_ASPECT_RATIOS.includes(
      aspectRatio as (typeof VALID_ASPECT_RATIOS)[number],
    )
  ) {
    return { success: false, error: 'Invalid aspect ratio' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [{ text: trimmed }],
      },
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
          ...(difficulty === 'hard' ? { imageSize: '2K' } : {}),
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData,
    )?.inlineData;

    if (!inlineData) {
      return {
        success: false,
        error: 'Failed to generate image (maybe copyright issue)',
      };
    }

    const imageUrl = `data:${inlineData.mimeType};base64,${inlineData.data}`;
    let puzzleRecordId: string | undefined;

    if (session.user.id) {
      const [newPuzzle] = await db
        .insert(userPuzzles)
        .values({
          userId: session.user.id,
          prompt: trimmed,
          imageUrl,
          difficulty,
          status: 'playing',
        })
        .returning({ id: userPuzzles.id });

      puzzleRecordId = newPuzzle?.id;
    }

    return {
      success: true,
      imageUrl,
      puzzleRecordId,
    };
  } catch (error: unknown) {
    console.error('Error generating puzzle image:', error);
    return {
      success: false,
      error:
        'An error occurred while generating the puzzle image. Please try again later.',
    };
  }
}

export async function completePuzzle(puzzleRecordId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Authentication required' };
  }

  try {
    const puzzle = await db.query.userPuzzles.findFirst({
      where: and(
        eq(userPuzzles.id, puzzleRecordId),
        eq(userPuzzles.userId, session.user.id),
      ),
    });

    if (!puzzle) {
      return { success: false, error: 'Puzzle not found' };
    }

    if (puzzle.status !== 'playing') {
      return { success: false, error: 'Puzzle is already completed' };
    }

    const now = new Date();
    const startedAt = new Date(puzzle.startedAt);
    const timeTaken = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    let minTime = 0;
    if (puzzle.difficulty === 'easy') {
      minTime = 10;
    } else if (puzzle.difficulty === 'hard') {
      minTime = 120;
    } else if (puzzle.difficulty === 'medium') {
      minTime = 30;
    }

    if (timeTaken < minTime) {
      return {
        success: false,
        error: `Abuse detected: Time taken (${timeTaken}s) is too short for ${puzzle.difficulty} difficulty.`,
      };
    }

    await db
      .update(userPuzzles)
      .set({
        status: 'completed',
        completedAt: now,
        timeTaken,
      })
      .where(eq(userPuzzles.id, puzzleRecordId));

    return {
      success: true,
      timeTaken,
    };
  } catch (error: unknown) {
    console.error('Error completing puzzle:', error);
    return {
      success: false,
      error: 'An error occurred while saving the puzzle score.',
    };
  }
}

export async function abandonPuzzle(puzzleRecordId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Authentication required' };
  }

  try {
    const puzzle = await db.query.userPuzzles.findFirst({
      where: and(
        eq(userPuzzles.id, puzzleRecordId),
        eq(userPuzzles.userId, session.user.id),
      ),
    });

    if (!puzzle) {
      return { success: false, error: 'Puzzle not found' };
    }

    if (puzzle.status !== 'playing') {
      return {
        success: false,
        error: 'Puzzle cannot be abandoned from current state',
      };
    }

    await db
      .update(userPuzzles)
      .set({
        status: 'abandoned',
      })
      .where(eq(userPuzzles.id, puzzleRecordId));

    return { success: true };
  } catch (error: unknown) {
    console.error('Error abandoning puzzle:', error);
    return {
      success: false,
      error: 'An error occurred while abandoning the puzzle.',
    };
  }
}
