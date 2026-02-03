import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  category: 'navigation' | 'actions' | 'panels' | 'focus';
}

// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { id: 'openSettings', key: ',', modifiers: ['ctrl'], description: 'Open Settings', category: 'navigation' },
  { id: 'showHelp', key: '/', modifiers: ['ctrl'], description: 'Show Keyboard Shortcuts', category: 'navigation' },

  // Panels
  { id: 'toggleTodos', key: 't', modifiers: ['alt'], description: 'Toggle Tasks Panel', category: 'panels' },
  { id: 'toggleLinks', key: 'l', modifiers: ['alt'], description: 'Toggle Quick Links', category: 'panels' },
  { id: 'toggleHabits', key: 'h', modifiers: ['alt'], description: 'Toggle Habits', category: 'panels' },
  { id: 'toggleBalance', key: 'b', modifiers: ['alt'], description: 'Toggle Balance', category: 'panels' },
  { id: 'toggleMetrics', key: 'm', modifiers: ['alt'], description: 'Toggle Metrics', category: 'panels' },
  { id: 'toggleWorldClocks', key: 'w', modifiers: ['alt'], description: 'Toggle World Clocks', category: 'panels' },
  { id: 'toggleCountdowns', key: 'c', modifiers: ['alt'], description: 'Toggle Countdowns', category: 'panels' },

  // Actions
  { id: 'startFocusMode', key: 'f', modifiers: ['alt'], description: 'Start Focus Mode', category: 'actions' },
  { id: 'startAutofocus', key: 'a', modifiers: ['alt'], description: 'Start Autofocus', category: 'actions' },
  { id: 'startWork', key: 's', modifiers: ['alt'], description: 'Start/Stop Work Timer', category: 'actions' },
  { id: 'newTask', key: 'n', modifiers: ['alt'], description: 'New Task', category: 'actions' },

  // Focus Mode specific (when in focus mode)
  { id: 'pauseResume', key: ' ', modifiers: [], description: 'Pause/Resume Timer', category: 'focus' },
  { id: 'skipBreak', key: 's', modifiers: [], description: 'Skip Break', category: 'focus' },
  { id: 'exitFocus', key: 'Escape', modifiers: [], description: 'Exit Focus Mode', category: 'focus' },
];

interface KeyboardState {
  enabled: boolean;
  showHelp: boolean;
  customShortcuts: Record<string, Partial<KeyboardShortcut>>;

  // Actions
  setEnabled: (enabled: boolean) => void;
  setShowHelp: (show: boolean) => void;
  toggleHelp: () => void;
  customizeShortcut: (id: string, updates: Partial<KeyboardShortcut>) => void;
  resetShortcuts: () => void;

  // Getters
  getShortcut: (id: string) => KeyboardShortcut | undefined;
  getAllShortcuts: () => KeyboardShortcut[];
}

export const useKeyboardStore = create<KeyboardState>()(
  persist(
    (set, get) => ({
      enabled: true,
      showHelp: false,
      customShortcuts: {},

      setEnabled: (enabled) => set({ enabled }),

      setShowHelp: (show) => set({ showHelp: show }),

      toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),

      customizeShortcut: (id, updates) => {
        set((state) => ({
          customShortcuts: {
            ...state.customShortcuts,
            [id]: { ...state.customShortcuts[id], ...updates },
          },
        }));
      },

      resetShortcuts: () => set({ customShortcuts: {} }),

      getShortcut: (id) => {
        const state = get();
        const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id);
        if (!defaultShortcut) return undefined;

        const custom = state.customShortcuts[id];
        if (custom) {
          return { ...defaultShortcut, ...custom };
        }
        return defaultShortcut;
      },

      getAllShortcuts: () => {
        const state = get();
        return DEFAULT_SHORTCUTS.map(shortcut => ({
          ...shortcut,
          ...state.customShortcuts[shortcut.id],
        }));
      },
    }),
    {
      name: 'hour-one-keyboard',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        customShortcuts: state.customShortcuts,
      }),
    }
  )
);

// Helper function to format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers.includes('ctrl')) parts.push('Ctrl');
  if (shortcut.modifiers.includes('alt')) parts.push('Alt');
  if (shortcut.modifiers.includes('shift')) parts.push('Shift');
  if (shortcut.modifiers.includes('meta')) parts.push('⌘');

  // Format the key nicely
  let keyDisplay = shortcut.key;
  if (shortcut.key === ' ') keyDisplay = 'Space';
  if (shortcut.key === 'Escape') keyDisplay = 'Esc';
  if (shortcut.key.length === 1) keyDisplay = shortcut.key.toUpperCase();

  parts.push(keyDisplay);

  return parts.join(' + ');
}

// Helper to check if a keyboard event matches a shortcut
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check modifiers
  const ctrlRequired = shortcut.modifiers.includes('ctrl');
  const altRequired = shortcut.modifiers.includes('alt');
  const shiftRequired = shortcut.modifiers.includes('shift');
  const metaRequired = shortcut.modifiers.includes('meta');

  if (ctrlRequired !== event.ctrlKey) return false;
  if (altRequired !== event.altKey) return false;
  if (shiftRequired !== event.shiftKey) return false;
  if (metaRequired !== event.metaKey) return false;

  // Check key
  const eventKey = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();

  return eventKey === shortcutKey;
}
