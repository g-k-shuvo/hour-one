import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, RefreshCw, CloudOff, X, MoreHorizontal } from 'lucide-react';
import { useWeatherStore } from '@/stores/weatherStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { celsiusToFahrenheit, getWindDirectionArrow } from '@/services/weatherService';

interface WeatherProps {
  compact?: boolean;
}

export function Weather({ compact = false }: WeatherProps) {
  const { weather, isLoading, error, permissionDenied, loadWeather, refreshWeather } =
    useWeatherStore();
  const { temperatureUnit } = useSettingsStore();
  const [showExpanded, setShowExpanded] = useState(false);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const formatTemperature = (celsius: number): string => {
    if (temperatureUnit === 'fahrenheit') {
      return `${celsiusToFahrenheit(celsius)}°`;
    }
    return `${celsius}°`;
  };

  const formatTempNumber = (celsius: number): number => {
    if (temperatureUnit === 'fahrenheit') {
      return celsiusToFahrenheit(celsius);
    }
    return celsius;
  };

  // Compact mode - just icon and temperature (clickable)
  if (compact) {
    // Error states in compact mode
    if (permissionDenied || (error && !weather)) {
      return (
        <div className="flex items-center gap-2 text-white/60">
          <CloudOff size={18} />
          <span className="text-sm">--°</span>
        </div>
      );
    }

    // Loading state (only show if no cached data)
    if (isLoading && !weather) {
      return (
        <div className="flex items-center gap-2 text-white/60">
          <RefreshCw size={18} className="animate-spin" />
        </div>
      );
    }

    // No weather data yet
    if (!weather) {
      return null;
    }

    return (
      <>
        <button
          onClick={() => setShowExpanded(true)}
          className="flex items-center gap-2 text-white select-none hover:text-white/80 transition-colors"
        >
          <span className="text-lg" role="img" aria-label={weather.condition}>
            {weather.icon}
          </span>
          <span className="text-sm font-light">
            {formatTemperature(weather.temperature)}
          </span>
        </button>

        {/* Expanded Weather Panel */}
        {showExpanded && createPortal(
          <WeatherExpandedPanel
            weather={weather}
            isLoading={isLoading}
            formatTemperature={formatTemperature}
            formatTempNumber={formatTempNumber}
            temperatureUnit={temperatureUnit}
            onClose={() => setShowExpanded(false)}
            onRefresh={refreshWeather}
          />,
          document.body
        )}
      </>
    );
  }

  // Full mode - original display (kept for compatibility)
  // Error state - permission denied
  if (permissionDenied) {
    return (
      <div className="glass-dark rounded-xl p-4">
        <div className="flex items-center gap-3 text-white/60">
          <CloudOff size={24} />
          <div>
            <p className="text-sm">Location access denied</p>
            <button
              onClick={refreshWeather}
              className="mt-1 text-xs text-white/40 hover:text-white/60"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state - other errors
  if (error && !weather) {
    return (
      <div className="glass-dark rounded-xl p-4">
        <div className="flex items-center gap-3 text-white/60">
          <CloudOff size={24} />
          <div>
            <p className="text-sm">{error}</p>
            <button
              onClick={refreshWeather}
              className="mt-1 text-xs text-white/40 hover:text-white/60"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (only show if no cached data)
  if (isLoading && !weather) {
    return (
      <div className="glass-dark rounded-xl p-4">
        <div className="flex items-center gap-3 text-white/60">
          <RefreshCw size={24} className="animate-spin" />
          <p className="text-sm">Loading weather...</p>
        </div>
      </div>
    );
  }

  // No weather data yet
  if (!weather) {
    return null;
  }

  return (
    <div className="glass-dark group rounded-xl p-4">
      <div className="flex items-center gap-4">
        {/* Weather icon */}
        <span className="text-4xl" role="img" aria-label={weather.condition}>
          {weather.icon}
        </span>

        {/* Temperature and condition */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light text-white">
              {formatTemperature(weather.temperature)}
            </span>
            {isLoading && (
              <RefreshCw size={14} className="animate-spin text-white/40" />
            )}
          </div>
          <p className="text-sm text-white/70">{weather.condition}</p>
        </div>

        {/* Refresh button (visible on hover) */}
        <button
          onClick={refreshWeather}
          disabled={isLoading}
          className="ml-auto rounded-full p-2 text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white/60 group-hover:opacity-100 disabled:opacity-50"
          aria-label="Refresh weather"
          title="Refresh weather"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Location and details */}
      <div className="mt-3 flex items-center gap-4 border-t border-white/10 pt-3 text-xs text-white/50">
        <div className="flex items-center gap-1">
          <MapPin size={12} />
          <span>{weather.location}</span>
        </div>
        {weather.feelsLike !== undefined && (
          <span>Feels like {formatTemperature(weather.feelsLike)}</span>
        )}
        {weather.humidity !== undefined && (
          <span>{weather.humidity}% humidity</span>
        )}
      </div>
    </div>
  );
}

// Expanded Weather Panel Component
interface WeatherExpandedPanelProps {
  weather: NonNullable<ReturnType<typeof useWeatherStore.getState>['weather']>;
  isLoading: boolean;
  formatTemperature: (celsius: number) => string;
  formatTempNumber: (celsius: number) => number;
  temperatureUnit: 'celsius' | 'fahrenheit';
  onClose: () => void;
  onRefresh: () => void;
}

function WeatherExpandedPanel({
  weather,
  isLoading,
  formatTemperature,
  formatTempNumber,
  temperatureUnit,
  onClose,
  onRefresh,
}: WeatherExpandedPanelProps) {
  const windUnit = temperatureUnit === 'fahrenheit' ? 'mph' : 'km/h';
  const windSpeed = temperatureUnit === 'fahrenheit' && weather.windSpeed
    ? Math.round(weather.windSpeed * 0.621371)
    : weather.windSpeed;

  const visibilityUnit = temperatureUnit === 'fahrenheit' ? 'mi' : 'km';
  const visibility = temperatureUnit === 'fahrenheit' && weather.visibility
    ? Math.round(weather.visibility * 0.621371)
    : weather.visibility;

  const pressureUnit = temperatureUnit === 'fahrenheit' ? 'inHg' : 'hPa';
  const pressure = temperatureUnit === 'fahrenheit' && weather.pressure
    ? (weather.pressure * 0.02953).toFixed(2)
    : weather.pressure;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4"
      style={{ animation: 'fadeIn 200ms ease-out' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ animation: 'slideIn 200ms ease-out' }}
      >
        {/* Header */}
        <div className="p-5 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-medium text-white">{weather.location}</h2>
              <p className="text-sm text-white/60">{weather.condition}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
                aria-label="Refresh weather"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Main Temperature */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-3">
              <span className="text-5xl" role="img" aria-label={weather.condition}>
                {weather.icon}
              </span>
              <span className="text-6xl font-light text-white">
                {formatTempNumber(weather.temperature)}°
              </span>
            </div>
            <div className="text-sm text-white/70 space-y-1">
              {weather.feelsLike !== undefined && (
                <p>Feels like <span className="text-white">{formatTemperature(weather.feelsLike)}</span></p>
              )}
              {weather.precipitation !== undefined && (
                <p>Precipitation <span className="text-white">{weather.precipitation} mm</span></p>
              )}
              {weather.windSpeed !== undefined && weather.windDirection !== undefined && (
                <p>Wind <span className="text-white">{getWindDirectionArrow(weather.windDirection)} {windSpeed} {windUnit}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Hourly Forecast */}
        {weather.hourlyForecast && weather.hourlyForecast.length > 0 && (
          <div className="mt-5 px-5 py-3 border-t border-white/10">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {weather.hourlyForecast.map((hour, index) => (
                <div key={index} className="flex flex-col items-center min-w-[40px]">
                  <span className="text-xs text-white/50">{hour.time}</span>
                  <span className="text-lg my-1">{hour.icon}</span>
                  <span className="text-xs text-white">{formatTempNumber(hour.temperature)}°</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="mt-2 px-5 py-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {weather.sunrise && (
              <div className="flex justify-between">
                <span className="text-white/50">Sunrise</span>
                <span className="text-white">{weather.sunrise}</span>
              </div>
            )}
            {weather.humidity !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/50">Humidity</span>
                <span className="text-white">{weather.humidity}%</span>
              </div>
            )}
            {weather.sunset && (
              <div className="flex justify-between">
                <span className="text-white/50">Sunset</span>
                <span className="text-white">{weather.sunset}</span>
              </div>
            )}
            {weather.precipitation !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/50">Precipitation</span>
                <span className="text-white">{weather.precipitation} mm</span>
              </div>
            )}
            {weather.uvIndex !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/50">UV Index</span>
                <span className="text-white">{weather.uvIndex}</span>
              </div>
            )}
            {weather.pressure !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/50">Pressure</span>
                <span className="text-white">{pressure} {pressureUnit}</span>
              </div>
            )}
            {weather.visibility !== undefined && (
              <div className="flex justify-between">
                <span className="text-white/50">Visibility</span>
                <span className="text-white">{visibility} {visibilityUnit}</span>
              </div>
            )}
          </div>
        </div>

        {/* Daily Forecast */}
        {weather.dailyForecast && weather.dailyForecast.length > 0 && (
          <div className="px-5 py-4 border-t border-white/10">
            <div className="flex justify-between">
              {weather.dailyForecast.map((day, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span className="text-xs text-white/50 font-medium">{day.day}</span>
                  <span className="text-xl my-1">{day.icon}</span>
                  <div className="text-xs">
                    <span className="text-white">{formatTempNumber(day.high)}°</span>
                    <span className="text-white/40 ml-1">{formatTempNumber(day.low)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex justify-end">
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Powered by Open-Meteo
          </a>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
