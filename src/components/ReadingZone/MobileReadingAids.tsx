import { useState, useRef, useEffect } from 'react';
import type { ReadingAids } from '../../types/profile';

interface MobileReadingAidsProps {
  readingAids: ReadingAids;
  onUpdateReadingAids: (aids: ReadingAids) => void;
  visualPhonemeMarking: boolean;
  onTogglePhonemeMarking: () => void;
}

export function MobileReadingAids({
  readingAids,
  onUpdateReadingAids,
  visualPhonemeMarking,
  onTogglePhonemeMarking,
}: MobileReadingAidsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="md:hidden absolute bottom-4 left-4 z-20" ref={popoverRef}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors ${
          isOpen ? 'bg-[#4F0000] text-white' : 'bg-white text-gray-700'
        }`}
        aria-label="Reading aids"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-1 min-w-[130px]">
          <AidButton
            active={readingAids.ruler}
            onClick={() => onUpdateReadingAids({ ...readingAids, ruler: !readingAids.ruler })}
            icon="📏"
            label="Ruler"
          />
          <AidButton
            active={readingAids.lightbox}
            onClick={() => onUpdateReadingAids({ ...readingAids, lightbox: !readingAids.lightbox })}
            icon="💡"
            label="Lightbox"
          />
          <AidButton
            active={visualPhonemeMarking}
            onClick={onTogglePhonemeMarking}
            icon="Aa"
            label="Marks"
          />
        </div>
      )}
    </div>
  );
}

function AidButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
