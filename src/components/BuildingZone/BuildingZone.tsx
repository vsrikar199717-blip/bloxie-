import { useRef, useState, useCallback } from 'react';
import { DraggableObject } from './DraggableObject';
import { PartsTray } from './PartsTray';
import { PartControlBar } from './PartControlBar';
import { ThemeBackdrop } from './ThemeBackdrop';
import { captureAndDownload } from '../../utils/screenshot';
import type { AwardedPart, PartTransform } from '../../hooks/usePartSystem';
import { DEFAULT_TRANSFORM } from '../../hooks/usePartSystem';
import type { Theme } from '../../types/profile';


interface BuildingZoneProps {
  theme: Theme;
  parts: AwardedPart[];
  onPartMove: (id: string, x: number, y: number) => void;
  onPartPlace: (id: string, x: number, y: number) => void;
  onPartUnplace: (id: string) => void;
  onPlayDanceMusic?: () => void;
  onStopDanceMusic?: () => void;
  onResetModel: () => void;
  isSoundMuted: boolean;
  onToggleMute: (muted: boolean) => void;
  upcomingParts?: string[];
  /** Words read this session — every word earns one. */
  stars?: number;
  /** Current run of words read without needing the compass. */
  streak?: number;
}

/** Encouragement that reacts to how the session is actually going. */
function encouragement(stars: number, streak: number): string {
  if (stars === 0) return 'Read a word to earn your first part!';
  if (streak >= 5) return `${streak} in a row! 🔥`;
  if (streak >= 3) return 'On a roll! 🎉';
  return 'Keep going! 🎉';
}

