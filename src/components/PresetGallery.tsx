import Image from 'next/image';
import { ArrowLeft, Play } from 'lucide-react';
import {
  PRESET_GALLERY,
  DIFFICULTY_SETTINGS,
  getEstimatedPieceCount,
  Difficulty,
} from '@/constants/puzzle';

interface PresetGalleryProps {
  show: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string, difficulty: Difficulty) => void;
}

export function PresetGallery({ show, onClose, onSelect }: PresetGalleryProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 block overflow-y-auto bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-serif text-3xl text-white">Preset Gallery</h2>
          <button
            onClick={onClose}
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
                    onClick={() => onSelect(preset.url, diffKey)}
                    className="group relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-zinc-800 transition-all hover:border-zinc-500"
                  >
                    <Image
                      src={preset.url}
                      alt={preset.label}
                      fill
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
  );
}
