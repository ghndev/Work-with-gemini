'use client';

import { useState, useActionState, useTransition } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Play,
  GalleryHorizontalEnd,
  Settings2,
} from 'lucide-react';
import { usePuzzleState } from '@/hooks/usePuzzleState';
import { usePuzzleGenerator } from '@/hooks/usePuzzleGenerator';
import { completePuzzle } from '@/app/actions/puzzle';
import { PresetGallery } from './PresetGallery';
import {
  Difficulty,
  DIFFICULTY_SETTINGS,
  getEstimatedPieceCount,
} from '@/constants/puzzle';
import { SubmitButton } from './SubmitButton';
import PuzzleBoard from './PuzzleBoard';

export default function PuzzleApp({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [showSettings, setShowSettings] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showConfirmGiveUp, setShowConfirmGiveUp] = useState(false);
  const [isPresetPending, startPresetTransition] = useTransition();

  const {
    pieces,
    puzzleState,
    puzzleId,
    showPuzzle,
    setShowPuzzle,
    updatePieces,
    loadNewPuzzle,
    giveUp,
    clearSave,
  } = usePuzzleState();

  const { generateAIAction, generatePreset } = usePuzzleGenerator(
    async (newState, newPieces) => {
      await loadNewPuzzle(newState, newPieces);
    },
  );

  const [aiState, submitAIAction, isAIPending] = useActionState(
    generateAIAction,
    { error: null, success: false },
  );

  const handlePresetSelect = (
    imageUrl: string,
    selectedDifficulty: Difficulty,
  ) => {
    setDifficulty(selectedDifficulty);
    setAspectRatio('4:3');
    startPresetTransition(async () => {
      try {
        await generatePreset(imageUrl, selectedDifficulty);
        setShowGallery(false);
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error generating preset');
      }
    });
  };

  const isPending = isAIPending || isPresetPending;

  const handleComplete = async () => {
    if (puzzleState?.puzzleRecordId) {
      try {
        const result = await completePuzzle(puzzleState.puzzleRecordId);
        if (!result.success) {
          console.warn('Failed to save puzzle score:', result.error);
        } else {
          console.log('Puzzle completed in', result.timeTaken, 'seconds');
        }
      } catch (err) {
        console.error('Error completing puzzle:', err);
      }
    }
    clearSave();
  };

  return (
    <>
      <PresetGallery
        show={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={handlePresetSelect}
      />

      <div
        className={`fixed inset-0 z-50 bg-zinc-950 ${showPuzzle ? 'block' : 'hidden'}`}
      >
        {pieces && showPuzzle && (
          <PuzzleBoard
            key={puzzleId}
            initialPieces={pieces}
            onChange={updatePieces}
            onComplete={handleComplete}
          />
        )}
        <button
          onClick={() => setShowPuzzle(false)}
          className="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-4 py-2 text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          Back
        </button>
        <button
          onClick={() => setShowConfirmGiveUp(true)}
          className="absolute bottom-6 left-6 z-10 rounded-full bg-red-500/20 px-4 py-2 text-sm text-red-200 backdrop-blur-md transition-colors hover:bg-red-500/40"
        >
          Give Up
        </button>
      </div>

      {showConfirmGiveUp && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="mb-2 text-xl font-medium text-white">Give up?</h3>
            <p className="mb-6 text-sm text-zinc-400">
              All current puzzle progress will be lost. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmGiveUp(false)}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  giveUp();
                  setShowConfirmGiveUp(false);
                }}
                className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-600 hover:text-white"
              >
                Yes, Give Up
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`min-h-screen flex-col items-center justify-center p-6 ${
          showPuzzle ? 'hidden' : 'flex'
        }`}
      >
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="font-serif text-4xl tracking-tight text-white">
              Aura Puzzle
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

          <form action={submitAIAction} className="space-y-4">
            <input type="hidden" name="aspectRatio" value={aspectRatio} />
            <input type="hidden" name="difficulty" value={difficulty} />

            <div className="relative">
              <input
                type="text"
                name="prompt"
                defaultValue="A serene watercolor forest"
                placeholder={
                  isLoggedIn
                    ? 'Describe your puzzle...'
                    : 'Login to create AI puzzles'
                }
                disabled={!isLoggedIn || isPending}
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
                type="button"
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
                        { value: '1:1', label: '1:1 Square' },
                        { value: '16:9', label: '16:9 Wide' },
                        { value: '9:16', label: '9:16 Tall' },
                      ].map((ratio) => (
                        <button
                          key={ratio.value}
                          type="button"
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
                          type="button"
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
              <SubmitButton
                disabled={!isLoggedIn}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-4 font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                pendingText="Generating..."
              >
                <Sparkles className="h-5 w-5" />
                {pieces ? 'New Puzzle' : 'Create AI Puzzle'}
              </SubmitButton>

              {pieces && (
                <button
                  type="button"
                  onClick={() => setShowPuzzle(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-800 py-4 font-medium text-white transition-colors hover:bg-zinc-700"
                >
                  <Play className="h-5 w-5" />
                  Resume
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGallery(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 py-4 font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <GalleryHorizontalEnd className="h-5 w-5" />
              Open Preset Gallery
            </button>

            {aiState.error && (
              <p className="text-center text-sm text-red-400">
                {aiState.error}
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
