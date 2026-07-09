import { CONSTANTS } from '../../utils/constants';

interface StyledTextProps {
  children: React.ReactNode;
  size?: 'word' | 'story' | 'button';
  className?: string;
}

const sizeClasses = {
  word: 'text-5xl md:text-7xl', // 48px → 72px
  story: 'text-3xl md:text-4xl', // 30px → 36px
  button: 'text-2xl', // 24px
};

export function StyledText({ children, size = 'word', className = '' }: StyledTextProps) {
  return (
    <span
      className={`
        dyslexia-text
        ${sizeClasses[size]}
        text-black
        ${className}
      `}
      style={{
        letterSpacing: CONSTANTS.typography.letterSpacing,
        lineHeight: CONSTANTS.typography.lineHeight,
      }}
    >
      {children}
    </span>
  );
}
