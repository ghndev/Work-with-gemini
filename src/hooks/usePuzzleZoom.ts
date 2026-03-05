import { useState, useRef, RefObject } from 'react';
import Konva from 'konva';
import { playClick } from '@/utils/audio';

export function usePuzzleZoom(
  stageRef: RefObject<Konva.Stage | null>,
  dimensions: { width: number; height: number },
  initialPos: { x: number; y: number },
) {
  const [stagePos, setStagePos] = useState(initialPos);
  const [stageScale, setStageScale] = useState(1);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number>(0);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const oldScale = stage.scaleX();

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

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      const stage = stageRef.current;
      if (!stage) return;
      if (stage.isDragging()) {
        stage.stopDrag();
      }

      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      const dist = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2),
      );
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
        x:
          center.x -
          mousePointTo.x * newScale +
          (center.x - lastCenter.current.x),
        y:
          center.y -
          mousePointTo.y * newScale +
          (center.y - lastCenter.current.y),
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

  const handleZoom = (direction: 'in' | 'out') => {
    playClick();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const scaleBy = 1.2;
    let newScale = direction === 'in' ? oldScale * scaleBy : oldScale / scaleBy;

    if (newScale < 0.1) newScale = 0.1;
    if (newScale > 5) newScale = 5;

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

  return {
    stagePos,
    stageScale,
    handleWheel,
    handleTouchMove,
    handleTouchEnd,
    handleZoom,
  };
}
