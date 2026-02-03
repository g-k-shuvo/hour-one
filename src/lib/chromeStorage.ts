/**
 * Shared Chrome storage adapter for Zustand persist middleware
 * Provides error handling and fallback to localStorage
 */

export interface StorageError {
  operation: 'get' | 'set' | 'remove';
  key: string;
  error: unknown;
}

// Optional error handler for debugging/logging
let errorHandler: ((error: StorageError) => void) | null = null;

export function setStorageErrorHandler(handler: (error: StorageError) => void) {
  errorHandler = handler;
}

function handleError(operation: 'get' | 'set' | 'remove', key: string, error: unknown) {
  const storageError: StorageError = { operation, key, error };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error(`[chromeStorage] ${operation} failed for key "${key}":`, error);
  }

  // Call custom error handler if set
  errorHandler?.(storageError);
}

/**
 * Chrome storage adapter compatible with Zustand's createJSONStorage
 * Automatically falls back to localStorage when chrome.storage is unavailable
 */
export const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const result = await chrome.storage.local.get(name);
        return result[name] ?? null;
      }
      return localStorage.getItem(name);
    } catch (error) {
      handleError('get', name, error);
      // Try localStorage as fallback
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [name]: value });
      } else {
        localStorage.setItem(name, value);
      }
    } catch (error) {
      handleError('set', name, error);
      // Try localStorage as fallback for chrome.storage errors
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        try {
          localStorage.setItem(name, value);
        } catch {
          // Both storage methods failed - data loss possible
        }
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.remove(name);
      } else {
        localStorage.removeItem(name);
      }
    } catch (error) {
      handleError('remove', name, error);
      // Try localStorage as fallback
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        try {
          localStorage.removeItem(name);
        } catch {
          // Ignore removal errors
        }
      }
    }
  },
};
