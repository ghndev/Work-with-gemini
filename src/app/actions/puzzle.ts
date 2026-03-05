'use server';

import { auth } from '@/auth';
import { GoogleGenAI } from '@google/genai';

const MAX_PROMPT_LENGTH = 500;
const VALID_ASPECT_RATIOS = ['1:1', '16:9', '9:16'] as const;

export async function generatePuzzleImage(
  prompt: string,
  aspectRatio: string = '1:1',
) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: 'Authentication required' };
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
          imageSize: '1K',
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

    return {
      success: true,
      imageUrl: `data:${inlineData.mimeType};base64,${inlineData.data}`,
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