export function BuildingZone({
  theme,
  parts,
  onPartMove,
  onPartPlace,
  onPartUnplace,
  onPlayDanceMusic,
  onStopDanceMusic,
  onResetModel,
  isSoundMuted,
  onToggleMute,
  upcomingParts = [],
  stars = 0,
  streak = 0,
}: BuildingZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buildAreaRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [partTransforms, setPartTransforms] = useState<Map<string, PartTransform>>(new Map());
  const [draggingFromTray, setDraggingFromTray] = useState<AwardedPart | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDancing, setIsDancing] = useState(false);

  const clampScale = useCallback((scale: number, centerX: number, centerY: number): number => {
    if (!containerRef.current) return scale;
    const rect = containerRef.current.getBoundingClientRect();
    const halfWidth = Math.min(centerX, rect.width - centerX);
    const halfHeight = Math.min(centerY, rect.height - centerY);
    const maxScaleByBounds = Math.min((halfWidth * 2) / 80, (halfHeight * 2) / 80);
    const MIN_SCALE = 0.5;
    const MAX_SCALE = Math.max(MIN_SCALE, Math.min(2.5, maxScaleByBounds));
    return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
  }, []);

  // Split parts into tray (not placed) and build area (placed)
  const trayParts = parts.filter(p => !p.isPlaced);
  const placedParts = parts.filter(p => p.isPlaced);
  const placedPartsSorted = [...placedParts].sort((a, b) => a.zIndex - b.zIndex);

  const hasPlacedParts = placedParts.length > 0;

  // Get transform for a part (or default)
  const getTransform = useCallback((id: string): PartTransform => {
    return partTransforms.get(id) || DEFAULT_TRANSFORM;
  }, [partTransforms]);

  // Update transform for a part
  const updateTransform = useCallback((id: string, update: Partial<PartTransform>) => {
    setPartTransforms(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(id) || DEFAULT_TRANSFORM;
      const merged = { ...current, ...update };
      if (update.scale !== undefined) {
        const size = 80 * merged.scale;
        const centerX = (parts.find(p => p.id === id)?.x ?? 0) + size / 2;
        const centerY = (parts.find(p => p.id === id)?.y ?? 0) + size / 2;
        merged.scale = clampScale(update.scale, centerX, centerY);
      }
      newMap.set(id, merged);
      return newMap;
    });
  }, [clampScale, parts]);

  // Control bar actions
  const handleRotate = useCallback(() => {
    if (!selectedPartId) return;
    const current = getTransform(selectedPartId);
    updateTransform(selectedPartId, { rotation: (current.rotation + 15) % 360 });
  }, [selectedPartId, getTransform, updateTransform]);

  const handleFlipH = useCallback(() => {
    if (!selectedPartId) return;
    const current = getTransform(selectedPartId);
    updateTransform(selectedPartId, { flipX: !current.flipX });
  }, [selectedPartId, getTransform, updateTransform]);

  const handleFlipV = useCallback(() => {
    if (!selectedPartId) return;
    const current = getTransform(selectedPartId);
    updateTransform(selectedPartId, { flipY: !current.flipY });
  }, [selectedPartId, getTransform, updateTransform]);

  const handleResize = useCallback(() => {
    if (!selectedPartId) return;
    const current = getTransform(selectedPartId);
    const bumpedScale = current.scale * 1.15;
    updateTransform(selectedPartId, { scale: bumpedScale });
  }, [selectedPartId, getTransform, updateTransform]);

  // Bring selected part to front (highest zIndex)
  const handleBringForward = useCallback(() => {
    if (!selectedPartId) return;
    // onPartMove bumps zIndex to top in usePartSystem
    onPartMove(selectedPartId,
      parts.find(p => p.id === selectedPartId)?.x ?? 0,
      parts.find(p => p.id === selectedPartId)?.y ?? 0,
    );
  }, [selectedPartId, parts, onPartMove]);

  // Send selected part to back (lowest zIndex)
  const handleSendBack = useCallback(() => {
    if (!selectedPartId) return;
    // We can't directly set zIndex, but we can unplace and re-place at position 0
    // Instead, let's move all OTHER parts forward
    const selectedPart = parts.find(p => p.id === selectedPartId);
    if (!selectedPart) return;
    // Move every other placed part to bump its z above selected
    placedParts
      .filter(p => p.id !== selectedPartId)
      .forEach(p => onPartMove(p.id, p.x, p.y));
  }, [selectedPartId, parts, placedParts, onPartMove]);

  // Remove selected part (return to tray)
  const handleRemovePart = useCallback(() => {
    if (!selectedPartId) return;
    onPartUnplace(selectedPartId);
    setSelectedPartId(null);
    setPartTransforms(prev => {
      const newMap = new Map(prev);
      newMap.delete(selectedPartId);
      return newMap;
    });
  }, [selectedPartId, onPartUnplace]);

  // Handle drag from tray
  const handleTrayDragStart = useCallback((part: AwardedPart, startX: number, startY: number) => {
    setDraggingFromTray(part);
    setDragPosition({ x: startX, y: startY });

    const handleMove = (clientX: number, clientY: number) => {
      setDragPosition({ x: clientX, y: clientY });
    };

    const handleEnd = (clientX: number, clientY: number) => {
      if (buildAreaRef.current) {
        const rect = buildAreaRef.current.getBoundingClientRect();
        // Check if dropped inside build area
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          // Calculate position relative to build area
          const base = 80;
          const x = clientX - rect.left - base / 2;
          const y = clientY - rect.top - base / 2;
          onPartPlace(part.id, Math.max(0, x), Math.max(0, y));
        }
      }
      setDraggingFromTray(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [onPartPlace]);

  // Handle background click to deselect
  const handleBackgroundClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedPartId(null);
    }
  }, []);

  const handleResetModelLocal = useCallback(() => {
    setSelectedPartId(null);
    setPartTransforms(new Map());
    onResetModel();
    setIsDancing(false);
    onStopDanceMusic?.();
  }, [onResetModel, onStopDanceMusic]);

  // Dance mode handler
  const handleDance = useCallback(() => {
    setIsDancing(true);
    setSelectedPartId(null); // Deselect during dance
    onPlayDanceMusic?.();
    setTimeout(() => {
      setIsDancing(false);
      onStopDanceMusic?.();
    }, 5000);
  }, [onPlayDanceMusic, onStopDanceMusic]);

  return (
    <div className="h-full flex flex-col p-2 md:p-4 relative">
      {/* Utility bar */}
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleMute(!isSoundMuted)}
            className={`
              px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-sm font-semibold
              ${isSoundMuted ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}
            `}
          >
            <span className="md:hidden">{isSoundMuted ? '🔇' : '🔊'}</span>
            <span className="hidden md:inline">{isSoundMuted ? 'Sound off' : 'Sound on'}</span>
          </button>
        </div>
        <button
          onClick={handleResetModelLocal}
          className="px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-sm font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200"
        >
          <span className="md:hidden">🔄</span>
          <span className="hidden md:inline">Start again</span>
        </button>
      </div>

      {/* Main area: Build + Tray side by side */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Build Area */}
        <div
          ref={(el) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            (buildAreaRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          data-tour="build"
          className={`
            flex-1 relative rounded-2xl border-2 overflow-hidden
            ${hasPlacedParts ? 'bg-white border-gray-300' : 'bg-gray-50 border-dashed border-gray-200'}
          `}
          onClick={handleBackgroundClick}
          onTouchEnd={handleBackgroundClick}
        >
          <ThemeBackdrop theme={theme} />

          {/* Empty state */}
          {!hasPlacedParts && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="px-4 py-2 rounded-full bg-white/70 text-gray-600 text-sm md:text-lg text-center">
                Drag parts here to build!
              </p>
            </div>
          )}

          {/* Placed parts */}
          {placedPartsSorted.map((part) => (
            <DraggableObject
              key={part.id}
              part={part}
              transform={getTransform(part.id)}
              isSelected={selectedPartId === part.id}
              isDancing={isDancing}
              onSelect={() => setSelectedPartId(part.id)}
              onPositionChange={onPartMove}
              onReturnToTray={() => {
                onPartUnplace(part.id);
                setSelectedPartId(null);
                // Reset transform when returning to tray
                setPartTransforms(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(part.id);
                  return newMap;
                });
              }}
              containerRef={containerRef}
              trayRef={trayRef}
              onTransformChange={(update) => updateTransform(part.id, update)}
            />
          ))}

          {/* Control bar floats OVER the scene rather than sitting below it.
              In the flex column it added a row on every selection, so the build
              area resized under the child's hands each time they tapped a part. */}
          {selectedPartId && !isDancing && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 p-1 shadow-[0_6px_18px_rgba(0,0,0,.18)]"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <PartControlBar
                onRotate={handleRotate}
                onFlipH={handleFlipH}
                onFlipV={handleFlipV}
                onResize={handleResize}
                onBringForward={handleBringForward}
                onSendBack={handleSendBack}
                onRemove={handleRemovePart}
              />
            </div>
          )}
        </div>

        {/* Parts Tray */}
        <PartsTray
          ref={trayRef}
          parts={trayParts}
          upcomingParts={upcomingParts}
          onDragStart={handleTrayDragStart}
        />
      </div>

      {/* Dance and Photo buttons - shows when 3+ parts placed */}
      {placedParts.length >= 3 && (
        <div className="mt-1 md:mt-2 flex gap-2">
          <button
            onClick={handleDance}
            disabled={isDancing || isSaving}
            className={`
              flex-1 py-2 px-3 md:py-3 md:px-4 rounded-xl font-bold text-base md:text-lg
              transition-all duration-300
              ${isDancing
                ? 'bg-[#e0761a] text-white animate-pulse cursor-not-allowed'
                : 'bg-[#F5851F] text-white hover:bg-[#e0761a] shadow-[0_6px_16px_rgba(245,133,31,0.28)] active:scale-95'
              }
            `}
          >
            {isDancing ? '🎵 Dancing! 🎵' : '💃 Make it dance!'}
          </button>
          <button
            onClick={async () => {
              if (buildAreaRef.current) {
                setIsSaving(true);
                await captureAndDownload(buildAreaRef.current, 'my-creation.png');
                setIsSaving(false);
              }
            }}
            disabled={isDancing || isSaving}
            className={`
              flex-1 py-2 px-3 md:py-3 md:px-4 rounded-xl font-bold text-base md:text-lg
              transition-all duration-300
              ${isSaving
                ? 'bg-[#5a5a5a] text-white cursor-not-allowed'
                : 'bg-[#111] text-white hover:bg-black shadow-[0_6px_16px_rgba(0,0,0,0.2)] active:scale-95'
              }
            `}
          >
            {isSaving ? '📸 Saving...' : '📸 Take photo!'}
          </button>
        </div>
      )}

      {/* Progress bar — streak and stars, both real counts from the session */}
      <div className="mt-2 md:mt-3 flex items-center gap-4 md:gap-6 px-4 py-2.5 md:py-3 rounded-2xl bg-white border border-black/5 shadow-[0_2px_10px_rgba(60,50,20,.06)]">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-[#8A8378] font-medium">Streak</span>
          <span aria-hidden="true">🔥</span>
          <span className="font-bold text-[#2B2A32]">{streak}</span>
        </div>

        <span className="w-px h-5 bg-black/10" />

        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-[#8A8378] font-medium">Stars</span>
          <span aria-hidden="true">⭐</span>
          <span className="font-bold text-[#2B2A32]">{stars}</span>
        </div>

        <span className="ml-auto text-sm font-semibold text-[#6C5CE7]">
          {encouragement(stars, streak)}
        </span>
      </div>

      {/* Drag preview from tray */}
      {draggingFromTray && (
        <img
          src={draggingFromTray.path}
          alt="Dragging part"
          className="fixed pointer-events-none z-[9999] w-20 h-20 object-contain part-dragging"
          style={{
            left: dragPosition.x - 40,
            top: dragPosition.y - 40,
          }}
        />
      )}
    </div>
  );
}
