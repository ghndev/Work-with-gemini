import Konva from 'konva';
import { PieceData } from '@/utils/puzzleGenerator';
import { playClick, playSnap } from '@/utils/audio';
import confetti from 'canvas-confetti';

const SNAP_THRESHOLD = 30;

interface UsePuzzleDragProps {
  pieces: PieceData[];
  setPieces: React.Dispatch<React.SetStateAction<PieceData[]>>;
  onChange?: (pieces: PieceData[]) => void;
  onComplete: () => void;
}

export function usePuzzleDrag({
  pieces,
  setPieces,
  onChange,
  onComplete,
}: UsePuzzleDragProps) {
  const handleDragStart = (
    e: Konva.KonvaEventObject<DragEvent>,
    stageRef: React.RefObject<Konva.Stage | null>,
  ) => {
    if (e.target === stageRef.current) return;
    playClick();
    e.target.moveToTop();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const originalGroupId = e.target.id();
    const groupNode = e.target;

    const newOffsetX = groupNode.x();
    const newOffsetY = groupNode.y();

    let snapped = false;
    let finalGroupId = originalGroupId;
    let newPieces = [...pieces];

    const draggedGroupPieces = newPieces.filter(
      (p) => p.groupId === originalGroupId,
    );
    const otherPieces = newPieces.filter((p) => p.groupId !== originalGroupId);

    for (const dp of draggedGroupPieces) {
      for (const op of otherPieces) {
        const isAdjacent =
          Math.abs(dp.col - op.col) + Math.abs(dp.row - op.row) === 1;
        if (!isAdjacent) continue;

        const opOffsetX = op.x - op.correctX;
        const opOffsetY = op.y - op.correctY;

        const dist = Math.sqrt(
          Math.pow(newOffsetX - opOffsetX, 2) +
            Math.pow(newOffsetY - opOffsetY, 2),
        );

        if (dist < SNAP_THRESHOLD) {
          snapped = true;
          finalGroupId = op.groupId;
          playSnap();

          newPieces = newPieces.map((p) => {
            if (p.groupId === originalGroupId) {
              return {
                ...p,
                x: p.correctX + opOffsetX,
                y: p.correctY + opOffsetY,
                groupId: finalGroupId,
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
      newPieces = newPieces.map((p) => {
        if (p.groupId === originalGroupId) {
          return {
            ...p,
            x: p.correctX + newOffsetX,
            y: p.correctY + newOffsetY,
          };
        }
        return p;
      });
    }

    const activeGroupPieces = newPieces.filter(
      (p) => p.groupId === finalGroupId,
    );
    const inactivePieces = newPieces.filter((p) => p.groupId !== finalGroupId);
    newPieces = [...inactivePieces, ...activeGroupPieces];

    setPieces(newPieces);
    if (onChange) onChange(newPieces);

    if (snapped) {
      if (newPieces.every((p) => p.groupId === finalGroupId)) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        onComplete();
      }
    }
  };

  return { handleDragStart, handleDragEnd };
}
