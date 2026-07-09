interface ActionButtonProps {
  onClick: () => void;
  color: 'primary' | 'secondary' | 'blue' | 'purple' | 'amber' | 'gray';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const colorClasses = {
  primary: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
  secondary: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700',
  blue: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
  purple: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
  amber: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',
  gray: 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700',
};

export function ActionButton({ onClick, color, children, className = '', disabled = false }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colorClasses[color]}
        text-white font-bold text-lg md:text-2xl
        py-2 px-6 md:py-4 md:px-8 rounded-xl
        min-h-[44px] md:min-h-[60px] w-full
        touch-manipulation
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </button>
  );
}
