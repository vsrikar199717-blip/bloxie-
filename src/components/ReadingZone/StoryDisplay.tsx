import { ActionButton } from '../ui/ActionButton';
import { ReadingGuide } from '../ui/ReadingGuide';
import { StyledText } from '../ui/StyledText';

interface StoryDisplayProps {
  story: string;
  onComplete: () => void;
  onSpeak: () => void;
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
}

export function StoryDisplay({ story, onComplete, onSpeak }: StoryDisplayProps) {
  const sentences = splitIntoSentences(story);

  return (
    <div className="flex flex-col h-full p-8">
      {/* Story display area */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        {sentences.map((sentence, index) => (
          <div key={index} className="flex flex-col gap-1">
            <StyledText size="story">{sentence}</StyledText>
            <ReadingGuide />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4">
        <ActionButton onClick={onSpeak} color="blue">
          🔊 Read story aloud
        </ActionButton>
        <ActionButton onClick={onComplete} color="primary">
          Done reading! →
        </ActionButton>
      </div>
    </div>
  );
}
