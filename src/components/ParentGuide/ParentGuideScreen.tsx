import { GuideContent } from './GuideContent';

interface ParentGuideScreenProps {
  onComplete: () => void;
}

export function ParentGuideScreen({ onComplete }: ParentGuideScreenProps) {
  return (
    <div className="min-h-screen bg-[#FFFFCC] flex items-center justify-center p-6">
      <div className="w-[700px] max-w-[95vw] max-h-[85vh] bg-white rounded-[53px] border-3 border-[#A1A100] px-10 py-8 flex flex-col">
        <GuideContent mode="walkthrough" onComplete={onComplete} />
      </div>
    </div>
  );
}
