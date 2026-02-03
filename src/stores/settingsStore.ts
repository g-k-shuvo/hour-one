import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';

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

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'purple' | 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'teal';

export const ACCENT_COLORS: Record<AccentColor, { name: string; value: string; hover: string }> = {
  blue: { name: 'Blue', value: '#3b82f6', hover: '#2563eb' },
  purple: { name: 'Purple', value: '#8b5cf6', hover: '#7c3aed' },
  pink: { name: 'Pink', value: '#ec4899', hover: '#db2777' },
  red: { name: 'Red', value: '#ef4444', hover: '#dc2626' },
  orange: { name: 'Orange', value: '#f97316', hover: '#ea580c' },
  yellow: { name: 'Yellow', value: '#eab308', hover: '#ca8a04' },
  green: { name: 'Green', value: '#22c55e', hover: '#16a34a' },
  teal: { name: 'Teal', value: '#14b8a6', hover: '#0d9488' },
};

interface SettingsState {
  // User preferences
  userName: string;
  timeFormat: '12h' | '24h';
  clockStyle: 'digital' | 'analog';
  analogClockVariant: AnalogClockVariant;
  temperatureUnit: 'celsius' | 'fahrenheit';
  searchProvider: 'google' | 'bing' | 'duckduckgo' | 'ecosia';
  bookmarkDisplayMode: 'icon' | 'icon-text';

  // Theme settings
  themeMode: ThemeMode;
  accentColor: AccentColor;

  // Widget visibility
  widgets: WidgetVisibility;

  // Tasks settings
  topTaskInCenter: boolean;  // Show first Today task in Focus section

  // Actions
  setUserName: (name: string) => void;
  setTimeFormat: (format: '12h' | '24h') => void;
  setClockStyle: (style: 'digital' | 'analog') => void;
  setAnalogClockVariant: (variant: AnalogClockVariant) => void;
  setTemperatureUnit: (unit: 'celsius' | 'fahrenheit') => void;
  setSearchProvider: (provider: 'google' | 'bing' | 'duckduckgo' | 'ecosia') => void;
  setBookmarkDisplayMode: (mode: 'icon' | 'icon-text') => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleWidget: (widget: keyof WidgetVisibility) => void;
  setWidgetVisibility: (widget: keyof WidgetVisibility, visible: boolean) => void;
  setTopTaskInCenter: (enabled: boolean) => void;
}

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

      // Theme defaults
      themeMode: 'dark',
      accentColor: 'blue',

      // Tasks defaults
      topTaskInCenter: false,

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
      setThemeMode: (mode) => set({ themeMode: mode }),
      setAccentColor: (color) => set({ accentColor: color }),

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

      setTopTaskInCenter: (enabled) => set({ topTaskInCenter: enabled }),
    }),
    {
      name: 'hour-one-settings',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
