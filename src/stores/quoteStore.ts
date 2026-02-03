import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Quote } from '@/types';
import { getTodayQuote, getRandomQuote } from '@/services/quotesService';
import { chromeStorage } from '@/lib/chromeStorage';
import { getTodayDate } from '@/lib/dateUtils';

interface QuoteState {
  quote: Quote | null;
  cachedDate: string;

  // Actions
  loadQuote: () => void;
  refreshQuote: () => void;
}

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
