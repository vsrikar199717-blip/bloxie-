import { useRef, useState } from 'react';
import type { AwardedPart, PartTransform, PartType } from '../../hooks/usePartSystem';

const BASE_SIZE = 80;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const SNAP_DEGREES = 15;

// Get dance animation class based on part type
function getDanceAnimation(partType: PartType): string {
  switch (partType) {
    case 'head':
      return 'animate-head-bob';
    case 'body':
      return 'animate-body-bounce';
    case 'arm':
      return 'animate-limb-wave';
    case 'leg':
      return 'animate-body-bounce';
    case 'accessory':
      return 'animate-accessory-wiggle';
    default:
      return 'animate-accessory-wiggle';
  }
}

interface DraggableObjectProps {
  part: AwardedPart;
  transform: PartTransform;
  isSelected: boolean;
  isDancing?: boolean;
  onSelect: () => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onTransformChange: (update: Partial<PartTransform>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  trayRef?: React.RefObject<HTMLDivElement | null>;
  onReturnToTray?: () => void;
}

export function DraggableObject({
  part,
  transform,
  isSelected,
  isDancing = false,
  onSelect,
  onPositionChange,
  onTransformChange,
  containerRef,
  trayRef,
  onReturnToTray,
}: DraggableObjectProps) {
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const resizeSessionRef = useRef<{ startScale: number; startDistance: number; centerX: number; centerY: number } | null>(null);
  const rotateSessionRef = useRef<{ startRotation: number; startAngle: number; centerX: number; centerY: number } | null>(null);

  const currentSize = BASE_SIZE * transform.scale;
  const transformStyle = `rotate(${transform.rotation}deg) scale(${transform.flipX ? -1 : 1}, ${transform.flipY ? -1 : 1})`;

  const toContainerPoint = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    return {
      x: rect ? clientX - rect.left : clientX,
      y: rect ? clientY - rect.top : clientY,
    };
  };

  const clampScale = (scale: number, centerX: number, centerY: number) => {
    if (!containerRef.current) return scale;
    const rect = containerRef.current.getBoundingClientRect();
    const maxScaleByBounds = Math.min(
      (Math.min(centerX, rect.width - centerX) * 2) / BASE_SIZE,
      (Math.min(centerY, rect.height - centerY) * 2) / BASE_SIZE
    );
    const max = Math.max(MIN_SCALE, Math.min(MAX_SCALE, maxScaleByBounds));
    return Math.min(Math.max(scale, MIN_SCALE), max);
  };

