import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Mantra } from '@/types';
import { getTodayMantra, getNextMantra, getMantraById } from '@/services/mantrasService';

interface MantraState {
  showMantra: boolean;
  currentMantra: Mantra | null;
  cachedDate: string;
  pinnedMantraId: string | null;
  favoriteIds: string[];
  hiddenIds: string[];

  // Actions
  setShowMantra: (show: boolean) => void;
  loadMantra: () => void;
  skipMantra: () => void;
  pinCurrentMantra: () => void;
  unpinMantra: () => void;
  toggleFavorite: (id: string) => void;
  hideMantra: (id: string) => void;
  unhideMantra: (id: string) => void;
}

// Get today's date as YYYY-MM-DD
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Chrome storage adapter
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(name);
      return result[name] ?? null;
    }
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [name]: value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(name);
    } else {
      localStorage.removeItem(name);
    }
  },
};

export const useMantraStore = create<MantraState>()(
  persist(
    (set, get) => ({
      showMantra: false,
      currentMantra: null,
      cachedDate: '',
      pinnedMantraId: null,
      favoriteIds: [],
      hiddenIds: [],

      setShowMantra: (show) => {
        set({ showMantra: show });
        if (show) {
          get().loadMantra();
        }
      },

      loadMantra: () => {
        const today = getTodayDate();
        const { cachedDate, currentMantra, pinnedMantraId, hiddenIds } = get();

        // If pinned, always use pinned mantra
        if (pinnedMantraId) {
          const pinnedMantra = getMantraById(pinnedMantraId);
          if (pinnedMantra) {
            set({ currentMantra: pinnedMantra });
            return;
          }
        }

        // Use cached mantra if it's from today
        if (cachedDate === today && currentMantra) {
          return;
        }

        // Get today's mantra
        const todayMantra = getTodayMantra(hiddenIds);
        set({
          currentMantra: todayMantra,
          cachedDate: today,
        });
      },

      skipMantra: () => {
        const { currentMantra, hiddenIds, pinnedMantraId } = get();

        // If pinned, unpin first
        if (pinnedMantraId) {
          set({ pinnedMantraId: null });
        }

        const newMantra = getNextMantra(currentMantra?.id || null, hiddenIds);
        set({
          currentMantra: newMantra,
          cachedDate: getTodayDate(),
        });
      },

      pinCurrentMantra: () => {
        const { currentMantra } = get();
        if (currentMantra) {
          set({ pinnedMantraId: currentMantra.id });
        }
      },

      unpinMantra: () => {
        set({ pinnedMantraId: null });
      },

      toggleFavorite: (id) => {
        const { favoriteIds } = get();
        if (favoriteIds.includes(id)) {
          set({ favoriteIds: favoriteIds.filter(fid => fid !== id) });
        } else {
          set({ favoriteIds: [...favoriteIds, id] });
        }
      },

      hideMantra: (id) => {
        const { hiddenIds, currentMantra, pinnedMantraId } = get();

        // Add to hidden list
        const newHiddenIds = [...hiddenIds, id];
        set({ hiddenIds: newHiddenIds });

        // If hiding current mantra, get next one
        if (currentMantra?.id === id) {
          // Unpin if pinned
          if (pinnedMantraId === id) {
            set({ pinnedMantraId: null });
          }
          const newMantra = getNextMantra(id, newHiddenIds);
          set({
            currentMantra: newMantra,
            cachedDate: getTodayDate(),
          });
        }
      },

      unhideMantra: (id) => {
        const { hiddenIds } = get();
        set({ hiddenIds: hiddenIds.filter(hid => hid !== id) });
      },
    }),
    {
      name: 'hour-one-mantra',
      storage: createJSONStorage(() => chromeStorage),
      onRehydrateStorage: () => (state) => {
        // Check if mantra is from a previous day and not pinned
        if (state && !state.pinnedMantraId) {
          const today = getTodayDate();
          if (state.cachedDate !== today) {
            // Load fresh mantra for new day
            const todayMantra = getTodayMantra(state.hiddenIds);
            state.currentMantra = todayMantra;
            state.cachedDate = today;
          }
        }
      },
    }
  )
);
