/**
 * The reading ruler. Warm orange, not blue: blue/teal raise visual stress for
 * dyslexic readers, so every reading aid in the app stays in the warm palette.
 */
export function ReadingGuide({ width = '100%' }: { width?: string }) {
  return (
    <div
      className="rounded-full"
      style={{
        height: '6px',
        width,
        background: '#F5851F',
        boxShadow: '0 0 8px rgba(245, 133, 31, 0.5)',
      }}
    />
  );
}
