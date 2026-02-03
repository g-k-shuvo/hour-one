import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuickLink, LinkGroup } from '@/types';
import { chromeStorage } from '@/lib/chromeStorage';

// Result type for operations that might fail silently
export type OperationResult = { success: true } | { success: false; reason: string };

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
  deleteGroup: (id: string) => OperationResult;

  // View mode
  setViewMode: (mode: 'tile' | 'list') => void;

  // Pinning actions (return result for feedback)
  pinLink: (id: string) => OperationResult;
  unpinLink: (id: string) => void;
  pinGroup: (id: string) => OperationResult;
  unpinGroup: (id: string) => void;
  reorderPinned: (items: Array<{ type: 'link' | 'group'; id: string }>) => OperationResult;
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
        const state = get();
        const group = state.groups.find(g => g.id === id);

        if (!group) {
          return { success: false, reason: 'Group not found' };
        }

        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          // Unassign links from deleted group
          links: state.links.map((link) =>
            link.groupId === id ? { ...link, groupId: undefined } : link
          ),
        }));

        return { success: true };
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      pinLink: (id) => {
        const { links, groups } = get();

        // Check if link exists
        const link = links.find(l => l.id === id);
        if (!link) {
          return { success: false, reason: 'Link not found' };
        }

        // Check if already pinned
        if (link.pinned) {
          return { success: false, reason: 'Link is already pinned' };
        }

        // Check max pinned limit
        if (countPinned(links, groups) >= MAX_PINNED) {
          return { success: false, reason: `Maximum of ${MAX_PINNED} pinned items reached` };
        }

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

        return { success: true };
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

        // Check if group exists
        const group = groups.find(g => g.id === id);
        if (!group) {
          return { success: false, reason: 'Group not found' };
        }

        // Check if already pinned
        if (group.pinned) {
          return { success: false, reason: 'Group is already pinned' };
        }

        // Check max pinned limit
        if (countPinned(links, groups) >= MAX_PINNED) {
          return { success: false, reason: `Maximum of ${MAX_PINNED} pinned items reached` };
        }

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

        return { success: true };
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
        const { links, groups } = get();

        // Validate all items exist before reordering
        const invalidItems: string[] = [];
        for (const item of items) {
          if (item.type === 'link') {
            const link = links.find(l => l.id === item.id);
            if (!link) {
              invalidItems.push(`Link ${item.id}`);
            } else if (!link.pinned) {
              invalidItems.push(`Link ${item.id} is not pinned`);
            }
          } else {
            const group = groups.find(g => g.id === item.id);
            if (!group) {
              invalidItems.push(`Group ${item.id}`);
            } else if (!group.pinned) {
              invalidItems.push(`Group ${item.id} is not pinned`);
            }
          }
        }

        if (invalidItems.length > 0) {
          if (import.meta.env.DEV) {
            console.warn('[QuickLinksStore] reorderPinned: Invalid items:', invalidItems);
          }
          return { success: false, reason: `Invalid items: ${invalidItems.join(', ')}` };
        }

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

        return { success: true };
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
