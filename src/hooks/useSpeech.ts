import { useCallback, useEffect, useState } from 'react';

export function useSpeech() {
  const [britishVoice, setBritishVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();

      // Priority order for UK voices
      const ukVoice =
        voices.find(v => v.lang === 'en-GB' && v.name.includes('Female')) ||
        voices.find(v => v.lang === 'en-GB') ||
        voices.find(v => v.lang.startsWith('en-GB'));

      if (ukVoice) {
        setBritishVoice(ukVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, rate: number = 0.8) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-GB'; // Force UK English

    if (britishVoice) {
      utterance.voice = britishVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [britishVoice]);

  const speakStory = useCallback((text: string) => {
    // Stories read at slightly slower pace
    speak(text, 0.85);
  }, [speak]);

  const speakStoryWithHighlight = useCallback((
    text: string,
    onWordBoundary?: (charIndex: number) => void,
    onEnd?: () => void
  ) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-GB';

    if (britishVoice) {
      utterance.voice = britishVoice;
    }

    if (onWordBoundary) {
      utterance.onboundary = (event) => {
        // Some browsers do not populate event.name; use charIndex/charLength to detect boundaries
        const isWordEvent = event.name === 'word' || event.name === undefined || event.charLength > 0;
        if (isWordEvent) {
          onWordBoundary(event.charIndex);
        }
      };
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  }, [britishVoice]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  const isSpeaking = useCallback(() => {
    return window.speechSynthesis.speaking;
  }, []);

  return { speak, speakStory, speakStoryWithHighlight, stop, isSpeaking };
}
