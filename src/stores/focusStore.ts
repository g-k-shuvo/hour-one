import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FocusState {
  focus: string;
  focusDate: string;
  isCompleted: boolean;

  // Actions
  setFocus: (text: string) => void;
  completeFocus: () => void;
  clearFocus: () => void;
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

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      focus: '',
      focusDate: getTodayDate(),
      isCompleted: false,

      setFocus: (text) => {
        const today = getTodayDate();
        const currentDate = get().focusDate;

        // If it's a new day, reset the focus
        if (currentDate !== today) {
          set({
            focus: text,
            focusDate: today,
            isCompleted: false,
          });
        } else {
          set({ focus: text });
        }
      },

      completeFocus: () => {
        set({ isCompleted: true });
      },

      clearFocus: () => {
        set({
          focus: '',
          isCompleted: false,
        });
      },
    }),
    {
      name: 'hour-one-focus',
      storage: createJSONStorage(() => chromeStorage),
      onRehydrateStorage: () => (state) => {
        // Check if focus is from a previous day
        if (state) {
          const today = getTodayDate();
          if (state.focusDate !== today) {
            // Reset for new day
            state.focus = '';
            state.focusDate = today;
            state.isCompleted = false;
          }
        }
      },
    }
  )
);
