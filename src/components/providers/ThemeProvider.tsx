import { useEffect } from 'react';
import { useSettingsStore, ACCENT_COLORS } from '@/stores/settingsStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, accentColor } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    // Determine if dark mode should be applied
    const applyDarkMode = () => {
      if (themeMode === 'dark') {
        root.classList.add('dark');
      } else if (themeMode === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyDarkMode();

    // Listen for system theme changes when in 'system' mode
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyDarkMode();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [themeMode]);

  // Apply accent color CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const color = ACCENT_COLORS[accentColor];
    root.style.setProperty('--accent', color.value);
    root.style.setProperty('--accent-hover', color.hover);
  }, [accentColor]);

  return <>{children}</>;
}
