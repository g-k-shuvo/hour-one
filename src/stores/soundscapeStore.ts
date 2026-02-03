import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';

export interface Soundscape {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'nature' | 'urban' | 'ambient' | 'white-noise';
  // Audio URL - using freesound.org or similar free sources
  audioUrl: string;
}

// Free ambient sounds from various sources
export const SOUNDSCAPES: Soundscape[] = [
  {
    id: 'rain',
    name: 'Rain',
    description: 'Gentle rainfall',
    icon: '🌧️',
    category: 'nature',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/13/audio_257112c5d7.mp3',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Birds and nature',
    icon: '🌲',
    category: 'nature',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_6bbb3d1f1c.mp3',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    description: 'Calming waves',
    icon: '🌊',
    category: 'nature',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/23/audio_ea70ad08e3.mp3',
  },
  {
    id: 'thunder',
    name: 'Thunderstorm',
    description: 'Thunder and rain',
    icon: '⛈️',
    category: 'nature',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_a58e58cd52.mp3',
  },
  {
    id: 'fire',
    name: 'Fireplace',
    description: 'Crackling fire',
    icon: '🔥',
    category: 'ambient',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c518fc2e31.mp3',
  },
  {
    id: 'cafe',
    name: 'Coffee Shop',
    description: 'Cafe ambience',
    icon: '☕',
    category: 'urban',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_756e4b8a8e.mp3',
  },
  {
    id: 'wind',
    name: 'Wind',
    description: 'Gentle breeze',
    icon: '💨',
    category: 'nature',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bed.mp3',
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    description: 'Static noise',
    icon: '📻',
    category: 'white-noise',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_942695ab28.mp3',
  },
];

interface SoundscapeState {
  // Settings
  enabled: boolean;
  volume: number;
  currentSoundscapeId: string | null;

  // Playback state (not persisted)
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentSoundscape: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

// Audio element singleton
let audioElement: HTMLAudioElement | null = null;

const getAudioElement = (): HTMLAudioElement => {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.loop = true;
    audioElement.preload = 'auto';
  }
  return audioElement;
};

export const useSoundscapeStore = create<SoundscapeState>()(
  persist(
    (set, get) => ({
      // Default values
      enabled: true,
      volume: 0.5,
      currentSoundscapeId: null,
      isPlaying: false,
      isLoading: false,
      error: null,

      setEnabled: (enabled) => {
        set({ enabled });
        if (!enabled) {
          get().pause();
        }
      },

      setVolume: (volume) => {
        set({ volume });
        const audio = getAudioElement();
        audio.volume = volume;
      },

      setCurrentSoundscape: (id) => {
        const { isPlaying } = get();
        set({ currentSoundscapeId: id, error: null });

        if (id) {
          const soundscape = SOUNDSCAPES.find((s) => s.id === id);
          if (soundscape) {
            const audio = getAudioElement();
            audio.src = soundscape.audioUrl;
            audio.volume = get().volume;

            if (isPlaying) {
              set({ isLoading: true });
              audio.play().then(() => {
                set({ isLoading: false });
              }).catch((err) => {
                set({ isLoading: false, error: err.message, isPlaying: false });
              });
            }
          }
        } else {
          get().pause();
        }
      },

      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      play: () => {
        const { currentSoundscapeId, enabled, volume } = get();
        if (!enabled || !currentSoundscapeId) return;

        const soundscape = SOUNDSCAPES.find((s) => s.id === currentSoundscapeId);
        if (!soundscape) return;

        const audio = getAudioElement();
        if (audio.src !== soundscape.audioUrl) {
          audio.src = soundscape.audioUrl;
        }
        audio.volume = volume;

        set({ isLoading: true, error: null });

        audio.play()
          .then(() => {
            set({ isPlaying: true, isLoading: false });
          })
          .catch((err) => {
            set({ isPlaying: false, isLoading: false, error: err.message });
          });
      },

      pause: () => {
        const audio = getAudioElement();
        audio.pause();
        set({ isPlaying: false });
      },

      toggle: () => {
        const { isPlaying } = get();
        if (isPlaying) {
          get().pause();
        } else {
          get().play();
        }
      },
    }),
    {
      name: 'hour-one-soundscape',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        volume: state.volume,
        currentSoundscapeId: state.currentSoundscapeId,
      }),
    }
  )
);

// Get soundscape by ID
export const getSoundscapeById = (id: string): Soundscape | undefined => {
  return SOUNDSCAPES.find((s) => s.id === id);
};

// Get soundscapes by category
export const getSoundscapesByCategory = (category: Soundscape['category']): Soundscape[] => {
  return SOUNDSCAPES.filter((s) => s.category === category);
};
