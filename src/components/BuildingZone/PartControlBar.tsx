interface PartControlBarProps {
  onRotate: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onResize: () => void;
  onBringForward: () => void;
  onSendBack: () => void;
  onRemove: () => void;
}

interface ControlButtonProps {
  color: 'blue' | 'purple' | 'green' | 'orange' | 'gray' | 'red';
  icon: string;
  label?: string;
  onClick: () => void;
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500 active:bg-blue-600',
  purple: 'bg-purple-500 active:bg-purple-600',
  green: 'bg-green-500 active:bg-green-600',
  orange: 'bg-orange-500 active:bg-orange-600',
  gray: 'bg-gray-500 active:bg-gray-600',
  red: 'bg-red-500 active:bg-red-600',
};

function ControlButton({ color, icon, label, onClick }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        ${colorMap[color]} text-white
        w-10 h-10 rounded-lg
        flex flex-col items-center justify-center
        touch-manipulation
        transition-colors
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      title={label}
    >
      <span className="text-base leading-none">{icon}</span>
      {label && <span className="text-[0.45rem] leading-none mt-0.5">{label}</span>}
    </button>
  );
}

export function PartControlBar({
  onRotate, onFlipH, onFlipV, onResize,
  onBringForward, onSendBack, onRemove,
}: PartControlBarProps) {
  return (
    // No background of its own — it floats over the build scene, and the glassy
    // panel around it is supplied by BuildingZone.
    <div className="flex justify-center gap-1.5">
      <ControlButton color="blue" icon="↻" label="Rotate" onClick={onRotate} />
      <ControlButton color="purple" icon="↔" label="Flip" onClick={onFlipH} />
      <ControlButton color="green" icon="↕" label="Flip" onClick={onFlipV} />
      <ControlButton color="orange" icon="⤡" label="Size" onClick={onResize} />
      <div className="w-px bg-white/30 mx-0.5" />
      <ControlButton color="gray" icon="▲" label="Front" onClick={onBringForward} />
      <ControlButton color="gray" icon="▼" label="Back" onClick={onSendBack} />
      <div className="w-px bg-white/30 mx-0.5" />
      <ControlButton color="red" icon="✕" label="Remove" onClick={onRemove} />
    </div>
  );
}
