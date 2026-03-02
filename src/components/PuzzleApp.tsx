"use client";

import { useState, useEffect } from 'react';
import { createPuzzleState, renderPuzzlePieces, PieceData, PuzzleState } from '@/utils/puzzleGenerator';
import { Loader2, Sparkles, Image as ImageIcon, Play } from 'lucide-react';
import { get, set, del } from 'idb-keyval';
import dynamic from 'next/dynamic';
import { generatePuzzleImage } from '@/app/actions/puzzle';

const PuzzleBoard = dynamic(() => import('./PuzzleBoard'), { 
  ssr: false 
});

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_SETTINGS = {
  easy: { cols: 4, rows: 4, label: 'Easy', pieces: 16 },
  medium: { cols: 8, rows: 8, label: 'Medium', pieces: 64 },
  hard: { cols: 12, rows: 12, label: 'Hard', pieces: 144 },
};

export default function PuzzleApp() {
  const [prompt, setPrompt] = useState('A serene watercolor forest');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [loading, setLoading] = useState(false);
  const [pieces, setPieces] = useState<PieceData[] | null>(null);
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [error, setError] = useState('');
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [puzzleId, setPuzzleId] = useState(0);

  useEffect(() => {
    get('savedPuzzle').then(async (savedState: PuzzleState | undefined) => {
      if (savedState) {
        try {
          const renderedPieces = await renderPuzzlePieces(savedState);
          setPuzzleState(savedState);
          setPieces(renderedPieces);
        } catch (e) {
          console.error('Failed to load saved puzzle', e);
          del('savedPuzzle');
        }
      }
    });
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generatePuzzleImage(prompt);
      
      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Failed to generate image');
      }

      const { cols, rows } = DIFFICULTY_SETTINGS[difficulty];

      const newState = await createPuzzleState(result.imageUrl, cols, rows);
      const renderedPieces = await renderPuzzlePieces(newState);
      
      setPuzzleState(newState);
      setPieces(renderedPieces);
      setPuzzleId(prev => prev + 1);
      setShowPuzzle(true);
      
      await set('savedPuzzle', newState);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePiecesChange = (newPieces: PieceData[]) => {
    setPieces(newPieces);
    if (puzzleState) {
      const updatedState = {
        ...puzzleState,
        pieces: newPieces.map(p => ({
          id: p.id,
          groupId: p.groupId,
          x: p.x,
          y: p.y,
          col: p.col,
          row: p.row
        }))
      };
      setPuzzleState(updatedState);
      set('savedPuzzle', updatedState).catch(console.error);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 bg-zinc-950 ${showPuzzle ? 'block' : 'hidden'}`}>
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
          className="absolute top-4 left-4 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-colors z-10"
        >
          Back
        </button>
      </div>

      <div className={`min-h-screen flex-col items-center justify-center p-6 ${showPuzzle ? 'hidden' : 'flex'}`}>
        
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-serif tracking-tight text-white">Aura Puzzles</h1>
            <p className="text-zinc-400">Generate a beautiful, boardless puzzle with AI.</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your puzzle..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 pl-12 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
              />
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            </div>

            <div className="flex bg-zinc-900 p-1.5 rounded-full border border-zinc-800">
              {(Object.entries(DIFFICULTY_SETTINGS) as [Difficulty, typeof DIFFICULTY_SETTINGS[Difficulty]][]).map(([key, setting]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={`flex-1 py-2.5 px-4 rounded-full transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                    difficulty === key
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <span>{setting.label}</span>
                  <span className="text-xs opacity-60 font-normal hidden sm:inline">{setting.pieces} pcs</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="flex-1 bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {pieces ? 'New Puzzle' : 'Create Puzzle'}
                  </>
                )}
              </button>

              {pieces && (
                <button
                  onClick={() => setShowPuzzle(true)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Resume
                </button>
              )}
            </div>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
}