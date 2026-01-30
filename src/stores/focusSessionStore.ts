import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type FocusModePhase =
  | 'idle'           // Normal mode
  | 'entering'       // Zoom in animation (2s)
  | 'transition'     // Motivational quote screen (2-2.5s)
  | 'active'         // Focus mode active
  | 'exiting'        // Fade out focus UI
  | 'celebration'    // Stats/celebration screen (2.5-3s)
  | 'leaving';       // Zoom out animation

export type TimerMode = 'pomodoro' | 'countup';
export type PomodoroPhase = 'focus' | 'break';

interface TimerSettings {
  focusDuration: number;  // in minutes
  breakDuration: number;  // in minutes
  soundEnabled: boolean;
  autoStartTimers: boolean;
  hideSeconds: boolean;
  notificationsEnabled: boolean;
}

interface FocusSessionState {
  // Phase management
  phase: FocusModePhase;

  // Timer settings
  timerMode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  pomodorosCompleted: number;

  // Timer state
  isTimerRunning: boolean;
  timerSeconds: number; // Current timer value in seconds
  initialTimerSeconds: number; // For progress calculation

  // Session tracking
  sessionStartTime: number | null;
  totalSessionSeconds: number;

  // Focus task (from focusStore)
  currentFocusTask: string;

  // Settings
  settings: TimerSettings;

  // Actions
  enterFocusMode: (focusTask: string) => void;
  setPhase: (phase: FocusModePhase) => void;
  exitFocusMode: () => void;

  // Timer actions
  setTimerMode: (mode: TimerMode) => void;
  setPomodoroPhase: (phase: PomodoroPhase) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  completePomodoroSession: () => void;
  addMinutes: (minutes: number) => void;
  completeCurrentTimer: () => void;

  // Settings actions
  updateSettings: (settings: Partial<TimerSettings>) => void;

  // Session tracking
  updateSessionTime: () => void;

  // Reset
  resetSession: () => void;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  breakDuration: 5,
  soundEnabled: true,
  autoStartTimers: false,
  hideSeconds: false,
  notificationsEnabled: true,
};

// Motivational quotes for transition screen
export const FOCUS_QUOTES = [
  { text: "Time to focus. You've got this.", icon: "🎯" },
  { text: "Deep work begins now.", icon: "🧠" },
  { text: "Clear your mind. Embrace the flow.", icon: "🌊" },
  { text: "Your best work awaits.", icon: "✨" },
  { text: "Enter the zone. Stay present.", icon: "🧘" },
  { text: "One task. Full attention.", icon: "🎯" },
  { text: "Distractions fade. Focus sharpens.", icon: "🔍" },
  { text: "This moment is yours.", icon: "⏳" },
  { text: "Breathe. Begin. Achieve.", icon: "🌟" },
  { text: "The world can wait.", icon: "🌙" },
];

export const getRandomFocusQuote = () => {
  return FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)];
};

// Celebration messages based on session length
export const getCelebrationMessage = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);

  if (minutes >= 60) {
    return {
      title: "Incredible focus session!",
      emoji: "🎉",
      subtitle: "You're on fire! Keep up this amazing momentum.",
      showConfetti: true,
    };
  } else if (minutes >= 25) {
    return {
      title: "Great work!",
      emoji: "✨",
      subtitle: "Solid focus session. You're making real progress.",
      showConfetti: false,
    };
  } else {
    return {
      title: "Every minute counts",
      emoji: "🌱",
      subtitle: "Small steps lead to big achievements.",
      showConfetti: false,
    };
  }
};

// Chrome storage adapter
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(name);
      return result[name] ?? null;
    }
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [name]: value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(name);
    } else {
      localStorage.removeItem(name);
    }
  },
};

