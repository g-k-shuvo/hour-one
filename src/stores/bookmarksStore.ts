import { create } from 'zustand';
import {
  type Bookmark,
  getBookmarksBar,
  hasBookmarksPermission,
  requestBookmarksPermission,
  isBookmarksApiAvailable,
} from '@/services/bookmarksService';

interface BookmarksState {
  bookmarks: Bookmark[];
  isLoading: boolean;
  hasPermission: boolean;
  isApiAvailable: boolean;
  error: string | null;

  // Actions
  loadBookmarks: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refreshBookmarks: () => Promise<void>;
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  isLoading: false,
  hasPermission: false,
  isApiAvailable: isBookmarksApiAvailable(),
  error: null,

  loadBookmarks: async () => {
    const { isLoading } = get();
    if (isLoading) return;

    // Re-check if API is available (in case it wasn't ready on initial load)
    const apiAvailable = isBookmarksApiAvailable();
    if (!apiAvailable) {
      set({ isApiAvailable: false });
      return;
    }

    set({ isLoading: true, error: null, isApiAvailable: true });

    try {
      // Check permission first
      const permissionGranted = await hasBookmarksPermission();

      if (!permissionGranted) {
        set({ isLoading: false, hasPermission: false });
        return;
      }

      // Fetch bookmarks
      const bookmarks = await getBookmarksBar();
      set({
        bookmarks,
        isLoading: false,
        hasPermission: true,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to load bookmarks',
      });
    }
  },

  requestPermission: async () => {
    set({ isLoading: true, error: null });

    try {
      const granted = await requestBookmarksPermission();

      if (granted) {
        // Permission granted, load bookmarks
        const bookmarks = await getBookmarksBar();
        set({
          bookmarks,
          hasPermission: true,
          isLoading: false,
        });
        return true;
      } else {
        set({
          hasPermission: false,
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to request permission',
      });
      return false;
    }
  },

  refreshBookmarks: async () => {
    const { hasPermission, isLoading } = get();
    if (!hasPermission || isLoading) return;

    set({ isLoading: true });

    try {
      const bookmarks = await getBookmarksBar();
      set({ bookmarks, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
