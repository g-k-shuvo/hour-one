import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuickLink } from '@/types';

interface QuickLinksState {
  links: QuickLink[];

  // Actions
  addLink: (name: string, url: string) => void;
  updateLink: (id: string, name: string, url: string) => void;
  deleteLink: (id: string) => void;
  reorderLinks: (links: QuickLink[]) => void;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Normalize URL (add https:// if missing)
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

// Get favicon URL for a website
function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Use Google's favicon service for reliable icons
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return '';
  }
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

// Default links for new users
const DEFAULT_LINKS: QuickLink[] = [
  { id: 'default-1', name: 'Google', url: 'https://google.com', icon: getFaviconUrl('https://google.com') },
  { id: 'default-2', name: 'YouTube', url: 'https://youtube.com', icon: getFaviconUrl('https://youtube.com') },
  { id: 'default-3', name: 'GitHub', url: 'https://github.com', icon: getFaviconUrl('https://github.com') },
];

export const useQuickLinksStore = create<QuickLinksState>()(
  persist(
    (set) => ({
      links: DEFAULT_LINKS,

      addLink: (name, url) => {
        const normalizedUrl = normalizeUrl(url);
        if (!normalizedUrl) return;

        const newLink: QuickLink = {
          id: generateId(),
          name: name.trim() || new URL(normalizedUrl).hostname,
          url: normalizedUrl,
          icon: getFaviconUrl(normalizedUrl),
        };

        set((state) => ({
          links: [...state.links, newLink],
        }));
      },

      updateLink: (id, name, url) => {
        const normalizedUrl = normalizeUrl(url);
        if (!normalizedUrl) return;

        set((state) => ({
          links: state.links.map((link) =>
            link.id === id
              ? {
                  ...link,
                  name: name.trim() || new URL(normalizedUrl).hostname,
                  url: normalizedUrl,
                  icon: getFaviconUrl(normalizedUrl),
                }
              : link
          ),
        }));
      },

      deleteLink: (id) => {
        set((state) => ({
          links: state.links.filter((link) => link.id !== id),
        }));
      },

      reorderLinks: (links) => {
        set({ links });
      },
    }),
    {
      name: 'hour-one-quick-links',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
