'use server';

import { GoogleGenAI } from '@google/genai';

export async function generatePuzzleImage(
  prompt: string,
  aspectRatio: string = '1:1',
) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: '1K',
        },
      },
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error('Failed to generate image');

    return { success: true, imageUrl };
  } catch (error: any) {
    console.error('Error generating puzzle image:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}