export const useFocusSessionStore = create<FocusSessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      phase: 'idle',
      timerMode: 'pomodoro',
      pomodoroPhase: 'focus',
      pomodorosCompleted: 0,
      isTimerRunning: false,
      timerSeconds: DEFAULT_SETTINGS.focusDuration * 60,
      initialTimerSeconds: DEFAULT_SETTINGS.focusDuration * 60,
      sessionStartTime: null,
      totalSessionSeconds: 0,
      currentFocusTask: '',
      settings: DEFAULT_SETTINGS,

      enterFocusMode: (focusTask: string) => {
        const { settings } = get();
        const initialSeconds = settings.focusDuration * 60;
        set({
          phase: 'entering',
          currentFocusTask: focusTask,
          sessionStartTime: Date.now(),
          totalSessionSeconds: 0,
          pomodorosCompleted: 0,
          timerSeconds: initialSeconds,
          initialTimerSeconds: initialSeconds,
          pomodoroPhase: 'focus',
          isTimerRunning: false,
        });
      },

      setPhase: (phase: FocusModePhase) => {
        set({ phase });
      },

      exitFocusMode: () => {
        const { isTimerRunning } = get();
        if (isTimerRunning) {
          get().pauseTimer();
        }
        get().updateSessionTime();
        set({ phase: 'exiting' });
      },

      setTimerMode: (mode: TimerMode) => {
        const { isTimerRunning, settings } = get();
        if (isTimerRunning) return; // Don't allow mode change while timer is running

        const initialSeconds = mode === 'pomodoro' ? settings.focusDuration * 60 : 0;
        set({
          timerMode: mode,
          timerSeconds: initialSeconds,
          initialTimerSeconds: initialSeconds,
          pomodoroPhase: 'focus',
        });
      },

      setPomodoroPhase: (phase: PomodoroPhase) => {
        const { isTimerRunning, settings } = get();
        if (isTimerRunning) return; // Don't allow phase change while timer is running

        const newSeconds = phase === 'focus'
          ? settings.focusDuration * 60
          : settings.breakDuration * 60;

        set({
          pomodoroPhase: phase,
          timerSeconds: newSeconds,
          initialTimerSeconds: newSeconds,
        });
      },

      startTimer: () => {
        set({ isTimerRunning: true });
      },

      pauseTimer: () => {
        set({ isTimerRunning: false });
      },

      resetTimer: () => {
        const { timerMode, pomodoroPhase, settings } = get();
        let newSeconds = 0;
        let initialSeconds = 0;

        if (timerMode === 'pomodoro') {
          newSeconds = pomodoroPhase === 'focus'
            ? settings.focusDuration * 60
            : settings.breakDuration * 60;
          initialSeconds = newSeconds;
        }

        set({
          timerSeconds: newSeconds,
          initialTimerSeconds: initialSeconds,
          isTimerRunning: false,
        });
      },

      tick: () => {
        const { timerMode, timerSeconds, isTimerRunning, settings } = get();

        if (!isTimerRunning) return;

        if (timerMode === 'countup') {
          set({ timerSeconds: timerSeconds + 1 });
        } else {
          // Pomodoro mode - count down
          if (timerSeconds > 0) {
            set({ timerSeconds: timerSeconds - 1 });
          } else {
            // Timer completed
            if (settings.soundEnabled) {
              // Play sound (we'll add audio later)
              try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2LdWZuc4GAgnZoZGyChpGOgXBkb36KlJKFc2dueYeQj4VyZ299iZKQhHFncH6JkY+Dcmhwf4qRjoNzaXGAi5GPg3NpcYCLkY6Dc2lxgIuRjoNzaXGAi5GOg3NpcYCKkY6Dc2lxgIqRjoNzaXGAipGOg3NpcYCKkY6Dc2lwgIqRjoNzaXCAipGOg3NpcICKkY6Dc2lwgIqRjoNzaXCAipGOg3NpcICKkY6DcmhwgIqQjYNyaHB/io+MgnJncH6Jj4uBcWZvfYiNioFwZW58h4yJgG9kbXuGi4d+bmNseYSJhn1sYmt4goaEe2phaniAhIJ5aGBod36Bfndl');
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch {}
            }
            if (settings.notificationsEnabled && 'Notification' in window) {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('Timer Complete!', {
                    body: get().pomodoroPhase === 'focus' ? 'Time for a break!' : 'Ready to focus again?',
                    icon: '/icons/icon-128.svg'
                  });
                }
              });
            }
            get().completePomodoroSession();
          }
        }

        // Update total session time
        get().updateSessionTime();
      },

      completePomodoroSession: () => {
        const { pomodoroPhase, pomodorosCompleted, settings } = get();

        if (pomodoroPhase === 'focus') {
          // Completed a focus session
          const breakSeconds = settings.breakDuration * 60;
          set({
            pomodorosCompleted: pomodorosCompleted + 1,
            pomodoroPhase: 'break',
            timerSeconds: breakSeconds,
            initialTimerSeconds: breakSeconds,
            isTimerRunning: settings.autoStartTimers,
          });
        } else {
          // Completed a break
          const focusSeconds = settings.focusDuration * 60;
          set({
            pomodoroPhase: 'focus',
            timerSeconds: focusSeconds,
            initialTimerSeconds: focusSeconds,
            isTimerRunning: settings.autoStartTimers,
          });
        }
      },

      addMinutes: (minutes: number) => {
        const { timerSeconds, initialTimerSeconds } = get();
        const newSeconds = timerSeconds + (minutes * 60);
        const newInitial = initialTimerSeconds + (minutes * 60);
        set({
          timerSeconds: Math.max(0, newSeconds),
          initialTimerSeconds: Math.max(0, newInitial),
        });
      },

      completeCurrentTimer: () => {
        set({ timerSeconds: 0 });
        get().completePomodoroSession();
      },

      updateSettings: (newSettings: Partial<TimerSettings>) => {
        const { settings, timerMode, pomodoroPhase, isTimerRunning } = get();
        const updatedSettings = { ...settings, ...newSettings };

        // If duration changed and timer is not running, update timer
        if (!isTimerRunning && timerMode === 'pomodoro') {
          if (newSettings.focusDuration !== undefined && pomodoroPhase === 'focus') {
            const newSeconds = newSettings.focusDuration * 60;
            set({
              settings: updatedSettings,
              timerSeconds: newSeconds,
              initialTimerSeconds: newSeconds,
            });
            return;
          }
          if (newSettings.breakDuration !== undefined && pomodoroPhase === 'break') {
            const newSeconds = newSettings.breakDuration * 60;
            set({
              settings: updatedSettings,
              timerSeconds: newSeconds,
              initialTimerSeconds: newSeconds,
            });
            return;
          }
        }

        set({ settings: updatedSettings });
      },

      updateSessionTime: () => {
        const { sessionStartTime } = get();
        if (sessionStartTime) {
          const totalSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
          set({ totalSessionSeconds: totalSeconds });
        }
      },

      resetSession: () => {
        const { settings } = get();
        set({
          phase: 'idle',
          timerMode: 'pomodoro',
          pomodoroPhase: 'focus',
          pomodorosCompleted: 0,
          isTimerRunning: false,
          timerSeconds: settings.focusDuration * 60,
          initialTimerSeconds: settings.focusDuration * 60,
          sessionStartTime: null,
          totalSessionSeconds: 0,
          currentFocusTask: '',
        });
      },
    }),
    {
      name: 'hour-one-focus-session',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        settings: state.settings,
        timerMode: state.timerMode,
      }),
    }
  )
);
