/** Cute plant-in-pot illustration with growth stages for onboarding cards */
export function PlantIllustration({
  size = 60,
  stage = 'medium',
}: {
  size?: number;
  stage?: 'small' | 'medium' | 'tall';
}) {
  if (stage === 'small') {
    // Seedling — short stem, two small leaves
    return (
      <svg width={size} height={size * 1.1} viewBox="0 0 60 66" fill="none">
        {/* Pot */}
        <path d="M16 44 L14 60 Q14 64 18 64 L42 64 Q46 64 46 60 L44 44 Z" fill="#7EC8D4" />
        <path d="M16 44 L44 44 Q46 44 46 46 L44 49 Q14 49 14 46 Q14 44 16 44" fill="#5BB8C8" />
        <ellipse cx="30" cy="45" rx="14" ry="4" fill="#8B6914" opacity="0.3" />
        {/* Short stem */}
        <path d="M30 44 Q30 38 30 34" stroke="#5CAA5C" strokeWidth="3" strokeLinecap="round" />
        {/* Two small leaves */}
        <path d="M30 38 Q24 34 22 30 Q26 33 30 36" fill="#6DC06D" />
        <path d="M30 36 Q36 32 38 28 Q34 31 30 34" fill="#7ED47E" />
        {/* Face */}
        <circle cx="25" cy="53" r="1.5" fill="#333" />
        <circle cx="35" cy="53" r="1.5" fill="#333" />
        <path d="M27 57 Q30 59 33 57" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (stage === 'tall') {
    // Tall — long stem, multiple leaves, bushy top
    return (
      <svg width={size} height={size * 1.1} viewBox="0 0 60 66" fill="none">
        {/* Pot */}
        <path d="M16 42 L14 60 Q14 64 18 64 L42 64 Q46 64 46 60 L44 42 Z" fill="#7EC8D4" />
        <path d="M16 42 L44 42 Q46 42 46 44 L44 48 Q14 48 14 44 Q14 42 16 42" fill="#5BB8C8" />
        <ellipse cx="30" cy="43" rx="14" ry="4" fill="#8B6914" opacity="0.3" />
        {/* Tall stem */}
        <path d="M30 42 Q30 26 30 12" stroke="#5CAA5C" strokeWidth="3" strokeLinecap="round" />
        {/* Bottom leaves */}
        <path d="M30 36 Q20 30 16 24 Q22 28 30 32" fill="#6DC06D" />
        <path d="M30 36 Q40 30 44 24 Q38 28 30 32" fill="#6DC06D" />
        {/* Middle leaves */}
        <path d="M30 28 Q22 22 18 14 Q24 20 30 24" fill="#7ED47E" />
        <path d="M30 28 Q38 22 42 14 Q36 20 30 24" fill="#7ED47E" />
        {/* Top leaves */}
        <path d="M30 18 Q24 8 20 2 Q26 8 30 14" fill="#8DE88D" />
        <path d="M30 18 Q36 8 40 2 Q34 8 30 14" fill="#8DE88D" />
        <path d="M30 14 Q28 6 26 2 Q29 7 30 12" fill="#6DC06D" />
        {/* Face */}
        <circle cx="25" cy="52" r="1.5" fill="#333" />
        <circle cx="35" cy="52" r="1.5" fill="#333" />
        <path d="M27 56 Q30 58 33 56" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  // Medium (default) — standard plant
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 60 66" fill="none">
      {/* Pot */}
      <path d="M16 42 L14 60 Q14 64 18 64 L42 64 Q46 64 46 60 L44 42 Z" fill="#7EC8D4" />
      <path d="M16 42 L44 42 Q46 42 46 44 L44 48 Q14 48 14 44 Q14 42 16 42" fill="#5BB8C8" />
      <ellipse cx="30" cy="43" rx="14" ry="4" fill="#8B6914" opacity="0.3" />
      {/* Stem */}
      <path d="M30 42 Q30 30 30 22" stroke="#5CAA5C" strokeWidth="3" strokeLinecap="round" />
      {/* Left leaf */}
      <path d="M30 32 Q20 26 18 18 Q22 22 30 28" fill="#6DC06D" />
      <path d="M30 32 Q20 26 18 18" stroke="#5CAA5C" strokeWidth="1" fill="none" />
      {/* Right leaf */}
      <path d="M30 26 Q40 20 42 12 Q38 16 30 22" fill="#6DC06D" />
      <path d="M30 26 Q40 20 42 12" stroke="#5CAA5C" strokeWidth="1" fill="none" />
      {/* Top leaf */}
      <path d="M30 22 Q26 12 22 6 Q28 10 30 18" fill="#7ED47E" />
      <path d="M30 22 Q34 12 38 6 Q32 10 30 18" fill="#7ED47E" />
      {/* Face */}
      <circle cx="25" cy="52" r="1.5" fill="#333" />
      <circle cx="35" cy="52" r="1.5" fill="#333" />
      <path d="M27 56 Q30 58 33 56" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
