import { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Group } from 'react-konva';
import { PieceData } from '@/utils/puzzleGenerator';
import { playClick, playSnap, getMuted, setMuted } from '@/utils/audio';
import confetti from 'canvas-confetti';
import { LayoutGrid, Image as ImageIcon, Frame, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react';

interface PuzzleBoardProps {
  initialPieces: PieceData[];
  onComplete: () => void;
  onChange?: (pieces: PieceData[]) => void;
}

const SNAP_THRESHOLD = 30;

export default function PuzzleBoard({ initialPieces, onComplete, onChange }: PuzzleBoardProps) {
  const [pieces, setPieces] = useState<PieceData[]>(initialPieces);
  const [showBorderOnly, setShowBorderOnly] = useState(false);
  const [isMuted, setIsMuted] = useState(getMuted());
  
  const maxRow = useMemo(() => Math.max(...initialPieces.map(p => p.row)), [initialPieces]);
  const maxCol = useMemo(() => Math.max(...initialPieces.map(p => p.col)), [initialPieces]);
  const isEdge = (p: PieceData) => p.row === 0 || p.row === maxRow || p.col === 0 || p.col === maxCol;

  const [stagePos, setStagePos] = useState(() => {
    // Calculate bounding box of initial pieces to center them
    if (initialPieces.length === 0) return { x: 0, y: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    initialPieces.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    // Default to a reasonable size if window is not defined (SSR)
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const h = typeof window !== 'undefined' ? window.innerHeight : 768;
    return {
      x: w / 2 - cx,
      y: h / 2 - cy
    };
  });
  const [stageScale, setStageScale] = useState(1);
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1024, 
    height: typeof window !== 'undefined' ? window.innerHeight : 768 
  });
  const lastCenter = useRef<{x: number, y: number} | null>(null);
  const lastDist = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    if (newScale < 0.1 || newScale > 5) return;

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleTouchMove = (e: any) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      const stage = stageRef.current;
      if (stage.isDragging()) {
        stage.stopDrag();
      }

      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };

      if (!lastCenter.current) {
        lastCenter.current = center;
        lastDist.current = dist;
        return;
      }

      const oldScale = stage.scaleX();
      const scaleBy = dist / lastDist.current;
      let newScale = oldScale * scaleBy;
      
      if (newScale < 0.1) newScale = 0.1;
      if (newScale > 5) newScale = 5;

      const mousePointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: center.x - mousePointTo.x * newScale + (center.x - lastCenter.current.x),
        y: center.y - mousePointTo.y * newScale + (center.y - lastCenter.current.y),
      };

      setStageScale(newScale);
      setStagePos(newPos);

      lastCenter.current = center;
      lastDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastCenter.current = null;
    lastDist.current = 0;
  };

  const handleDragStart = (e: any) => {
    playClick();
    const id = e.target.id();
    const piece = pieces.find(p => p.groupId === id);
    if (!piece) return;

    // Move dragged group to the end of the array so it renders on top
    const newPieces = [...pieces];
    const groupPieces = newPieces.filter(p => p.groupId === id);
    const otherPieces = newPieces.filter(p => p.groupId !== id);
    const reorderedPieces = [...otherPieces, ...groupPieces];
    
    setPieces(reorderedPieces);
    if (onChange) onChange(reorderedPieces);
  };

  const handleDragEnd = (e: any) => {
    const groupId = e.target.id();
    const groupNode = e.target;
    
    const newOffsetX = groupNode.x();
    const newOffsetY = groupNode.y();

    let snapped = false;
    let newPieces = [...pieces];
    
    // Update the pieces in this group with their new absolute positions
    // Actually, we just need to check if this group's offset is close to any other group's offset
    // Wait, the pieces in the group have correctX, correctY.
    // The group itself is at (newOffsetX, newOffsetY).
    // So the absolute position of a piece in this group is correctX + newOffsetX.
    
    const draggedGroupPieces = newPieces.filter(p => p.groupId === groupId);
    const otherPieces = newPieces.filter(p => p.groupId !== groupId);

    for (const dp of draggedGroupPieces) {
      for (const op of otherPieces) {
        const isAdjacent = Math.abs(dp.col - op.col) + Math.abs(dp.row - op.row) === 1;
        if (!isAdjacent) continue;

        // op's absolute position is op.x, op.y
        // op's group offset is op.x - op.correctX
        const opOffsetX = op.x - op.correctX;
        const opOffsetY = op.y - op.correctY;

        const dist = Math.sqrt(Math.pow(newOffsetX - opOffsetX, 2) + Math.pow(newOffsetY - opOffsetY, 2));

        if (dist < SNAP_THRESHOLD) {
          snapped = true;
          playSnap();
          
          const targetGroupId = op.groupId;
          newPieces = newPieces.map(p => {
            if (p.groupId === groupId) {
              return {
                ...p,
                x: p.correctX + opOffsetX,
                y: p.correctY + opOffsetY,
                groupId: targetGroupId
              };
            }
            return p;
          });
          break;
        }
      }
      if (snapped) break;
    }

    if (!snapped) {
      // Just update the x,y of the pieces in the dragged group
      newPieces = newPieces.map(p => {
        if (p.groupId === groupId) {
          return {
            ...p,
            x: p.correctX + newOffsetX,
            y: p.correctY + newOffsetY
          };
        }
        return p;
      });
    }

    setPieces(newPieces);
    if (onChange) onChange(newPieces);

    if (snapped) {
      const firstGroupId = newPieces[0].groupId;
      if (newPieces.every(p => p.groupId === firstGroupId)) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        onComplete();
      }
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, PieceData[]>();
    for (const p of pieces) {
      if (!map.has(p.groupId)) map.set(p.groupId, []);
      map.get(p.groupId)!.push(p);
    }
    return Array.from(map.values());
  }, [pieces]);

  const handleSort = () => {
    playClick();
    const groupCounts = new Map<string, number>();
    pieces.forEach(p => {
      groupCounts.set(p.groupId, (groupCounts.get(p.groupId) || 0) + 1);
    });

    const loosePieces = pieces.filter(p => groupCounts.get(p.groupId) === 1);
    if (loosePieces.length === 0) return;

    // Sort loose pieces: edges first, then random
    loosePieces.sort((a, b) => {
      const aEdge = isEdge(a) ? -1 : 1;
      const bEdge = isEdge(b) ? -1 : 1;
      if (aEdge !== bEdge) return aEdge - bEdge;
      return Math.random() - 0.5;
    });

    const stage = stageRef.current;
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

    const targetPositions = new Map<string, {x: number, y: number}>();
    let r = 0;
    let c = 0;
    loosePieces.forEach(p => {
      targetPositions.set(p.id, {
        x: startX + c * (pieceW + padding),
        y: startY + r * (pieceH + padding)
      });
      c++;
      if (c >= cols) {
        c = 0;
        r++;
      }
    });

    const newPieces = pieces.map(p => {
      if (targetPositions.has(p.id)) {
        const target = targetPositions.get(p.id)!;
        return { ...p, x: target.x, y: target.y };
      }
      return p;
    });
    
    setPieces(newPieces);
    if (onChange) onChange(newPieces);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    playClick();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const scaleBy = 1.2;
    let newScale = direction === 'in' ? oldScale * scaleBy : oldScale / scaleBy;
    
    if (newScale < 0.1) newScale = 0.1;
    if (newScale > 5) newScale = 5;

    // Zoom towards the center of the screen
    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-zinc-950 overflow-hidden relative touch-none">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        ref={stageRef}
        onDragStart={(e) => {
          if (e.target === stageRef.current) {
            document.body.style.cursor = 'grabbing';
          }
        }}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            document.body.style.cursor = 'default';
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
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {groupPieces.map((piece) => {
                  if (showBorderOnly && !isEdge(piece)) return null;
                  return (
                    <KonvaImage
                      key={piece.id}
                      image={piece.canvas}
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
      <div className="absolute top-6 right-6 flex sm:hidden flex-col gap-2 z-10">
        <button
          onClick={() => handleZoom('in')}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl transition-colors flex items-center justify-center shadow-lg border border-white/10"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl transition-colors flex items-center justify-center shadow-lg border border-white/10"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute bottom-6 right-6 flex gap-2 sm:gap-3 z-10">
        <button
          onClick={() => {
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            setMuted(newMuted);
          }}
          className="p-3 sm:px-4 sm:py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl transition-colors flex items-center justify-center gap-2 font-medium shadow-lg border border-white/10"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button
          onClick={() => { playClick(); setShowBorderOnly(!showBorderOnly); }}
          className="p-3 sm:px-4 sm:py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl transition-colors flex items-center justify-center gap-2 font-medium shadow-lg border border-white/10"
          title={showBorderOnly ? 'Show All Pieces' : 'Border Pieces Only'}
        >
          {showBorderOnly ? <ImageIcon className="w-5 h-5" /> : <Frame className="w-5 h-5" />}
          <span className="hidden sm:inline">{showBorderOnly ? 'Show All Pieces' : 'Border Pieces Only'}</span>
        </button>
        <button
          onClick={handleSort}
          className="p-3 sm:px-4 sm:py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl transition-colors flex items-center justify-center gap-2 font-medium shadow-lg border border-white/10"
          title="Sort Pieces"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="hidden sm:inline">Sort Pieces</span>
        </button>
      </div>
    </div>
  );
}
