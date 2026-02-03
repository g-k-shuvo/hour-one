import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';
import { getTodayDate } from '@/lib/dateUtils';

export interface WorkSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  duration: number; // minutes
  type: 'work' | 'break';
  note?: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  workMinutes: number;
  breakMinutes: number;
  sessions: WorkSession[];
}

export interface BalanceGoals {
  dailyWorkHours: number; // target work hours per day
  dailyMaxHours: number; // maximum work hours (warning threshold)
  breakInterval: number; // minutes between break reminders
  breakDuration: number; // suggested break duration in minutes
  workDays: number[]; // 0 = Sunday, 6 = Saturday
}

interface BalanceState {
  // Current session
  activeSession: WorkSession | null;

  // History
  logs: DailyLog[];

  // Goals
  goals: BalanceGoals;

  // Settings
  breakRemindersEnabled: boolean;
  lastBreakReminder: string | null;

  // Actions
  startWork: (note?: string) => void;
  stopWork: () => void;
  startBreak: () => void;
  endBreak: () => void;

  // Goals
  setGoals: (goals: Partial<BalanceGoals>) => void;
  setBreakReminders: (enabled: boolean) => void;
  dismissBreakReminder: () => void;

  // Queries
  getTodayLog: () => DailyLog;
  getWeekLogs: () => DailyLog[];
  getWorkLifeScore: () => number;
  shouldShowBreakReminder: () => boolean;
}

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getOrCreateLog(logs: DailyLog[], date: string): DailyLog {
  const existing = logs.find(l => l.date === date);
  if (existing) return existing;
  return {
    date,
    workMinutes: 0,
    breakMinutes: 0,
    sessions: [],
  };
}

const DEFAULT_GOALS: BalanceGoals = {
  dailyWorkHours: 8,
  dailyMaxHours: 10,
  breakInterval: 90, // 90 minutes
  breakDuration: 15,
  workDays: [1, 2, 3, 4, 5], // Monday to Friday
};

