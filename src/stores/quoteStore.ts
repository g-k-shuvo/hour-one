import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Quote } from '@/types';
import { getTodayQuote, getRandomQuote } from '@/services/quotesService';

interface QuoteState {
  quote: Quote | null;
  cachedDate: string;

  // Actions
  loadQuote: () => void;
  refreshQuote: () => void;
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

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      quote: null,
      cachedDate: '',

      loadQuote: () => {
        const today = getTodayDate();
        const { cachedDate, quote } = get();

        // Use cached quote if it's from today
        if (cachedDate === today && quote) {
          return;
        }

        // Get today's quote
        const todayQuote = getTodayQuote();
        set({
          quote: todayQuote,
          cachedDate: today,
        });
      },

      refreshQuote: () => {
        const newQuote = getRandomQuote();
        set({
          quote: newQuote,
          cachedDate: getTodayDate(),
        });
      },
    }),
    {
      name: 'hour-one-quote',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
