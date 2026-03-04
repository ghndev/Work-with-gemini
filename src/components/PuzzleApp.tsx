'use client';

import { useState, useEffect } from 'react';
import {
  createPuzzleState,
  renderPuzzlePieces,
  PieceData,
  PuzzleState,
} from '@/utils/puzzleGenerator';
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Play,
  GalleryHorizontalEnd,
  ArrowLeft,
  Settings2,
} from 'lucide-react';
import { get, set, del } from 'idb-keyval';
import dynamic from 'next/dynamic';
import { generatePuzzleImage } from '@/app/actions/puzzle';

const PuzzleBoard = dynamic(() => import('./PuzzleBoard'), {
  ssr: false,
});

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_SETTINGS = {
  easy: { cols: 4, rows: 4, label: 'Easy', pieces: 16 },
  medium: { cols: 8, rows: 8, label: 'Medium', pieces: 64 },
  hard: { cols: 12, rows: 12, label: 'Hard', pieces: 144 },
};

const getEstimatedPieceCount = (targetPieces: number, ratio: string) => {
  if (ratio === '1:1') return targetPieces;
  const [w, h] = ratio.split(':').map(Number);
  const pieceSize = Math.sqrt((w * h) / targetPieces);
  const cols = Math.max(2, Math.round(w / pieceSize));
  const rows = Math.max(2, Math.round(h / pieceSize));
  return cols * rows;
};

const PRESET_GALLERY: Record<
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

// Helper to calculate dynamic cols and rows based on actual image aspect ratio
const calculateGrid = (
  imageUrl: string,
  targetPieces: number,
): Promise<{ cols: number; rows: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const totalArea = img.width * img.height;
      const pieceArea = totalArea / targetPieces;
      const pieceSize = Math.sqrt(pieceArea);

      // Force pieces to be exactly square by dividing total width/height by the target piece size
      const cols = Math.max(2, Math.round(img.width / pieceSize));
      const rows = Math.max(2, Math.round(img.height / pieceSize));

      resolve({ cols, rows });
    };
    img.onerror = () =>
      reject(new Error('Failed to load image to calculate aspect ratio'));
    img.src = imageUrl;
  });
};

