export function ReadingGuide({ width = '100%' }: { width?: string }) {
  return (
    <div
      className="rounded-full bg-blue-500"
      style={{
        height: '6px',
        width,
        boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
      }}
    />
  );
}
