import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BackgroundImage } from '@/types';
import {
  fetchTodayBackground,
  preloadTomorrowBackground,
  getRandomBackground,
} from '@/services/backgroundService';
import { chromeStorage } from '@/lib/chromeStorage';
import { getTodayDate } from '@/lib/dateUtils';

interface BackgroundState {
  background: BackgroundImage | null;
  cachedDate: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadBackground: () => Promise<void>;
  refreshBackground: () => void;
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      background: null,
      cachedDate: '',
      isLoading: false,
      error: null,

      loadBackground: async () => {
        const today = getTodayDate();
        const { cachedDate, background } = get();

        // Use cached background if it's from today
        if (cachedDate === today && background) {
          // Still preload tomorrow's image
          preloadTomorrowBackground();
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const newBackground = await fetchTodayBackground();
          set({
            background: newBackground,
            cachedDate: today,
            isLoading: false,
          });

          // Preload tomorrow's image
          preloadTomorrowBackground();
        } catch (error) {
          set({
            error: 'Failed to load background',
            isLoading: false,
          });
        }
      },

      refreshBackground: () => {
        const newBackground = getRandomBackground();
        set({
          background: newBackground,
          cachedDate: getTodayDate(),
        });
      },
    }),
    {
      name: 'hour-one-background',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        background: state.background,
        cachedDate: state.cachedDate,
      }),
    }
  )
);
