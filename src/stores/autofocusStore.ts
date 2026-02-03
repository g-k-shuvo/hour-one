import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';

export type AutofocusSource = 'today' | 'inbox' | 'all';

interface AutofocusState {
  // Mode state
  isActive: boolean;
  source: AutofocusSource;

  // Queue management
  taskQueue: string[]; // Task IDs in order
  currentIndex: number;
  skippedTaskIds: string[]; // Tasks skipped in this session
  completedInSession: number; // Count of tasks completed in this session

  // Session tracking
  sessionStartTime: string | null;

  // Actions
  startAutofocus: (source: AutofocusSource, taskIds: string[]) => void;
  exitAutofocus: () => void;

  // Task navigation
  completeCurrentTask: () => void;
  skipCurrentTask: () => void;
  markNotToday: () => string | null; // Returns task ID that was marked
  goToNextTask: () => void;
  goToPreviousTask: () => void;

  // Queue management
  refreshQueue: (taskIds: string[]) => void;
  getCurrentTaskId: () => string | null;

  // Stats
  getSessionStats: () => { completed: number; skipped: number; remaining: number; total: number };
}

export const useAutofocusStore = create<AutofocusState>()(
  persist(
    (set, get) => ({
      isActive: false,
      source: 'today',
      taskQueue: [],
      currentIndex: 0,
      skippedTaskIds: [],
      completedInSession: 0,
      sessionStartTime: null,

      startAutofocus: (source, taskIds) => {
        set({
          isActive: true,
          source,
          taskQueue: taskIds,
          currentIndex: 0,
          skippedTaskIds: [],
          completedInSession: 0,
          sessionStartTime: new Date().toISOString(),
        });
      },

      exitAutofocus: () => {
        set({
          isActive: false,
          taskQueue: [],
          currentIndex: 0,
          skippedTaskIds: [],
          sessionStartTime: null,
        });
      },

      completeCurrentTask: () => {
        const state = get();
        const newCompleted = state.completedInSession + 1;

        // Move to next task, removing current from queue
        const newQueue = state.taskQueue.filter((_, i) => i !== state.currentIndex);
        const newIndex = Math.min(state.currentIndex, newQueue.length - 1);

        set({
          taskQueue: newQueue,
          currentIndex: Math.max(0, newIndex),
          completedInSession: newCompleted,
        });
      },

      skipCurrentTask: () => {
        const state = get();
        const currentTaskId = state.taskQueue[state.currentIndex];

        if (!currentTaskId) return;

        // Move task to end of queue
        const newQueue = [...state.taskQueue];
        newQueue.splice(state.currentIndex, 1);
        newQueue.push(currentTaskId);

        // Add to skipped list if not already there
        const newSkipped = state.skippedTaskIds.includes(currentTaskId)
          ? state.skippedTaskIds
          : [...state.skippedTaskIds, currentTaskId];

        set({
          taskQueue: newQueue,
          skippedTaskIds: newSkipped,
          // Keep same index (which now points to next task)
        });
      },

      markNotToday: () => {
        const state = get();
        const currentTaskId = state.taskQueue[state.currentIndex];

        if (!currentTaskId) return null;

        // Remove task from queue
        const newQueue = state.taskQueue.filter((_, i) => i !== state.currentIndex);
        const newIndex = Math.min(state.currentIndex, newQueue.length - 1);

        set({
          taskQueue: newQueue,
          currentIndex: Math.max(0, newIndex),
        });

        return currentTaskId;
      },

      goToNextTask: () => {
        const state = get();
        if (state.currentIndex < state.taskQueue.length - 1) {
          set({ currentIndex: state.currentIndex + 1 });
        }
      },

      goToPreviousTask: () => {
        const state = get();
        if (state.currentIndex > 0) {
          set({ currentIndex: state.currentIndex - 1 });
        }
      },

      refreshQueue: (taskIds) => {
        const state = get();
        // Keep existing order for tasks that are still in the new list
        // Add new tasks at the end
        const existingIds = new Set(state.taskQueue);
        const newIds = taskIds.filter(id => !existingIds.has(id));
        const remainingIds = state.taskQueue.filter(id => taskIds.includes(id));

        const newQueue = [...remainingIds, ...newIds];
        const newIndex = Math.min(state.currentIndex, Math.max(0, newQueue.length - 1));

        set({
          taskQueue: newQueue,
          currentIndex: newIndex,
        });
      },

      getCurrentTaskId: () => {
        const state = get();
        return state.taskQueue[state.currentIndex] || null;
      },

      getSessionStats: () => {
        const state = get();
        return {
          completed: state.completedInSession,
          skipped: state.skippedTaskIds.length,
          remaining: state.taskQueue.length,
          total: state.taskQueue.length + state.completedInSession,
        };
      },
    }),
    {
      name: 'hour-one-autofocus',
      storage: createJSONStorage(() => chromeStorage),
      // Don't persist session-specific data
      partialize: (state) => ({
        source: state.source,
      }),
    }
  )
);
