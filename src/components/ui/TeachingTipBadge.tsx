import { useState } from 'react';

interface TeachingTipBadgeProps {
  tip: string;
  label?: string;
  position?: 'top' | 'bottom' | 'inline';
  tone?: 'blue' | 'purple';
}

export function TeachingTipBadge({
  tip,
  label = 'For parents',
  position = 'top',
  tone = 'blue',
}: TeachingTipBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // For inline position, don't use absolute positioning
  const containerClass = position === 'inline'
    ? 'relative z-10'
    : `absolute ${position === 'top' ? 'top-4' : 'bottom-4'} right-4 z-10`;

  return (
    <div className={containerClass}>
      {/* Badge button */}
      <button
        onClick={toggleExpanded}
        className={`
          px-3 py-2 rounded-full
          flex items-center gap-2
          text-sm font-medium
          transition-all duration-300
          ${tone === 'blue'
            ? (isExpanded
              ? 'bg-blue-500 text-white shadow-lg scale-105'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-md')
            : (isExpanded
              ? 'bg-purple-500 text-white shadow-lg scale-105'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200 hover:shadow-md')
            }
        `}
        aria-label="Show teaching tip"
      >
        <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          💡
        </span>
        <span>Tips for grown ups</span>
      </button>

      {/* Expanded tip panel with spin-out animation */}
      <div
        className={`
          absolute ${position === 'bottom' ? 'bottom-14' : 'top-14'} right-0
          w-72 p-4
          bg-white rounded-xl shadow-xl
          border-2 ${tone === 'blue' ? 'border-blue-200' : 'border-purple-200'}
          z-20
          transition-all duration-300 ease-out
          origin-top-right
          ${isExpanded
            ? 'opacity-100 scale-100 rotate-0 translate-y-0'
            : 'opacity-0 scale-75 -rotate-6 -translate-y-2 pointer-events-none'
          }
        `}
      >
        <div className={`flex items-center gap-2 ${tone === 'blue' ? 'text-blue-600' : 'text-purple-600'} mb-2`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
          </svg>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <div className="text-base text-gray-700 leading-relaxed">
          {tip}
        </div>
      </div>

      {/* Backdrop to close on tap outside */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
