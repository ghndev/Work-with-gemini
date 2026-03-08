import { useState, useRef, useSyncExternalStore } from 'react';
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Group,
  useStrictMode as setKonvaStrictMode,
} from 'react-konva';
import Konva from 'konva';
import { PieceData } from '@/utils/puzzleGenerator';
import { playClick, getMuted, setMuted } from '@/utils/audio';
import { usePuzzleZoom } from '@/hooks/usePuzzleZoom';
import { usePuzzleDrag } from '@/hooks/usePuzzleDrag';
import { PuzzleControls } from './PuzzleControls';

setKonvaStrictMode(true);

interface PuzzleBoardProps {
  initialPieces: PieceData[];
  onComplete: () => void;
  onChange?: (pieces: PieceData[]) => void;
}

export default function PuzzleBoard({
  initialPieces,
  onComplete,
  onChange,
}: PuzzleBoardProps) {
  const [pieces, setPieces] = useState<PieceData[]>(initialPieces);
  const [showBorderOnly, setShowBorderOnly] = useState(false);
  const [isMuted, setIsMutedState] = useState(getMuted());

  // React Compiler automatically memoizes these calculations. Use simple variables instead of useState for static values.
  const maxRow = Math.max(...initialPieces.map((p) => p.row));
  const maxCol = Math.max(...initialPieces.map((p) => p.col));

  const isEdge = (p: PieceData) =>
    p.row === 0 || p.row === maxRow || p.col === 0 || p.col === maxCol;

  const initialPos = useRef<{ x: number; y: number } | null>(null);
  if (!initialPos.current) {
    if (initialPieces.length === 0) {
      initialPos.current = { x: 0, y: 0 };
    } else {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      initialPieces.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const h = typeof window !== 'undefined' ? window.innerHeight : 768;
      initialPos.current = { x: w / 2 - cx, y: h / 2 - cy };
    }
  }

  const windowDimensionsRef = useRef<{ width: number; height: number } | null>(
    null,
  );
  if (!windowDimensionsRef.current && typeof window !== 'undefined') {
    windowDimensionsRef.current = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  const subscribeWindow = (callback: () => void) => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  };

  const getWindowSnapshot = () => {
    // Only return a new object if dimensions actually changed to avoid infinite re-renders
    if (!windowDimensionsRef.current)
      return { width: window.innerWidth, height: window.innerHeight };
    if (
      windowDimensionsRef.current.width !== window.innerWidth ||
      windowDimensionsRef.current.height !== window.innerHeight
    ) {
      windowDimensionsRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return windowDimensionsRef.current;
  };

  const getServerSnapshot = () => ({ width: 1024, height: 768 });

  const dimensions = useSyncExternalStore(
    subscribeWindow,
    getWindowSnapshot,
    getServerSnapshot,
  );

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingPieceRef = useRef(false);

  const { handleWheel, handleTouchMove, handleTouchEnd, handleZoom } =
    usePuzzleZoom(
      stageRef,
      dimensions,
      initialPos.current!,
      isDraggingPieceRef,
    );
  const { handleDragStart, handleDragEnd } = usePuzzleDrag({
    pieces,
    setPieces,
    onChange,
    onComplete,
  });

  const groups = (() => {
    const map = new Map<string, PieceData[]>();
    for (const p of pieces) {
      if (!map.has(p.groupId)) map.set(p.groupId, []);
      map.get(p.groupId)!.push(p);
    }
    return Array.from(map.values());
  })();

  const handleSort = () => {
    playClick();
    const groupCounts = new Map<string, number>();
    pieces.forEach((p) => {
      groupCounts.set(p.groupId, (groupCounts.get(p.groupId) || 0) + 1);
    });

    const loosePieces = pieces.filter((p) => groupCounts.get(p.groupId) === 1);
    if (loosePieces.length === 0) return;

    loosePieces.sort((a, b) => {
      const aEdge = isEdge(a) ? -1 : 1;
      const bEdge = isEdge(b) ? -1 : 1;
      if (aEdge !== bEdge) return aEdge - bEdge;
      return Math.random() - 0.5;
    });

    const stage = stageRef.current;
    if (!stage) return;
    const viewX = -stage.x() / stage.scaleX();
    const viewY = -stage.y() / stage.scaleY();
    const viewW = dimensions.width / stage.scaleX();

    const pieceW = loosePieces[0].width;
    const pieceH = loosePieces[0].height;
    const padding = 20;

    const availableW = viewW - 100;
    const cols = Math.max(1, Math.floor(availableW / (pieceW + padding)));

    const startX = viewX + 50;
    const startY = viewY + 50;

    const targetPositions = new Map<string, { x: number; y: number }>();
    let r = 0,
      c = 0;
    loosePieces.forEach((p) => {
      targetPositions.set(p.id, {
        x: startX + c * (pieceW + padding),
        y: startY + r * (pieceH + padding),
      });
      c++;
      if (c >= cols) {
        c = 0;
        r++;
      }
    });

    const newPieces = pieces.map((p) => {
      if (targetPositions.has(p.id)) {
        const target = targetPositions.get(p.id)!;
        return { ...p, x: target.x, y: target.y };
      }
      return p;
    });

    setPieces(newPieces);
    if (onChange) onChange(newPieces);
  };

  const setIsMuted = (muted: boolean) => {
    setIsMutedState(muted);
    setMuted(muted);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-zinc-950"
      style={{ cursor: 'default' }}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable
        ref={stageRef}
        onDragStart={(e) => {
          if (e.target === stageRef.current && containerRef.current) {
            containerRef.current.style.cursor = 'grabbing';
          }
        }}
        onDragEnd={(e) => {
          if (e.target === stageRef.current && containerRef.current) {
            containerRef.current.style.cursor = 'default';
          }
        }}
      >
        <Layer>
          {groups.map((groupPieces) => {
            const groupId = groupPieces[0].groupId;
            const offsetX = groupPieces[0].x - groupPieces[0].correctX;
            const offsetY = groupPieces[0].y - groupPieces[0].correctY;

            return (
              <Group
                key={groupId}
                id={groupId}
                x={offsetX}
                y={offsetY}
                draggable
                onDragStart={(e) => {
                  isDraggingPieceRef.current = true;
                  handleDragStart(e, stageRef);
                }}
                onDragEnd={(e) => {
                  isDraggingPieceRef.current = false;
                  handleDragEnd(e);
                }}
              >
                {groupPieces.map((piece) => {
                  if (showBorderOnly && !isEdge(piece)) return null;
                  return (
                    <KonvaImage
                      key={piece.id}
                      image={piece.image}
                      x={piece.correctX}
                      y={piece.correctY}
                      offsetX={piece.padding}
                      offsetY={piece.padding}
                      perfectDrawEnabled={false}
                    />
                  );
                })}
              </Group>
            );
          })}
        </Layer>
      </Stage>
      <PuzzleControls
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        showBorderOnly={showBorderOnly}
        setShowBorderOnly={setShowBorderOnly}
        handleSort={handleSort}
        handleZoom={handleZoom}
      />
    </div>
  );
}