export const useBalanceStore = create<BalanceState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      logs: [],
      goals: DEFAULT_GOALS,
      breakRemindersEnabled: true,
      lastBreakReminder: null,

      startWork: (note) => {
        const state = get();

        // End any active session first
        if (state.activeSession) {
          state.stopWork();
        }

        const session: WorkSession = {
          id: generateId(),
          date: getTodayDate(),
          startTime: new Date().toISOString(),
          duration: 0,
          type: 'work',
          note,
        };

        set({ activeSession: session });
      },

      stopWork: () => {
        const state = get();
        if (!state.activeSession || state.activeSession.type !== 'work') return;

        const endTime = new Date();
        const startTime = new Date(state.activeSession.startTime);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        const completedSession: WorkSession = {
          ...state.activeSession,
          endTime: endTime.toISOString(),
          duration,
        };

        // Update or create today's log
        const today = getTodayDate();
        const logs = [...state.logs];
        const todayLogIndex = logs.findIndex(l => l.date === today);

        if (todayLogIndex >= 0) {
          logs[todayLogIndex] = {
            ...logs[todayLogIndex],
            workMinutes: logs[todayLogIndex].workMinutes + duration,
            sessions: [...logs[todayLogIndex].sessions, completedSession],
          };
        } else {
          logs.push({
            date: today,
            workMinutes: duration,
            breakMinutes: 0,
            sessions: [completedSession],
          });
        }

        set({ activeSession: null, logs });
      },

      startBreak: () => {
        const state = get();

        // End any active work session first
        if (state.activeSession && state.activeSession.type === 'work') {
          state.stopWork();
        }

        const session: WorkSession = {
          id: generateId(),
          date: getTodayDate(),
          startTime: new Date().toISOString(),
          duration: 0,
          type: 'break',
        };

        set({ activeSession: session, lastBreakReminder: new Date().toISOString() });
      },

      endBreak: () => {
        const state = get();
        if (!state.activeSession || state.activeSession.type !== 'break') return;

        const endTime = new Date();
        const startTime = new Date(state.activeSession.startTime);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        const completedSession: WorkSession = {
          ...state.activeSession,
          endTime: endTime.toISOString(),
          duration,
        };

        // Update today's log
        const today = getTodayDate();
        const logs = [...state.logs];
        const todayLogIndex = logs.findIndex(l => l.date === today);

        if (todayLogIndex >= 0) {
          logs[todayLogIndex] = {
            ...logs[todayLogIndex],
            breakMinutes: logs[todayLogIndex].breakMinutes + duration,
            sessions: [...logs[todayLogIndex].sessions, completedSession],
          };
        } else {
          logs.push({
            date: today,
            workMinutes: 0,
            breakMinutes: duration,
            sessions: [completedSession],
          });
        }

        set({ activeSession: null, logs });
      },

      setGoals: (updates) => {
        set((state) => ({
          goals: { ...state.goals, ...updates },
        }));
      },

      setBreakReminders: (enabled) => {
        set({ breakRemindersEnabled: enabled });
      },

      dismissBreakReminder: () => {
        set({ lastBreakReminder: new Date().toISOString() });
      },

      getTodayLog: () => {
        const state = get();
        const today = getTodayDate();
        return getOrCreateLog(state.logs, today);
      },

      getWeekLogs: () => {
        const state = get();
        const today = new Date();
        const logs: DailyLog[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          logs.push(getOrCreateLog(state.logs, dateStr));
        }

        return logs;
      },

      getWorkLifeScore: () => {
        const state = get();
        const todayLog = state.getTodayLog();
        const { dailyWorkHours, dailyMaxHours } = state.goals;

        const targetMinutes = dailyWorkHours * 60;
        const maxMinutes = dailyMaxHours * 60;
        const workedMinutes = todayLog.workMinutes;

        // Score calculation:
        // 100 = exactly at target
        // > 100 = under target (good balance, more personal time)
        // < 100 = over target (poor balance, too much work)
        // Below 50 = critical (significantly over max hours)

        if (workedMinutes <= targetMinutes) {
          // Under or at target: score 100-120 based on progress
          const progress = workedMinutes / targetMinutes;
          return Math.round(100 + (1 - progress) * 20);
        } else if (workedMinutes <= maxMinutes) {
          // Between target and max: score 70-100
          const overProgress = (workedMinutes - targetMinutes) / (maxMinutes - targetMinutes);
          return Math.round(100 - overProgress * 30);
        } else {
          // Over max: score 30-70
          const criticalOverage = Math.min((workedMinutes - maxMinutes) / 60, 4); // Cap at 4 hours over
          return Math.round(70 - criticalOverage * 10);
        }
      },

      shouldShowBreakReminder: () => {
        const state = get();

        if (!state.breakRemindersEnabled) return false;
        if (!state.activeSession || state.activeSession.type !== 'work') return false;

        const sessionStart = new Date(state.activeSession.startTime);
        const lastReminder = state.lastBreakReminder
          ? new Date(state.lastBreakReminder)
          : sessionStart;

        const now = new Date();
        const minutesSinceReminder = (now.getTime() - lastReminder.getTime()) / 60000;

        return minutesSinceReminder >= state.goals.breakInterval;
      },
    }),
    {
      name: 'hour-one-balance',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);

// Helper functions
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 100) return { label: 'Excellent', color: '#22c55e' };
  if (score >= 85) return { label: 'Good', color: '#84cc16' };
  if (score >= 70) return { label: 'Fair', color: '#eab308' };
  if (score >= 50) return { label: 'Poor', color: '#f97316' };
  return { label: 'Critical', color: '#ef4444' };
}

export function getScoreDescription(score: number, workedMinutes: number, targetMinutes: number): string {
  const worked = formatDuration(workedMinutes);
  const target = formatDuration(targetMinutes);

  if (score >= 100) {
    return `You've worked ${worked} today. Great work-life balance!`;
  }
  if (score >= 85) {
    return `You've worked ${worked} (target: ${target}). Approaching your daily goal.`;
  }
  if (score >= 70) {
    return `You've exceeded your ${target} target. Consider wrapping up.`;
  }
  if (score >= 50) {
    return `You're over your daily maximum. Time to stop and rest.`;
  }
  return `Significantly over your work limit. Please take care of yourself.`;
}
