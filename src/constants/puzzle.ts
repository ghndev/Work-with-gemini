export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_SETTINGS = {
  easy: { cols: 4, rows: 4, label: 'Easy', pieces: 16 },
  medium: { cols: 8, rows: 8, label: 'Medium', pieces: 64 },
  hard: { cols: 12, rows: 12, label: 'Hard', pieces: 144 },
};

export const getEstimatedPieceCount = (targetPieces: number, ratio: string) => {
  if (ratio === '1:1') return targetPieces;
  const [w, h] = ratio.split(':').map(Number);
  const pieceSize = Math.sqrt((w * h) / targetPieces);
  const cols = Math.max(2, Math.round(w / pieceSize));
  const rows = Math.max(2, Math.round(h / pieceSize));
  return cols * rows;
};

export const PRESET_GALLERY: Record<
  Difficulty,
  { id: string; url: string; label: string }[]
> = {
  easy: [
    {
      id: 'e1',
      url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&h=900&auto=format&fit=crop',
      label: 'Abstract Paint',
    },
    {
      id: 'e2',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&h=900&auto=format&fit=crop',
      label: 'Serene Nature',
    },
    {
      id: 'e3',
      url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1200&h=900&auto=format&fit=crop',
      label: 'Clear Sky Pattern',
    },
  ],
  medium: [
    {
      id: 'm1',
      url: 'https://images.unsplash.com/photo-1470071131384-001b85755536?q=80&w=1200&h=900&auto=format&fit=crop',
      label: 'Beautiful Landscape',
    },
    {
      id: 'm2',
      url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1200&h=900&auto=format&fit=crop',
      label: 'Mountains',
    },
    {
      id: 'm3',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&h=900&auto=format&fit=crop',
      label: 'Ocean Waves',
    },
  ],
  hard: [
    {
      id: 'h1',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=90&w=2400&h=1800&auto=format&fit=crop',
      label: 'Dense Forest',
    },
    {
      id: 'h2',
      url: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=90&w=2400&h=1800&auto=format&fit=crop',
      label: 'City Night Lights',
    },
    {
      id: 'h3',
      url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=90&w=2400&h=1800&auto=format&fit=crop',
      label: 'Intricate Crystals',
    },
  ],
};
