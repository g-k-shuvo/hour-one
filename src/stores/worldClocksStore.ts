import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';

export interface WorldClock {
  id: string;
  label: string;
  timezone: string;
  order: number;
}

// Popular timezones grouped by region
export const POPULAR_TIMEZONES = [
  // Americas
  { timezone: 'America/New_York', label: 'New York', region: 'Americas' },
  { timezone: 'America/Los_Angeles', label: 'Los Angeles', region: 'Americas' },
  { timezone: 'America/Chicago', label: 'Chicago', region: 'Americas' },
  { timezone: 'America/Denver', label: 'Denver', region: 'Americas' },
  { timezone: 'America/Toronto', label: 'Toronto', region: 'Americas' },
  { timezone: 'America/Vancouver', label: 'Vancouver', region: 'Americas' },
  { timezone: 'America/Mexico_City', label: 'Mexico City', region: 'Americas' },
  { timezone: 'America/Sao_Paulo', label: 'São Paulo', region: 'Americas' },
  { timezone: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'Americas' },
  // Europe
  { timezone: 'Europe/London', label: 'London', region: 'Europe' },
  { timezone: 'Europe/Paris', label: 'Paris', region: 'Europe' },
  { timezone: 'Europe/Berlin', label: 'Berlin', region: 'Europe' },
  { timezone: 'Europe/Madrid', label: 'Madrid', region: 'Europe' },
  { timezone: 'Europe/Rome', label: 'Rome', region: 'Europe' },
  { timezone: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Europe' },
  { timezone: 'Europe/Moscow', label: 'Moscow', region: 'Europe' },
  { timezone: 'Europe/Istanbul', label: 'Istanbul', region: 'Europe' },
  // Asia
  { timezone: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia' },
  { timezone: 'Asia/Shanghai', label: 'Shanghai', region: 'Asia' },
  { timezone: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia' },
  { timezone: 'Asia/Singapore', label: 'Singapore', region: 'Asia' },
  { timezone: 'Asia/Seoul', label: 'Seoul', region: 'Asia' },
  { timezone: 'Asia/Mumbai', label: 'Mumbai', region: 'Asia' },
  { timezone: 'Asia/Dubai', label: 'Dubai', region: 'Asia' },
  { timezone: 'Asia/Bangkok', label: 'Bangkok', region: 'Asia' },
  { timezone: 'Asia/Jakarta', label: 'Jakarta', region: 'Asia' },
  // Oceania
  { timezone: 'Australia/Sydney', label: 'Sydney', region: 'Oceania' },
  { timezone: 'Australia/Melbourne', label: 'Melbourne', region: 'Oceania' },
  { timezone: 'Australia/Perth', label: 'Perth', region: 'Oceania' },
  { timezone: 'Pacific/Auckland', label: 'Auckland', region: 'Oceania' },
  // Africa
  { timezone: 'Africa/Cairo', label: 'Cairo', region: 'Africa' },
  { timezone: 'Africa/Johannesburg', label: 'Johannesburg', region: 'Africa' },
  { timezone: 'Africa/Lagos', label: 'Lagos', region: 'Africa' },
];

// Get all available timezones from the browser
export function getAllTimezones(): string[] {
  // Use Intl.supportedValuesOf if available (modern browsers)
  if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
    try {
      return (Intl as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf('timeZone');
    } catch {
      // Fallback to our list
    }
  }
  return POPULAR_TIMEZONES.map(t => t.timezone);
}

// Format time for a specific timezone
export function formatTimeForTimezone(timezone: string, format: '12h' | '24h'): string {
  try {
    const now = new Date();
    return now.toLocaleTimeString([], {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: format === '12h',
    });
  } catch {
    return '--:--';
  }
}

// Get timezone offset string (e.g., "+5:30", "-8:00")
export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart?.value?.replace('GMT', '') || '';
  } catch {
    return '';
  }
}

// Get relative time difference from local timezone
export function getRelativeOffset(timezone: string): string {
  try {
    const now = new Date();
    const localOffset = now.getTimezoneOffset();

    // Get the offset for the target timezone
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const localFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
    });

    const targetHour = parseInt(targetFormatter.format(now));
    const localHour = parseInt(localFormatter.format(now));

    let diff = targetHour - localHour;
    if (diff > 12) diff -= 24;
    if (diff < -12) diff += 24;

    if (diff === 0) return 'Same time';
    if (diff > 0) return `+${diff}h`;
    return `${diff}h`;
  } catch {
    return '';
  }
}

// Check if it's daytime in a timezone (rough estimate: 6am-6pm)
export function isDaytime(timezone: string): boolean {
  try {
    const now = new Date();
    const hour = parseInt(new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(now));
    return hour >= 6 && hour < 18;
  } catch {
    return true;
  }
}

interface WorldClocksState {
  clocks: WorldClock[];

  addClock: (timezone: string, label?: string) => void;
  removeClock: (id: string) => void;
  updateClock: (id: string, updates: Partial<Omit<WorldClock, 'id'>>) => void;
  reorderClocks: (clocks: WorldClock[]) => void;
}

function generateId(): string {
  return `wc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useWorldClocksStore = create<WorldClocksState>()(
  persist(
    (set, get) => ({
      clocks: [],

      addClock: (timezone, label) => {
        const { clocks } = get();

        // Don't add duplicate timezones
        if (clocks.some(c => c.timezone === timezone)) return;

        // Find label from popular timezones if not provided
        const popularTz = POPULAR_TIMEZONES.find(t => t.timezone === timezone);
        const clockLabel = label || popularTz?.label || timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;

        const maxOrder = clocks.length > 0 ? Math.max(...clocks.map(c => c.order)) : -1;

        const newClock: WorldClock = {
          id: generateId(),
          label: clockLabel,
          timezone,
          order: maxOrder + 1,
        };

        set({ clocks: [...clocks, newClock] });
      },

      removeClock: (id) => {
        set((state) => ({
          clocks: state.clocks.filter(c => c.id !== id),
        }));
      },

      updateClock: (id, updates) => {
        set((state) => ({
          clocks: state.clocks.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      reorderClocks: (clocks) => {
        set({ clocks });
      },
    }),
    {
      name: 'hour-one-world-clocks',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
