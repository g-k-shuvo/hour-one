import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuickLink, LinkGroup } from '@/types';

interface QuickLinksState {
  links: QuickLink[];
  groups: LinkGroup[];
  viewMode: 'tile' | 'list';

  // Link actions
  addLink: (name: string, url: string, groupId?: string, pinned?: boolean) => void;
  updateLink: (id: string, updates: Partial<Omit<QuickLink, 'id'>>) => void;
  deleteLink: (id: string) => void;
  reorderLinks: (links: QuickLink[]) => void;

  // Group actions
  addGroup: (name: string, color?: string) => void;
  updateGroup: (id: string, updates: Partial<Omit<LinkGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;

  // View mode
  setViewMode: (mode: 'tile' | 'list') => void;

  // Pinning actions
  pinLink: (id: string) => void;
  unpinLink: (id: string) => void;
  pinGroup: (id: string) => void;
  unpinGroup: (id: string) => void;
  reorderPinned: (items: Array<{ type: 'link' | 'group'; id: string }>) => void;
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

// Max pinned items
const MAX_PINNED = 5;

// Get next pinned order
function getNextPinnedOrder(links: QuickLink[], groups: LinkGroup[]): number {
  const allPinnedOrders = [
    ...links.filter((l) => l.pinned).map((l) => l.pinnedOrder ?? 0),
    ...groups.filter((g) => g.pinned).map((g) => g.pinnedOrder ?? 0),
  ];
  return allPinnedOrders.length > 0 ? Math.max(...allPinnedOrders) + 1 : 0;
}

// Count pinned items
function countPinned(links: QuickLink[], groups: LinkGroup[]): number {
  return (
    links.filter((l) => l.pinned).length + groups.filter((g) => g.pinned).length
  );
}

export const useQuickLinksStore = create<QuickLinksState>()(
  persist(
    (set, get) => ({
      links: [],
      groups: [],
      viewMode: 'tile',

      addLink: (name, url, groupId, pinned) => {
        const normalizedUrl = normalizeUrl(url);
        if (!normalizedUrl) return;

        const { links, groups } = get();
        const canPin = pinned && countPinned(links, groups) < MAX_PINNED;

        const newLink: QuickLink = {
          id: generateId(),
          name: name.trim() || new URL(normalizedUrl).hostname,
          url: normalizedUrl,
          icon: getFaviconUrl(normalizedUrl),
          groupId,
          pinned: canPin,
          pinnedOrder: canPin ? getNextPinnedOrder(links, groups) : undefined,
        };

        set((state) => ({
          links: [...state.links, newLink],
        }));
      },

      updateLink: (id, updates) => {
        set((state) => ({
          links: state.links.map((link) => {
            if (link.id !== id) return link;

            const updatedLink = { ...link, ...updates };

            // If URL changed, update the icon
            if (updates.url && updates.url !== link.url) {
              const normalizedUrl = normalizeUrl(updates.url);
              updatedLink.url = normalizedUrl;
              updatedLink.icon = getFaviconUrl(normalizedUrl);
              if (updates.name) {
                updatedLink.name =
                  updates.name.trim() || new URL(normalizedUrl).hostname;
              }
            }

            return updatedLink;
          }),
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

      addGroup: (name, color) => {
        const newGroup: LinkGroup = {
          id: generateId(),
          name: name.trim(),
          color,
        };

        set((state) => ({
          groups: [...state.groups, newGroup],
        }));
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          ),
        }));
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          // Unassign links from deleted group
          links: state.links.map((link) =>
            link.groupId === id ? { ...link, groupId: undefined } : link
          ),
        }));
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      pinLink: (id) => {
        const { links, groups } = get();
        if (countPinned(links, groups) >= MAX_PINNED) return;

        set((state) => ({
          links: state.links.map((link) =>
            link.id === id
              ? {
                  ...link,
                  pinned: true,
                  pinnedOrder: getNextPinnedOrder(state.links, state.groups),
                }
              : link
          ),
        }));
      },

      unpinLink: (id) => {
        set((state) => ({
          links: state.links.map((link) =>
            link.id === id
              ? { ...link, pinned: false, pinnedOrder: undefined }
              : link
          ),
        }));
      },

      pinGroup: (id) => {
        const { links, groups } = get();
        if (countPinned(links, groups) >= MAX_PINNED) return;

        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id
              ? {
                  ...group,
                  pinned: true,
                  pinnedOrder: getNextPinnedOrder(state.links, state.groups),
                }
              : group
          ),
        }));
      },

      unpinGroup: (id) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id
              ? { ...group, pinned: false, pinnedOrder: undefined }
              : group
          ),
        }));
      },

      reorderPinned: (items) => {
        set((state) => {
          const newLinks = [...state.links];
          const newGroups = [...state.groups];

          items.forEach((item, index) => {
            if (item.type === 'link') {
              const linkIndex = newLinks.findIndex((l) => l.id === item.id);
              if (linkIndex !== -1) {
                newLinks[linkIndex] = {
                  ...newLinks[linkIndex],
                  pinnedOrder: index,
                };
              }
            } else {
              const groupIndex = newGroups.findIndex((g) => g.id === item.id);
              if (groupIndex !== -1) {
                newGroups[groupIndex] = {
                  ...newGroups[groupIndex],
                  pinnedOrder: index,
                };
              }
            }
          });

          return { links: newLinks, groups: newGroups };
        });
      },
    }),
    {
      name: 'hour-one-quick-links',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);

// Selector for pinned items sorted by order
export function usePinnedItems() {
  const { links, groups } = useQuickLinksStore();

  const pinnedLinks = links
    .filter((l) => l.pinned)
    .map((l) => ({ type: 'link' as const, item: l }));

  const pinnedGroups = groups
    .filter((g) => g.pinned)
    .map((g) => ({ type: 'group' as const, item: g }));

  return [...pinnedLinks, ...pinnedGroups].sort(
    (a, b) => (a.item.pinnedOrder ?? 0) - (b.item.pinnedOrder ?? 0)
  );
}
