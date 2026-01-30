import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task } from '@/types';

interface TodosState {
  tasks: Task[];

  // Actions
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, text: string) => void;
  clearCompleted: () => void;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

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

export const useTodosStore = create<TodosState>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const newTask: Task = {
          id: generateId(),
          text: trimmed,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: !task.completed,
                  completedAt: !task.completed ? new Date().toISOString() : undefined,
                }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      editTask: (id, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, text: trimmed } : task
          ),
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed),
        }));
      },
    }),
    {
      name: 'hour-one-todos',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
