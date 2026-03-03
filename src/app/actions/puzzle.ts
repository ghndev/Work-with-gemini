'use server';

import { GoogleGenAI } from '@google/genai';

export async function generatePuzzleImage(prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.MY_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
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
