import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';

export interface SavedTab {
  url: string;
  title: string;
  favicon?: string;
  pinned: boolean;
}

export interface TabSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tabs: SavedTab[];
  tabCount: number;
}

interface TabStashState {
  // Data
  sessions: TabSession[];

  // Permissions
  hasPermission: boolean;
  isApiAvailable: boolean;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  saveCurrentTabs: (name?: string) => Promise<TabSession | null>;
  restoreSession: (sessionId: string, closeCurrentTabs?: boolean) => Promise<boolean>;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => void;
  clearError: () => void;
}

// Generate unique ID
const generateId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Check if Chrome tabs API is available
const isTabsApiAvailable = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.tabs;
};

// Check if we have tabs permission
const checkTabsPermission = async (): Promise<boolean> => {
  if (!isTabsApiAvailable()) return false;

  try {
    if (chrome.permissions) {
      return new Promise((resolve) => {
        chrome.permissions.contains({ permissions: ['tabs'] }, (result) => {
          resolve(result);
        });
      });
    }
    return false;
  } catch {
    return false;
  }
};

// Request tabs permission
const requestTabsPermission = async (): Promise<boolean> => {
  if (!isTabsApiAvailable()) return false;

  try {
    if (chrome.permissions) {
      return new Promise((resolve) => {
        chrome.permissions.request({ permissions: ['tabs'] }, (granted) => {
          resolve(granted);
        });
      });
    }
    return false;
  } catch {
    return false;
  }
};

// Get all tabs from current window
const getCurrentTabs = async (): Promise<SavedTab[]> => {
  if (!isTabsApiAvailable()) return [];

  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const savedTabs: SavedTab[] = tabs
        .filter((tab) => tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'))
        .map((tab) => ({
          url: tab.url || '',
          title: tab.title || tab.url || 'Untitled',
          favicon: tab.favIconUrl,
          pinned: tab.pinned || false,
        }));
      resolve(savedTabs);
    });
  });
};

// Restore tabs from a session
const restoreTabs = async (tabs: SavedTab[], closeCurrentTabs: boolean): Promise<boolean> => {
  if (!isTabsApiAvailable()) return false;

  try {
    // Optionally close current tabs first (except pinned and this extension)
    if (closeCurrentTabs) {
      const currentTabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
        chrome.tabs.query({ currentWindow: true }, resolve);
      });

      const tabsToClose = currentTabs
        .filter((tab) => !tab.pinned && tab.url && !tab.url.startsWith('chrome-extension://'))
        .map((tab) => tab.id)
        .filter((id): id is number => id !== undefined);

      if (tabsToClose.length > 0) {
        await new Promise<void>((resolve) => {
          chrome.tabs.remove(tabsToClose, () => resolve());
        });
      }
    }

    // Create new tabs from session
    for (const tab of tabs) {
      await new Promise<void>((resolve) => {
        chrome.tabs.create({ url: tab.url, pinned: tab.pinned, active: false }, () => resolve());
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to restore tabs:', error);
    return false;
  }
};

export const useTabStashStore = create<TabStashState>()(
  persist(
    (set, get) => ({
      sessions: [],
      hasPermission: false,
      isApiAvailable: isTabsApiAvailable(),
      isLoading: false,
      error: null,

      checkPermission: async () => {
        const hasPermission = await checkTabsPermission();
        set({ hasPermission });
        return hasPermission;
      },

      requestPermission: async () => {
        set({ isLoading: true, error: null });
        try {
          const granted = await requestTabsPermission();
          set({ hasPermission: granted, isLoading: false });
          return granted;
        } catch (error) {
          set({ isLoading: false, error: 'Failed to request permission' });
          return false;
        }
      },

      saveCurrentTabs: async (name?: string) => {
        const { hasPermission } = get();
        if (!hasPermission) {
          set({ error: 'Tabs permission not granted' });
          return null;
        }

        set({ isLoading: true, error: null });

        try {
          const tabs = await getCurrentTabs();

          if (tabs.length === 0) {
            set({ isLoading: false, error: 'No tabs to save' });
            return null;
          }

          const session: TabSession = {
            id: generateId(),
            name: name || `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tabs,
            tabCount: tabs.length,
          };

          set((state) => ({
            sessions: [session, ...state.sessions],
            isLoading: false,
          }));

          return session;
        } catch (error) {
          set({ isLoading: false, error: 'Failed to save tabs' });
          return null;
        }
      },

      restoreSession: async (sessionId: string, closeCurrentTabs = false) => {
        const { sessions, hasPermission } = get();

        if (!hasPermission) {
          set({ error: 'Tabs permission not granted' });
          return false;
        }

        const session = sessions.find((s) => s.id === sessionId);
        if (!session) {
          set({ error: 'Session not found' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const success = await restoreTabs(session.tabs, closeCurrentTabs);
          set({ isLoading: false });
          return success;
        } catch (error) {
          set({ isLoading: false, error: 'Failed to restore session' });
          return false;
        }
      },

      deleteSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
        }));
      },

      renameSession: (sessionId: string, name: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, name, updatedAt: Date.now() } : s
          ),
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'hour-one-tab-stash',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        sessions: state.sessions,
      }),
    }
  )
);
