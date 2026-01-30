import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WidgetVisibility {
  clock: boolean;
  greeting: boolean;
  weather: boolean;
  focus: boolean;
  todos: boolean;
  quickLinks: boolean;
  quote: boolean;
  search: boolean;
  bookmarks: boolean;
}

export type AnalogClockVariant = 'classic' | 'minimal' | 'modern' | 'roman' | 'numbered' | 'badge';

interface SettingsState {
  // User preferences
  userName: string;
  timeFormat: '12h' | '24h';
  clockStyle: 'digital' | 'analog';
  analogClockVariant: AnalogClockVariant;
  temperatureUnit: 'celsius' | 'fahrenheit';
  searchProvider: 'google' | 'bing' | 'duckduckgo' | 'ecosia';
  bookmarkDisplayMode: 'icon' | 'icon-text';

  // Widget visibility
  widgets: WidgetVisibility;

  // Actions
  setUserName: (name: string) => void;
  setTimeFormat: (format: '12h' | '24h') => void;
  setClockStyle: (style: 'digital' | 'analog') => void;
  setAnalogClockVariant: (variant: AnalogClockVariant) => void;
  setTemperatureUnit: (unit: 'celsius' | 'fahrenheit') => void;
  setSearchProvider: (provider: 'google' | 'bing' | 'duckduckgo' | 'ecosia') => void;
  setBookmarkDisplayMode: (mode: 'icon' | 'icon-text') => void;
  toggleWidget: (widget: keyof WidgetVisibility) => void;
  setWidgetVisibility: (widget: keyof WidgetVisibility, visible: boolean) => void;
}

// Chrome storage adapter for Zustand
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(name);
      return result[name] ?? null;
    }
    // Fallback to localStorage for development
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [name]: value });
    } else {
      // Fallback to localStorage for development
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      userName: '',
      timeFormat: '12h',
      clockStyle: 'digital',
      analogClockVariant: 'classic',
      temperatureUnit: 'celsius',
      searchProvider: 'google',
      bookmarkDisplayMode: 'icon-text',

      widgets: {
        clock: true,
        greeting: true,
        weather: true,
        focus: true,
        todos: true,
        quickLinks: true,
        quote: true,
        search: true,
        bookmarks: true,
      },

      // Actions
      setUserName: (name) => set({ userName: name }),
      setTimeFormat: (format) => set({ timeFormat: format }),
      setClockStyle: (style) => set({ clockStyle: style }),
      setAnalogClockVariant: (variant) => set({ analogClockVariant: variant }),
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      setSearchProvider: (provider) => set({ searchProvider: provider }),
      setBookmarkDisplayMode: (mode) => set({ bookmarkDisplayMode: mode }),

      toggleWidget: (widget) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            [widget]: !state.widgets[widget],
          },
        })),

      setWidgetVisibility: (widget, visible) =>
        set((state) => ({
          widgets: {
            ...state.widgets,
            [widget]: visible,
          },
        })),
    }),
    {
      name: 'hour-one-settings',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
