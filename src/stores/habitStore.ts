import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';
import { getTodayDate } from '@/lib/dateUtils';

export interface HabitCompletion {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string; // emoji
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  customDays?: number[]; // 0 = Sunday, 6 = Saturday
  completions: HabitCompletion[];
  createdAt: string;
  archived?: boolean;
  order: number;
}

interface HabitState {
  habits: Habit[];

  addHabit: (name: string, icon: string, color: string, frequency?: Habit['frequency'], customDays?: number[]) => void;
  updateHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'completions'>>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  toggleCompletion: (habitId: string, date?: string) => void;
  reorderHabits: (habits: Habit[]) => void;
}

function generateId(): string {
  return `habit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Preset colors for habits
export const HABIT_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f97316', // orange
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#eab308', // yellow
];

// Preset icons for habits
export const HABIT_ICONS = [
  '💪', // exercise
  '📚', // reading
  '💧', // water
  '🧘', // meditation
  '🏃', // running
  '💤', // sleep
  '🥗', // healthy eating
  '✍️', // journaling
  '🎯', // goals
  '🧠', // learning
  '🎨', // creativity
  '🌅', // morning routine
  '🌙', // evening routine
  '💊', // vitamins
  '🚶', // walking
  '📱', // screen time
];

// Calculate current streak for a habit
export function calculateStreak(habit: Habit): number {
  const today = getTodayDate();
  const sortedCompletions = [...habit.completions]
    .filter(c => c.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedCompletions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date(today);

  // Check if today or yesterday is completed to start the streak
  const todayCompleted = sortedCompletions.some(c => c.date === today);
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayCompleted = sortedCompletions.some(c => c.date === yesterdayStr);

  if (!todayCompleted && !yesterdayCompleted) return 0;

  // Start from the most recent completed day
  if (todayCompleted) {
    currentDate = new Date(today);
  } else {
    currentDate = yesterday;
  }

  // Count consecutive days going backwards
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const isCompleted = sortedCompletions.some(c => c.date === dateStr);

    // Check if this day should be counted based on frequency
    if (shouldTrackDay(habit, currentDate)) {
      if (isCompleted) {
        streak++;
      } else {
        break;
      }
    }

    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);

    // Safety limit
    if (streak > 365) break;
  }

  return streak;
}

// Calculate longest streak ever
export function calculateLongestStreak(habit: Habit): number {
  const sortedCompletions = [...habit.completions]
    .filter(c => c.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedCompletions.length === 0) return 0;

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  for (const completion of sortedCompletions) {
    const currentDate = new Date(completion.date);

    if (lastDate === null) {
      currentStreak = 1;
    } else {
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        // Check if gap was due to non-tracking days (weekends/weekdays)
        let allNonTrackingDays = true;
        const checkDate = new Date(lastDate);
        checkDate.setDate(checkDate.getDate() + 1);

        while (checkDate < currentDate) {
          if (shouldTrackDay(habit, checkDate)) {
            allNonTrackingDays = false;
            break;
          }
          checkDate.setDate(checkDate.getDate() + 1);
        }

        if (allNonTrackingDays) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    lastDate = currentDate;
  }

  return longestStreak;
}

// Check if a habit should be tracked on a given day
export function shouldTrackDay(habit: Habit, date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      return habit.customDays?.includes(dayOfWeek) ?? true;
    default:
      return true;
  }
}

// Get completion rate for last N days
export function getCompletionRate(habit: Habit, days: number = 30): number {
  const today = new Date(getTodayDate());
  let trackableDays = 0;
  let completedDays = 0;

  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);

    if (shouldTrackDay(habit, checkDate)) {
      trackableDays++;
      const dateStr = checkDate.toISOString().split('T')[0];
      if (habit.completions.some(c => c.date === dateStr && c.completed)) {
        completedDays++;
      }
    }
  }

  if (trackableDays === 0) return 0;
  return Math.round((completedDays / trackableDays) * 100);
}

// Get completions for the last 7 days (for weekly view)
export function getWeekCompletions(habit: Habit): { date: string; dayName: string; completed: boolean; isToday: boolean; shouldTrack: boolean }[] {
  const today = getTodayDate();
  const result: { date: string; dayName: string; completed: boolean; isToday: boolean; shouldTrack: boolean }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const completed = habit.completions.some(c => c.date === dateStr && c.completed);
    const shouldTrack = shouldTrackDay(habit, date);

    result.push({
      date: dateStr,
      dayName: dayNames[date.getDay()],
      completed,
      isToday: dateStr === today,
      shouldTrack,
    });
  }

  return result;
}

// Check if habit is completed today
export function isCompletedToday(habit: Habit): boolean {
  const today = getTodayDate();
  return habit.completions.some(c => c.date === today && c.completed);
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],

      addHabit: (name, icon, color, frequency = 'daily', customDays) => {
        const { habits } = get();
        const maxOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order)) : -1;

        const newHabit: Habit = {
          id: generateId(),
          name: name.trim(),
          icon,
          color,
          frequency,
          customDays,
          completions: [],
          createdAt: new Date().toISOString(),
          order: maxOrder + 1,
        };

        set({ habits: [...habits, newHabit] });
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));
      },

      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archived: !h.archived } : h
          ),
        }));
      },

      toggleCompletion: (habitId, date) => {
        const targetDate = date || getTodayDate();

        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== habitId) return habit;

            const existingIndex = habit.completions.findIndex(c => c.date === targetDate);

            if (existingIndex >= 0) {
              // Toggle existing completion
              const newCompletions = [...habit.completions];
              newCompletions[existingIndex] = {
                ...newCompletions[existingIndex],
                completed: !newCompletions[existingIndex].completed,
              };
              return { ...habit, completions: newCompletions };
            } else {
              // Add new completion
              return {
                ...habit,
                completions: [...habit.completions, { date: targetDate, completed: true }],
              };
            }
          }),
        }));
      },

      reorderHabits: (habits) => {
        set({ habits });
      },
    }),
    {
      name: 'hour-one-habits',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
