import { forwardRef, useRef, useState, useEffect, useCallback } from 'react';
import type { AwardedPart } from '../../hooks/usePartSystem';

interface PartsTrayProps {
  parts: AwardedPart[];
  upcomingParts: string[];
  onDragStart: (part: AwardedPart, startX: number, startY: number) => void;
}

interface TrayItemProps {
  part: AwardedPart;
  onDragStart: (part: AwardedPart, startX: number, startY: number) => void;
}

function TrayItem({ part, onDragStart }: TrayItemProps) {
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    onDragStart(part, touch.clientX, touch.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart(part, e.clientX, e.clientY);
  };

  return (
    <div className="w-full aspect-square flex items-center justify-center">
      <img
        src={part.path}
        alt="Part"
        className="w-full h-full object-contain cursor-grab active:cursor-grabbing touch-none select-none p-1"
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
        }}
        onTouchStart={handleTouchStart}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      />
    </div>
  );
}

function SilhouetteItem({ path }: { path: string }) {
  return (
    <div className="w-full aspect-square flex items-center justify-center">
      <img
        src={path}
        alt=""
        className="w-full h-full object-contain pointer-events-none select-none p-1"
        style={{ filter: 'brightness(0) opacity(0.12)' }}
        draggable={false}
      />
    </div>
  );
}

function ScrollArrow({ direction, onClick }: { direction: 'up' | 'down'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center py-1 text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors shrink-0"
      aria-label={`Scroll ${direction}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={direction === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
        />
      </svg>
    </button>
  );
}

export const PartsTray = forwardRef<HTMLDivElement, PartsTrayProps>(
  function PartsTray({ parts, upcomingParts, onDragStart }, ref) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const checkScroll = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      setCanScrollUp(el.scrollTop > 0);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }, []);

    useEffect(() => {
      checkScroll();
    }, [parts.length, upcomingParts.length, checkScroll]);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }, [checkScroll]);

    const scroll = (direction: 'up' | 'down') => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollBy({ top: direction === 'up' ? -100 : 100, behavior: 'smooth' });
    };

    // Unplaced awarded parts (still in tray)
    const trayParts = parts.filter(p => !p.isPlaced);

    // Build the combined view: for each upcoming slot, show the real part if awarded, or silhouette
    // upcomingParts is the full ordered list for this family from current position
    // trayParts are the ones already awarded but not placed
    // We match by path: if a tray part's path matches an upcoming slot, show it colored
    const awardedPaths = new Map<string, AwardedPart[]>();
    for (const p of trayParts) {
      const list = awardedPaths.get(p.path) || [];
      list.push(p);
      awardedPaths.set(p.path, list);
    }

    // Track which awarded parts we've consumed (for duplicates)
    const usedAwardedIds = new Set<string>();

    const slots = upcomingParts.map((path, i) => {
      const available = awardedPaths.get(path);
      const match = available?.find(p => !usedAwardedIds.has(p.id));
      if (match) {
        usedAwardedIds.add(match.id);
        return { type: 'awarded' as const, part: match, key: match.id };
      }
      return { type: 'silhouette' as const, path, key: `sil-${i}` };
    });

    // Any awarded parts not matched to an upcoming slot (edge case)
    const unmatchedAwarded = trayParts.filter(p => !usedAwardedIds.has(p.id));

    return (
      <div
        ref={ref}
        className="w-20 md:w-24 bg-gray-100 rounded-xl p-1.5 flex flex-col gap-1 flex-shrink-0"
      >
        <p className="text-[10px] text-gray-500 text-center font-medium shrink-0">Parts</p>
        {canScrollUp && <ScrollArrow direction="up" onClick={() => scroll('up')} />}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'none' }}>
          <div className="flex flex-col gap-1">
            {/* Unmatched awarded parts first */}
            {unmatchedAwarded.map(part => (
              <TrayItem key={part.id} part={part} onDragStart={onDragStart} />
            ))}
            {/* Ordered slots: awarded (colored) or silhouette */}
            {slots.map(slot =>
              slot.type === 'awarded' ? (
                <TrayItem key={slot.key} part={slot.part} onDragStart={onDragStart} />
              ) : (
                <SilhouetteItem key={slot.key} path={slot.path} />
              )
            )}
          </div>
        </div>
        {canScrollDown && <ScrollArrow direction="down" onClick={() => scroll('down')} />}
      </div>
    );
  }
);
