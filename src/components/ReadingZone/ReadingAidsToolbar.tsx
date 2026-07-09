import { useState, useRef, useEffect } from 'react';
import type { ReadingAids, Theme } from '../../types/profile';
import { THEME_LABELS } from '../../types/profile';
import './storyScreen.css';

interface ReadingAidsToolbarProps {
  readingAids: ReadingAids;
  onUpdateReadingAids: (aids: ReadingAids) => void;
  visualPhonemeMarking: boolean;
  onTogglePhonemeMarking: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  currentTheme: Theme;
  onChangeTheme: (theme: Theme) => void;
}

const THEMES: Theme[] = ['robot', 'mystical', 'monster'];

export function ReadingAidsToolbar({
  readingAids,
  onUpdateReadingAids,
  visualPhonemeMarking,
  onTogglePhonemeMarking,
  onOpenGuide,
  onOpenSettings,
  currentTheme,
  onChangeTheme,
}: ReadingAidsToolbarProps) {
  const [showThemePicker, setShowThemePicker] = useState(false);
  const themePickerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showThemePicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target as Node)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showThemePicker]);

  const handleToggleRuler = () => {
    onUpdateReadingAids({
      ...readingAids,
      ruler: !readingAids.ruler,
    });
  };

  const handleToggleLightbox = () => {
    onUpdateReadingAids({
      ...readingAids,
      lightbox: !readingAids.lightbox,
    });
  };

  return (
    <div className="reading-aids-toolbar">
      <button
        onClick={handleToggleRuler}
        className={`toolbar-btn ${readingAids.ruler ? 'toolbar-btn-active' : 'toolbar-btn-inactive'}`}
        aria-pressed={readingAids.ruler}
        aria-label={`Ruler ${readingAids.ruler ? 'on' : 'off'}`}
        title="Ruler"
      >
        <span className="toolbar-icon">📏</span>
        <span className="toolbar-label">Ruler</span>
      </button>

      <button
        onClick={handleToggleLightbox}
        className={`toolbar-btn ${readingAids.lightbox ? 'toolbar-btn-active' : 'toolbar-btn-inactive'}`}
        aria-pressed={readingAids.lightbox}
        aria-label={`Lightbox ${readingAids.lightbox ? 'on' : 'off'}`}
        title="Lightbox"
      >
        <span className="toolbar-icon">💡</span>
        <span className="toolbar-label">Lightbox</span>
      </button>

      <button
        onClick={onTogglePhonemeMarking}
        className={`toolbar-btn ${visualPhonemeMarking ? 'toolbar-btn-active' : 'toolbar-btn-inactive'}`}
        aria-pressed={visualPhonemeMarking}
        aria-label={`Sound marks ${visualPhonemeMarking ? 'on' : 'off'}`}
        title="Sound marks"
      >
        <span className="toolbar-icon" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Aa</span>
        <span className="toolbar-label">Marks</span>
      </button>

      <div className="flex-1" />

      {/* Theme picker */}
      <div className="relative" ref={themePickerRef}>
        <button
          onClick={() => setShowThemePicker(!showThemePicker)}
          className={`toolbar-btn ${showThemePicker ? 'toolbar-btn-active' : 'toolbar-btn-inactive'}`}
          aria-label="Change category"
          title="Change category"
        >
          <span className="toolbar-icon">{THEME_LABELS[currentTheme].emoji}</span>
          <span className="toolbar-label">Theme</span>
        </button>
        {showThemePicker && (
          <div className="absolute left-0 top-full mt-2 md:left-full md:top-0 md:mt-0 md:ml-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-1 z-50"
               style={{ minWidth: '140px' }}>
            {THEMES.map(t => (
              <button
                key={t}
                onClick={() => { onChangeTheme(t); setShowThemePicker(false); }}
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors
                  ${t === currentTheme ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <span>{THEME_LABELS[t].emoji}</span>
                <span>{THEME_LABELS[t].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onOpenGuide}
        className="toolbar-btn toolbar-btn-inactive"
        aria-label="Help guide"
        title="Help guide"
      >
        <span className="toolbar-icon" style={{ fontSize: '1rem', fontWeight: 700 }}>?</span>
        <span className="toolbar-label">Help</span>
      </button>

      <button
        onClick={onOpenSettings}
        className="toolbar-btn toolbar-btn-inactive"
        aria-label="Settings"
        title="Settings"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="toolbar-label">Settings</span>
      </button>
    </div>
  );
}
