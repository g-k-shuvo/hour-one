import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';

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

  // Internal flag to prevent double completion
  _completionInProgress: boolean;

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

// Timer completion sound (base64 encoded short beep)
const TIMER_SOUND_DATA = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2LdWZuc4GAgnZoZGyChpGOgXBkb36KlJKFc2dueYeQj4VyZ299iZKQhHFncH6JkY+Dcmhwf4qRjoNzaXGAi5GPg3NpcYCLkY6Dc2lxgIuRjoNzaXGAi5GOg3NpcYCKkY6Dc2lxgIqRjoNzaXGAipGOg3NpcYCKkY6Dc2lwgIqRjoNzaXCAipGOg3NpcICKkY6Dc2lwgIqRjoNzaXCAipGOg3NpcICKkY6DcmhwgIqQjYNyaHB/io+MgnJncH6Jj4uBcWZvfYiNioFwZW58h4yJgG9kbXuGi4d+bmNseYSJhn1sYmt4goaEe2phaniAhIJ5aGBod36Bfndl';

/**
 * Play the timer completion sound with proper error handling
 */
function playTimerSound(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(TIMER_SOUND_DATA);
      audio.volume = 0.5;
      audio.play()
        .then(() => resolve())
        .catch((error) => {
          // Log autoplay failures (common when tab is not focused)
          if (import.meta.env.DEV) {
            console.warn('[Timer Sound] Playback failed (possibly due to autoplay policy):', error.message);
          }
          resolve();
        });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Timer Sound] Audio creation failed:', error);
      }
      resolve();
    }
  });
}

/**
 * Request notification permission and show notification
 * Only requests permission if not already determined
 */
