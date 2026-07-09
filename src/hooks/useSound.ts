import { useCallback, useRef } from 'react';

// Available dance music tracks - add more filenames here as needed
const DANCE_TRACKS = [
  '/assets/sounds/humor-comic-silly-background-music-373168.mp3',
  '/assets/sounds/silly-comic-humor-silly-background-music-342070.mp3',
  '/assets/sounds/silly-humor-comic-background-music-364208.mp3',
];

function pickRandomTrack(): string {
  const index = Math.floor(Math.random() * DANCE_TRACKS.length);
  return DANCE_TRACKS[index];
}

export function useSound() {
  const danceAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);

  const playObjectDrop = useCallback(() => {
    if (isMutedRef.current) return;
    // Create new audio instance each time for overlapping sounds
    const audio = new Audio('/assets/sounds/object-drop.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Silently fail if audio can't play (e.g., before user interaction)
      console.log('Audio play failed - user interaction may be required first');
    });
  }, []);

  const playDanceMusic = useCallback(() => {
    // Stop any existing dance music first
    if (danceAudioRef.current) {
      danceAudioRef.current.pause();
      danceAudioRef.current.currentTime = 0;
    }

    // Pick a random track
    const trackPath = pickRandomTrack();
    const audio = new Audio(trackPath);
    audio.volume = isMutedRef.current ? 0 : 0.6;
    audio.loop = true;
    danceAudioRef.current = audio;

    audio.play().catch(() => {
      console.log('Dance audio play failed - user interaction may be required first');
    });
  }, []);

  const stopDanceMusic = useCallback(() => {
    if (danceAudioRef.current) {
      danceAudioRef.current.pause();
      danceAudioRef.current.currentTime = 0;
      danceAudioRef.current = null;
    }
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    isMutedRef.current = muted;
    if (danceAudioRef.current) {
      danceAudioRef.current.volume = muted ? 0 : 0.6;
    }
  }, []);

  return { playObjectDrop, playDanceMusic, stopDanceMusic, setMuted };
}