  const isOverTray = (clientX: number, clientY: number) => {
    if (!trayRef?.current) return false;
    const trayRect = trayRef.current.getBoundingClientRect();
    return (
      clientX >= trayRect.left &&
      clientX <= trayRect.right &&
      clientY >= trayRect.top &&
      clientY <= trayRect.bottom
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    hasDraggedRef.current = false;

    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    offsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    touchStartPosRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];

    // Check if we've moved enough to count as a drag (5px threshold)
    const dx = touch.clientX - touchStartPosRef.current.x;
    const dy = touch.clientY - touchStartPosRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDraggedRef.current = true;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = touch.clientX - containerRect.left - offsetRef.current.x;
    const newY = touch.clientY - containerRect.top - offsetRef.current.y;

    // Constrain to container bounds
    const constrainedX = Math.max(0, Math.min(newX, containerRect.width - currentSize));
    const constrainedY = Math.max(0, Math.min(newY, containerRect.height - currentSize));

    onPositionChange(part.id, constrainedX, constrainedY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    const droppedOnTray = hasDraggedRef.current && isOverTray(touch.clientX, touch.clientY);

    if (droppedOnTray && onReturnToTray) {
      onReturnToTray();
      setIsDragging(false);
      return;
    }

    setIsDragging(false);
    // If it was a tap (no drag), select the part
    if (!hasDraggedRef.current) {
      onSelect();
    }
  };

  // Mouse events for testing on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    hasDraggedRef.current = false;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;

      // Check if we've moved enough to count as a drag
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasDraggedRef.current = true;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = moveEvent.clientX - containerRect.left - offsetRef.current.x;
      const newY = moveEvent.clientY - containerRect.top - offsetRef.current.y;

      const constrainedX = Math.max(0, Math.min(newX, containerRect.width - currentSize));
      const constrainedY = Math.max(0, Math.min(newY, containerRect.height - currentSize));

      onPositionChange(part.id, constrainedX, constrainedY);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const droppedOnTray = hasDraggedRef.current && isOverTray(upEvent.clientX, upEvent.clientY);

      if (droppedOnTray && onReturnToTray) {
        onReturnToTray();
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        return;
      }

      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // If it was a click (no drag), select the part
      if (!hasDraggedRef.current) {
        onSelect();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Gesture: resize via handle drag
  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    const { x, y } = toContainerPoint(e.clientX, e.clientY);
    const centerX = part.x + currentSize / 2;
    const centerY = part.y + currentSize / 2;
    const startDistance = Math.hypot(x - centerX, y - centerY);
    if (startDistance === 0) return;
    resizeSessionRef.current = { startScale: transform.scale, startDistance, centerX, centerY };

    const handleMove = (ev: PointerEvent) => {
      if (!resizeSessionRef.current) return;
      const point = toContainerPoint(ev.clientX, ev.clientY);
      const newDistance = Math.hypot(point.x - centerX, point.y - centerY);
      if (newDistance === 0) return;
      const rawScale = resizeSessionRef.current.startScale * (newDistance / resizeSessionRef.current.startDistance);
      const clamped = clampScale(rawScale, centerX, centerY);
      onTransformChange({ scale: clamped });
    };

    const handleUp = () => {
      resizeSessionRef.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', handleUp, { passive: true });
  };

  // Gesture: rotation via handle drag
  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    const { x, y } = toContainerPoint(e.clientX, e.clientY);
    const centerX = part.x + currentSize / 2;
    const centerY = part.y + currentSize / 2;
    const startAngle = Math.atan2(y - centerY, x - centerX);
    rotateSessionRef.current = {
      startRotation: transform.rotation,
      startAngle,
      centerX,
      centerY,
    };

    const handleMove = (ev: PointerEvent) => {
      if (!rotateSessionRef.current) return;
      const point = toContainerPoint(ev.clientX, ev.clientY);
      const angle = Math.atan2(point.y - centerY, point.x - centerX);
      const deltaDeg = (angle - rotateSessionRef.current.startAngle) * (180 / Math.PI);
      let rawRotation = rotateSessionRef.current.startRotation + deltaDeg;
      const snapped = Math.round(rawRotation / SNAP_DEGREES) * SNAP_DEGREES;
      if (Math.abs(snapped - rawRotation) < 3) {
        rawRotation = snapped;
      }
      const normalized = ((rawRotation % 360) + 360) % 360;
      onTransformChange({ rotation: normalized });
    };

    const handleUp = () => {
      rotateSessionRef.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', handleUp, { passive: true });
  };

  return (
    <div
      className={`
        absolute
        ${isSelected ? 'ring-4 ring-blue-400 ring-offset-2 rounded-lg' : ''}
      `}
      style={{
        left: part.x,
        top: part.y,
        width: currentSize,
        height: currentSize,
        zIndex: part.zIndex,
        transform: transformStyle,
        transformOrigin: '50% 50%',
      }}
    >
      <div className="relative w-full h-full">
        <div className={isDancing ? getDanceAnimation(part.partType) : ''}>
          <img
            src={part.path}
            alt="Robot part"
            className={`
              w-full h-full object-contain
              cursor-grab active:cursor-grabbing
              touch-none select-none
              transition-transform duration-150
              ${isDragging ? 'scale-105 opacity-90' : ''}
            `}
            style={{
              transformOrigin: '50% 50%',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          />
        </div>

        {/* Rotation handle */}
        {isSelected && (
          <button
            type="button"
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-700"
            onPointerDown={startRotate}
            aria-label="Rotate"
          >
            ↻
          </button>
        )}

        {/* Resize handle */}
        {isSelected && (
          <button
            type="button"
            className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-700"
            onPointerDown={startResize}
            aria-label="Resize"
          >
            ⤡
          </button>
        )}
      </div>
    </div>
  );
}