async function showTimerNotification(message: string) {
  if (!('Notification' in window)) return;

  try {
    // Check current permission state first
    let permission = Notification.permission;

    // Only request if not yet determined
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      new Notification('Timer Complete!', {
        body: message,
        icon: '/icons/icon-128.svg',
        tag: 'timer-complete', // Prevents duplicate notifications
      });
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Notification] Failed to show notification:', error);
    }
  }
}

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
      _completionInProgress: false,

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
          _completionInProgress: false,
        });
      },

      setPhase: (phase: FocusModePhase) => {
        set({ phase });
      },

      exitFocusMode: () => {
        // Use state callback to avoid stale state
        set((state) => {
          if (state.isTimerRunning) {
            // Will pause timer as part of this update
          }
          // Update session time before showing celebration
          const totalSeconds = state.sessionStartTime
            ? Math.floor((Date.now() - state.sessionStartTime) / 1000)
            : state.totalSessionSeconds;

          return {
            phase: 'exiting',
            isTimerRunning: false,
            totalSessionSeconds: totalSeconds,
          };
        });
      },

      setTimerMode: (mode: TimerMode) => {
        set((state) => {
          if (state.isTimerRunning) return state; // Don't allow mode change while timer is running

          const initialSeconds = mode === 'pomodoro' ? state.settings.focusDuration * 60 : 0;
          return {
            timerMode: mode,
            timerSeconds: initialSeconds,
            initialTimerSeconds: initialSeconds,
            pomodoroPhase: 'focus',
          };
        });
      },

      setPomodoroPhase: (phase: PomodoroPhase) => {
        set((state) => {
          if (state.isTimerRunning) return state; // Don't allow phase change while timer is running

          const newSeconds = phase === 'focus'
            ? state.settings.focusDuration * 60
            : state.settings.breakDuration * 60;

          return {
            pomodoroPhase: phase,
            timerSeconds: newSeconds,
            initialTimerSeconds: newSeconds,
          };
        });
      },

      startTimer: () => {
        set({ isTimerRunning: true });
      },

      pauseTimer: () => {
        set({ isTimerRunning: false });
      },

      resetTimer: () => {
        set((state) => {
          let newSeconds = 0;
          let initialSeconds = 0;

          if (state.timerMode === 'pomodoro') {
            newSeconds = state.pomodoroPhase === 'focus'
              ? state.settings.focusDuration * 60
              : state.settings.breakDuration * 60;
            initialSeconds = newSeconds;
          }

          return {
            timerSeconds: newSeconds,
            initialTimerSeconds: initialSeconds,
            isTimerRunning: false,
          };
        });
      },

      tick: () => {
        // Use state callback pattern to avoid race conditions
        set((state) => {
          if (!state.isTimerRunning) return state;

          // Update total session time
          const totalSeconds = state.sessionStartTime
            ? Math.floor((Date.now() - state.sessionStartTime) / 1000)
            : state.totalSessionSeconds;

          if (state.timerMode === 'countup') {
            return {
              timerSeconds: state.timerSeconds + 1,
              totalSessionSeconds: totalSeconds,
            };
          }

          // Pomodoro mode - count down
          if (state.timerSeconds > 1) {
            return {
              timerSeconds: state.timerSeconds - 1,
              totalSessionSeconds: totalSeconds,
            };
          }

          // Timer reaching 0 - handle completion
          // Guard against double completion
          if (state._completionInProgress || state.timerSeconds <= 0) {
            return state;
          }

          // Set timer to 0 and mark completion in progress
          // Actual completion will be handled after state update
          return {
            timerSeconds: 0,
            totalSessionSeconds: totalSeconds,
            _completionInProgress: true,
          };
        });

        // Check if we need to complete the session (outside of set to avoid state callback issues)
        const currentState = get();
        if (currentState.timerSeconds === 0 && currentState._completionInProgress) {
          // Play sound and show notification
          if (currentState.settings.soundEnabled) {
            playTimerSound();
          }
          if (currentState.settings.notificationsEnabled) {
            const message = currentState.pomodoroPhase === 'focus'
              ? 'Time for a break!'
              : 'Ready to focus again?';
            showTimerNotification(message);
          }
          // Complete the session
          get().completePomodoroSession();
        }
      },

      completePomodoroSession: () => {
        set((state) => {
          // Reset completion flag
          const baseUpdate = { _completionInProgress: false };

          if (state.pomodoroPhase === 'focus') {
            // Completed a focus session
            const breakSeconds = state.settings.breakDuration * 60;
            return {
              ...baseUpdate,
              pomodorosCompleted: state.pomodorosCompleted + 1,
              pomodoroPhase: 'break' as PomodoroPhase,
              timerSeconds: breakSeconds,
              initialTimerSeconds: breakSeconds,
              isTimerRunning: state.settings.autoStartTimers,
            };
          } else {
            // Completed a break
            const focusSeconds = state.settings.focusDuration * 60;
            return {
              ...baseUpdate,
              pomodoroPhase: 'focus' as PomodoroPhase,
              timerSeconds: focusSeconds,
              initialTimerSeconds: focusSeconds,
              isTimerRunning: state.settings.autoStartTimers,
            };
          }
        });
      },

      addMinutes: (minutes: number) => {
        set((state) => {
          const newSeconds = state.timerSeconds + (minutes * 60);
          const newInitial = state.initialTimerSeconds + (minutes * 60);
          return {
            timerSeconds: Math.max(0, newSeconds),
            initialTimerSeconds: Math.max(0, newInitial),
          };
        });
      },

      completeCurrentTimer: () => {
        set({ timerSeconds: 0, _completionInProgress: true });
        get().completePomodoroSession();
      },

      updateSettings: (newSettings: Partial<TimerSettings>) => {
        set((state) => {
          const updatedSettings = { ...state.settings, ...newSettings };

          // If duration changed and timer is not running, update timer
          if (!state.isTimerRunning && state.timerMode === 'pomodoro') {
            if (newSettings.focusDuration !== undefined && state.pomodoroPhase === 'focus') {
              const newSeconds = newSettings.focusDuration * 60;
              return {
                settings: updatedSettings,
                timerSeconds: newSeconds,
                initialTimerSeconds: newSeconds,
              };
            }
            if (newSettings.breakDuration !== undefined && state.pomodoroPhase === 'break') {
              const newSeconds = newSettings.breakDuration * 60;
              return {
                settings: updatedSettings,
                timerSeconds: newSeconds,
                initialTimerSeconds: newSeconds,
              };
            }
          }

          return { settings: updatedSettings };
        });
      },

      updateSessionTime: () => {
        set((state) => {
          if (state.sessionStartTime) {
            const totalSeconds = Math.floor((Date.now() - state.sessionStartTime) / 1000);
            return { totalSessionSeconds: totalSeconds };
          }
          return state;
        });
      },

      resetSession: () => {
        set((state) => ({
          phase: 'idle',
          timerMode: 'pomodoro',
          pomodoroPhase: 'focus',
          pomodorosCompleted: 0,
          isTimerRunning: false,
          timerSeconds: state.settings.focusDuration * 60,
          initialTimerSeconds: state.settings.focusDuration * 60,
          sessionStartTime: null,
          totalSessionSeconds: 0,
          currentFocusTask: '',
          _completionInProgress: false,
        }));
      },
    }),
    {
      name: 'hour-one-focus-session',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        settings: state.settings,
        timerMode: state.timerMode,
        // Persist session data for recovery after browser close
        sessionStartTime: state.sessionStartTime,
        totalSessionSeconds: state.totalSessionSeconds,
        pomodorosCompleted: state.pomodorosCompleted,
      }),
    }
  )
);
