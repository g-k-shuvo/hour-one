import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';

export interface CountdownTimer {
  id: string;
  title: string;
  targetDate: string; // ISO date string
  color?: string;
  createdAt: string;
  pinned?: boolean;
}

interface CountdownState {
  timers: CountdownTimer[];

  addTimer: (title: string, targetDate: string, color?: string) => void;
  updateTimer: (id: string, updates: Partial<Omit<CountdownTimer, 'id' | 'createdAt'>>) => void;
  deleteTimer: (id: string) => void;
  togglePinned: (id: string) => void;
}

function generateId(): string {
  return `cd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Calculate time remaining until target date
export interface TimeRemaining {
  total: number; // total milliseconds
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isPast: boolean;
}

export function getTimeRemaining(targetDate: string): TimeRemaining {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      isPast: true,
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    total: diff,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    isPast: false,
  };
}

// Format remaining time for display
export function formatTimeRemaining(time: TimeRemaining): string {
  if (time.isPast) return 'Completed';

  const parts: string[] = [];

  if (time.days > 0) {
    parts.push(`${time.days}d`);
  }
  if (time.hours > 0 || time.days > 0) {
    parts.push(`${time.hours}h`);
  }
  if (time.minutes > 0 || time.hours > 0 || time.days > 0) {
    parts.push(`${time.minutes}m`);
  }
  parts.push(`${time.seconds}s`);

  return parts.join(' ');
}

// Format for compact display
export function formatCompact(time: TimeRemaining): string {
  if (time.isPast) return 'Done';

  if (time.days > 365) {
    const years = Math.floor(time.days / 365);
    return `${years}y+`;
  }
  if (time.days > 30) {
    const months = Math.floor(time.days / 30);
    return `${months}mo`;
  }
  if (time.days > 0) {
    return `${time.days}d`;
  }
  if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m`;
  }
  if (time.minutes > 0) {
    return `${time.minutes}m ${time.seconds}s`;
  }
  return `${time.seconds}s`;
}

// Get relative date description
export function getRelativeDate(targetDate: string): string {
  const target = new Date(targetDate);
  const now = new Date();

  // Set both to midnight for date comparison
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.floor((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Past';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return target.toLocaleDateString('en-US', { weekday: 'long' });
  if (diffDays < 30) return `In ${diffDays} days`;

  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: target.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

// Preset colors for countdowns
export const COUNTDOWN_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f97316', // orange
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#eab308', // yellow
];

export const useCountdownStore = create<CountdownState>()(
  persist(
    (set) => ({
      timers: [],

      addTimer: (title, targetDate, color) => {
        const newTimer: CountdownTimer = {
          id: generateId(),
          title: title.trim(),
          targetDate,
          color: color || COUNTDOWN_COLORS[Math.floor(Math.random() * COUNTDOWN_COLORS.length)],
          createdAt: new Date().toISOString(),
          pinned: false,
        };

        set((state) => ({
          timers: [...state.timers, newTimer],
        }));
      },

      updateTimer: (id, updates) => {
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTimer: (id) => {
        set((state) => ({
          timers: state.timers.filter((t) => t.id !== id),
        }));
      },

      togglePinned: (id) => {
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id ? { ...t, pinned: !t.pinned } : t
          ),
        }));
      },
    }),
    {
      name: 'hour-one-countdowns',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
