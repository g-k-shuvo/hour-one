import type { WeatherData, HourlyForecast, DailyForecast } from '@/types';

// Weather condition codes from Open-Meteo
// https://open-meteo.com/en/docs
const WEATHER_CONDITIONS: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear sky', icon: '☀️' },
  1: { condition: 'Mainly clear', icon: '🌤️' },
  2: { condition: 'Partly cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Fog', icon: '🌫️' },
  48: { condition: 'Depositing rime fog', icon: '🌫️' },
  51: { condition: 'Light drizzle', icon: '🌧️' },
  53: { condition: 'Moderate drizzle', icon: '🌧️' },
  55: { condition: 'Dense drizzle', icon: '🌧️' },
  56: { condition: 'Light freezing drizzle', icon: '🌨️' },
  57: { condition: 'Dense freezing drizzle', icon: '🌨️' },
  61: { condition: 'Slight rain', icon: '🌧️' },
  63: { condition: 'Moderate rain', icon: '🌧️' },
  65: { condition: 'Heavy rain', icon: '🌧️' },
  66: { condition: 'Light freezing rain', icon: '🌨️' },
  67: { condition: 'Heavy freezing rain', icon: '🌨️' },
  71: { condition: 'Slight snow', icon: '🌨️' },
  73: { condition: 'Moderate snow', icon: '🌨️' },
  75: { condition: 'Heavy snow', icon: '❄️' },
  77: { condition: 'Snow grains', icon: '🌨️' },
  80: { condition: 'Slight rain showers', icon: '🌦️' },
  81: { condition: 'Moderate rain showers', icon: '🌦️' },
  82: { condition: 'Violent rain showers', icon: '⛈️' },
  85: { condition: 'Slight snow showers', icon: '🌨️' },
  86: { condition: 'Heavy snow showers', icon: '❄️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Get user's current location using browser geolocation API
 */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Get location name from coordinates using reverse geocoding
 */
export async function getLocationName(coords: Coordinates): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
    );
    const data = await response.json();

    // Try to get city name, fallback to other location info
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      data.address?.county ||
      'Unknown location'
    );
  } catch {
    return 'Unknown location';
  }
}

/**
 * Format hour for display (e.g., "8PM", "12AM")
 */
function formatHour(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}${ampm}`;
}

/**
 * Format day for display (e.g., "WED", "THU")
 */
function formatDay(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

/**
 * Format time for sunrise/sunset (e.g., "6:24AM")
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')}${ampm}`;
}

/**
 * Get icon for weather code
 */
function getWeatherIcon(code: number): string {
  return WEATHER_CONDITIONS[code]?.icon || '❓';
}

/**
 * Fetch weather data from Open-Meteo API
 */
export async function fetchWeather(coords: Coordinates): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', coords.latitude.toString());
  url.searchParams.set('longitude', coords.longitude.toString());
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,uv_index,surface_pressure,visibility'
  );
  url.searchParams.set('hourly', 'temperature_2m,weather_code');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '6'); // Today + 5 days

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();
  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;
  const weatherCode = current.weather_code;
  const weatherInfo = WEATHER_CONDITIONS[weatherCode] || { condition: 'Unknown', icon: '❓' };

  // Get location name
  const location = await getLocationName(coords);

  // Process hourly forecast (next 12 hours from current time)
  const currentHourIndex = hourly.time.findIndex((t: string) => {
    const hourTime = new Date(t);
    const now = new Date();
    return hourTime >= now;
  });

  const hourlyForecast: HourlyForecast[] = [];
  for (let i = 0; i < 12 && currentHourIndex + i < hourly.time.length; i++) {
    const idx = currentHourIndex + i;
    hourlyForecast.push({
      time: formatHour(hourly.time[idx]),
      temperature: Math.round(hourly.temperature_2m[idx]),
      icon: getWeatherIcon(hourly.weather_code[idx]),
    });
  }

  // Process daily forecast (skip today, show next 5 days)
  const dailyForecast: DailyForecast[] = [];
  for (let i = 1; i < daily.time.length && dailyForecast.length < 5; i++) {
    dailyForecast.push({
      day: formatDay(daily.time[i]),
      icon: getWeatherIcon(daily.weather_code[i]),
      high: Math.round(daily.temperature_2m_max[i]),
      low: Math.round(daily.temperature_2m_min[i]),
    });
  }

  return {
    temperature: Math.round(current.temperature_2m),
    condition: weatherInfo.condition,
    icon: weatherInfo.icon,
    location,
    humidity: current.relative_humidity_2m,
    feelsLike: Math.round(current.apparent_temperature),
    windSpeed: Math.round(current.wind_speed_10m),
    windDirection: current.wind_direction_10m,
    precipitation: current.precipitation,
    uvIndex: Math.round(current.uv_index),
    pressure: Math.round(current.surface_pressure),
    visibility: Math.round(current.visibility / 1000), // Convert to km
    sunrise: formatTime(daily.sunrise[0]),
    sunset: formatTime(daily.sunset[0]),
    hourlyForecast,
    dailyForecast,
  };
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Get wind direction as arrow character
 */
export function getWindDirectionArrow(degrees: number): string {
  // Wind direction points TO where wind is going, arrows show FROM
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  const index = Math.round(degrees / 45) % 8;
  return arrows[index];
}
