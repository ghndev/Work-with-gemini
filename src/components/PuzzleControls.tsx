import {
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Frame,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { playClick } from '@/utils/audio';

interface PuzzleControlsProps {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  showBorderOnly: boolean;
  setShowBorderOnly: (show: boolean) => void;
  handleSort: () => void;
  handleZoom: (direction: 'in' | 'out') => void;
}

export function PuzzleControls({
  isMuted,
  setIsMuted,
  showBorderOnly,
  setShowBorderOnly,
  handleSort,
  handleZoom,
}: PuzzleControlsProps) {
  return (
    <>
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 sm:hidden">
        <button
          onClick={() => handleZoom('in')}
          className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-3 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-3 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
      </div>
      <div className="absolute right-6 bottom-6 z-10 flex gap-2 sm:gap-3">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-3 font-medium text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20 sm:px-4 sm:py-3"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={() => {
            playClick();
            setShowBorderOnly(!showBorderOnly);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-3 font-medium text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20 sm:px-4 sm:py-3"
          title={showBorderOnly ? 'Show All Pieces' : 'Border Pieces Only'}
        >
          {showBorderOnly ? (
            <ImageIcon className="h-5 w-5" />
          ) : (
            <Frame className="h-5 w-5" />
          )}
          <span className="hidden sm:inline">
            {showBorderOnly ? 'Show All Pieces' : 'Border Pieces Only'}
          </span>
        </button>
        <button
          onClick={handleSort}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-3 font-medium text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20 sm:px-4 sm:py-3"
          title="Sort Pieces"
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="hidden sm:inline">Sort Pieces</span>
        </button>
      </div>
    </>
  );
}