export default function PuzzleApp({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [prompt, setPrompt] = useState('A serene watercolor forest');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [pieces, setPieces] = useState<PieceData[] | null>(null);
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [error, setError] = useState('');
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [puzzleId, setPuzzleId] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const savedState = (await get('savedPuzzle')) as
          | PuzzleState
          | undefined;
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

  const loadPuzzleBoard = async (
    imageUrl: string,
    targetDifficulty: Difficulty,
  ) => {
    const { pieces } = DIFFICULTY_SETTINGS[targetDifficulty];
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

    setPuzzleState(newState);
    setPieces(renderedPieces);
    setPuzzleId((prev) => prev + 1);
    setShowPuzzle(true);

    await set('savedPuzzle', newState);
  };

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      setError('You must be logged in to generate AI puzzles.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await generatePuzzleImage(prompt, aspectRatio);

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Failed to generate image');
      }

      await loadPuzzleBoard(result.imageUrl, difficulty);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePiecesChange = (newPieces: PieceData[]) => {
    setPieces(newPieces);
    if (puzzleState) {
      const updatedState = {
        ...puzzleState,
        pieces: newPieces.map((p) => ({
          id: p.id,
          groupId: p.groupId,
          x: p.x,
          y: p.y,
          col: p.col,
          row: p.row,
        })),
      };
      setPuzzleState(updatedState);
      set('savedPuzzle', updatedState).catch(console.error);
    }
  };

  const handlePresetSelect = async (
    imageUrl: string,
    selectedDifficulty: Difficulty,
  ) => {
    setLoading(true);
    setError('');
    setDifficulty(selectedDifficulty);
    setShowGallery(false);

    try {
      await loadPuzzleBoard(imageUrl, selectedDifficulty);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGiveUp = async () => {
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
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-zinc-950 ${showGallery ? 'block' : 'hidden'} overflow-y-auto`}
      >
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-white">Preset Gallery</h2>
            <button
              onClick={() => setShowGallery(false)}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>

          <div className="space-y-12">
            {(
              Object.entries(PRESET_GALLERY) as [
                Difficulty,
                (typeof PRESET_GALLERY)[Difficulty],
              ][]
            ).map(([diffKey, images]) => (
              <section key={diffKey}>
                <div className="mb-4 flex items-baseline gap-3">
                  <h3 className="text-xl font-medium text-white capitalize">
                    {diffKey}
                  </h3>
                  <span className="text-sm text-zinc-500">
                    (
                    {getEstimatedPieceCount(
                      DIFFICULTY_SETTINGS[diffKey].pieces,
                      '4:3',
                    )}{' '}
                    pieces)
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {images.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.url, diffKey)}
                      className="group relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-zinc-800 transition-all hover:border-zinc-500"
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                        <Play className="mb-2 h-10 w-10 text-white" />
                        <span className="font-medium text-white">
                          {preset.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-zinc-950 ${showPuzzle ? 'block' : 'hidden'}`}
      >
        {pieces && showPuzzle && (
          <PuzzleBoard
            key={puzzleId}
            initialPieces={pieces}
            onChange={handlePiecesChange}
            onComplete={() => {
              console.log('Win!');
              del('savedPuzzle');
            }}
          />
        )}
        <button
          onClick={() => setShowPuzzle(false)}
          className="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-4 py-2 text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          Back
        </button>
        <button
          onClick={handleGiveUp}
          className="absolute bottom-6 left-6 z-10 rounded-full bg-red-500/20 px-4 py-2 text-sm text-red-200 backdrop-blur-md transition-colors hover:bg-red-500/40"
        >
          Give Up
        </button>
      </div>

      <div
        className={`min-h-screen flex-col items-center justify-center p-6 ${showPuzzle ? 'hidden' : 'flex'}`}
      >
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="font-serif text-4xl tracking-tight text-white">
              Aura Puzzles
            </h1>
            <p className="text-zinc-400">
              Generate a beautiful, borderless puzzle
              <br />
              with AI using{' '}
              <span className="font-medium text-zinc-300">
                gemini-3.1-flash-image-preview
              </span>
              .
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  isLoggedIn
                    ? 'Describe your puzzle...'
                    : 'Login to create AI puzzles'
                }
                disabled={!isLoggedIn}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 pl-12 text-zinc-100 placeholder-zinc-500 transition-all focus:ring-2 focus:ring-zinc-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <ImageIcon className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            </div>

            {!isLoggedIn && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center text-sm text-zinc-400">
                <span className="mb-2 block">
                  AI Generation is currently locked.
                </span>
                Please sign in to generate custom AI puzzles, or choose a preset
                image from the gallery below to play now!
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span>Puzzle Settings</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} •{' '}
                  {aspectRatio}
                </span>
              </button>

              {showSettings && (
                <div className="space-y-4 border-t border-zinc-800 bg-zinc-900/30 p-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500">
                      Aspect Ratio
                    </label>
                    <div className="flex rounded-full border border-zinc-800 bg-zinc-900 p-1.5">
                      {[
                        { value: '1:1', label: 'Square (1:1)' },
                        { value: '16:9', label: '16:9 Wide' },
                        { value: '9:16', label: '9:16 Tall' },
                      ].map((ratio) => (
                        <button
                          key={ratio.value}
                          onClick={() => setAspectRatio(ratio.value)}
                          disabled={!isLoggedIn}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                            aspectRatio === ratio.value
                              ? 'bg-zinc-700 text-white shadow-sm'
                              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500">
                      Difficulty
                    </label>
                    <div className="flex rounded-full border border-zinc-800 bg-zinc-900 p-1.5">
                      {(
                        Object.entries(DIFFICULTY_SETTINGS) as [
                          Difficulty,
                          (typeof DIFFICULTY_SETTINGS)[Difficulty],
                        ][]
                      ).map(([key, setting]) => (
                        <button
                          key={key}
                          onClick={() => setDifficulty(key)}
                          disabled={!isLoggedIn}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                            difficulty === key
                              ? 'bg-zinc-700 text-white shadow-sm'
                              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                          }`}
                        >
                          <span>{setting.label}</span>
                          <span className="hidden text-xs font-normal opacity-60 sm:inline">
                            {getEstimatedPieceCount(
                              setting.pieces,
                              aspectRatio,
                            )}{' '}
                            pcs
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt || !isLoggedIn}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-4 font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    {pieces ? 'New Puzzle' : 'Create AI Puzzle'}
                  </>
                )}
              </button>

              {pieces && (
                <button
                  onClick={() => setShowPuzzle(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-800 py-4 font-medium text-white transition-colors hover:bg-zinc-700"
                >
                  <Play className="h-5 w-5" />
                  Resume
                </button>
              )}
            </div>

            <button
              onClick={() => setShowGallery(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 py-4 font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <GalleryHorizontalEnd className="h-5 w-5" />
              Open Preset Gallery
            </button>

            {error && (
              <p className="text-center text-sm text-red-400">{error}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
