import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';
import { getTodayDate } from '@/lib/dateUtils';

interface FocusState {
  focus: string;
  focusDate: string;
  isCompleted: boolean;

  // Actions
  setFocus: (text: string) => void;
  completeFocus: () => void;
  toggleComplete: () => void;
  clearFocus: () => void;
}

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

      toggleComplete: () => {
        set((state) => ({ isCompleted: !state.isCompleted }));
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
