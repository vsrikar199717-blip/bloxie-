interface ActionButtonProps {
  onClick: () => void;
  color: 'primary' | 'secondary' | 'blue' | 'purple' | 'amber' | 'gray' | 'ink' | 'sunny' | 'outline';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * `ink` / `sunny` / `outline` are the onboarding language: black, yellow and
 * bordered pills. The saturated variants above them predate it and are still
 * used where colour carries meaning (the red/orange/green assessment marks).
 */
const colorClasses = {
  primary: 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl',
  secondary: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl',
  blue: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl',
  purple: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white rounded-xl',
  amber: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl',
  gray: 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white rounded-xl',
  ink: 'bg-[#111111] hover:bg-black text-white rounded-full',
  sunny: 'bg-[#FFF07A] hover:brightness-95 text-[#111111] rounded-full shadow-[0_12px_30px_-10px_rgba(255,150,80,0.55)]',
  outline: 'bg-white hover:bg-[#f6f6f6] text-[#1a1a1a] border-2 border-[#e6e6e6] rounded-full',
};

export function ActionButton({ onClick, color, children, className = '', disabled = false }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorClasses[color]}
        font-bold text-lg md:text-2xl
        py-2 px-6 md:py-4 md:px-8
        min-h-[44px] md:min-h-[60px] w-full
        touch-manipulation
        transition-all duration-150
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </button>
  );
}
