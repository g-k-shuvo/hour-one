import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WeatherData } from '@/types';
import { getCurrentPosition, fetchWeather } from '@/services/weatherService';
import { chromeStorage } from '@/lib/chromeStorage';

interface WeatherState {
  weather: WeatherData | null;
  lastFetched: number | null;
  isLoading: boolean;
  error: string | null;
  permissionDenied: boolean;

  // Actions
  loadWeather: () => Promise<void>;
  refreshWeather: () => Promise<void>;
}

// Cache duration: 30 minutes
const CACHE_DURATION = 30 * 60 * 1000;

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      weather: null,
      lastFetched: null,
      isLoading: false,
      error: null,
      permissionDenied: false,

      loadWeather: async () => {
        const { lastFetched, weather, isLoading, permissionDenied } = get();

        // Don't fetch if already loading
        if (isLoading) return;

        // Don't fetch if permission was denied
        if (permissionDenied) return;

        // Use cached data if still valid
        if (weather && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const coords = await getCurrentPosition();
          const weatherData = await fetchWeather(coords);

          set({
            weather: weatherData,
            lastFetched: Date.now(),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const isPermissionError =
            error instanceof GeolocationPositionError &&
            error.code === error.PERMISSION_DENIED;

          set({
            isLoading: false,
            error: isPermissionError
              ? 'Location access denied'
              : 'Failed to load weather',
            permissionDenied: isPermissionError,
          });
        }
      },

      refreshWeather: async () => {
        const { isLoading } = get();
        if (isLoading) return;

        set({ isLoading: true, error: null, permissionDenied: false });

        try {
          const coords = await getCurrentPosition();
          const weatherData = await fetchWeather(coords);

          set({
            weather: weatherData,
            lastFetched: Date.now(),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const isPermissionError =
            error instanceof GeolocationPositionError &&
            error.code === error.PERMISSION_DENIED;

          set({
            isLoading: false,
            error: isPermissionError
              ? 'Location access denied'
              : 'Failed to load weather',
            permissionDenied: isPermissionError,
          });
        }
      },
    }),
    {
      name: 'hour-one-weather',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        weather: state.weather,
        lastFetched: state.lastFetched,
        permissionDenied: state.permissionDenied,
      }),
    }
  )
);
