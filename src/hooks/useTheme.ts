import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export type ResolvedTheme = 'light' | 'dark';

export function useTheme(): ResolvedTheme {
  const { themeMode } = useSettingsStore();
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    if (themeMode === 'system') {
      // Check system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');

      // Listen for changes
      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedTheme(themeMode);
    }
  }, [themeMode]);

  return resolvedTheme;
}

// Helper to get dropdown classes based on theme
export function useDropdownTheme() {
  const theme = useTheme();

  const isDark = theme === 'dark';

  return {
    theme,
    isDark,
    // Dropdown container styles
    dropdown: isDark
      ? 'bg-neutral-900 border border-white/10 text-white'
      : 'bg-white border border-gray-200 text-gray-900 shadow-lg',
    // Menu item styles
    menuItem: isDark
      ? 'text-white/80 hover:bg-white/10'
      : 'text-gray-700 hover:bg-gray-100',
    // Active/selected menu item
    menuItemActive: isDark
      ? 'bg-white/10 text-white'
      : 'bg-gray-100 text-gray-900',
    // Section header/label
    sectionLabel: isDark
      ? 'text-white/40'
      : 'text-gray-400',
    // Divider
    divider: isDark
      ? 'border-white/10'
      : 'border-gray-200',
    // Input fields inside dropdown
    input: isDark
      ? 'bg-white/10 border-white/20 text-white placeholder-white/40'
      : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-400',
  };
}
