import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, TaskFolder } from '@/types';
import { SYSTEM_FOLDER_IDS } from '@/types';
import { chromeStorage } from '@/lib/chromeStorage';

// Default folders
const DEFAULT_FOLDERS: TaskFolder[] = [
  { id: 'today', name: 'Today', icon: 'Sun', isSystem: true, order: 0 },
  { id: 'inbox', name: 'Inbox', icon: 'Inbox', isSystem: true, order: 1 },
  { id: 'done', name: 'Done', icon: 'CheckCircle', isSystem: true, order: 2 },
];

interface TodosState {
  tasks: Task[];
  folders: TaskFolder[];
  activeFolderId: string;

  // Task actions
  addTask: (text: string, folderId?: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, text: string) => void;
  moveTask: (taskId: string, targetFolderId: string) => void;
  clearCompleted: () => void;

  // Folder actions
  addFolder: (name: string, color?: string) => void;
  updateFolder: (id: string, updates: Partial<TaskFolder>) => void;
  deleteFolder: (id: string) => void;
  setActiveFolder: (folderId: string) => void;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate persisted state structure to prevent runtime crashes
 */
function validatePersistedState(data: unknown): data is Partial<TodosState> {
  if (data === null || typeof data !== 'object') {
    return false;
  }

  const state = data as Record<string, unknown>;

  // Validate tasks array if present
  if (state.tasks !== undefined) {
    if (!Array.isArray(state.tasks)) return false;
    // Basic validation of task structure
    for (const task of state.tasks) {
      if (typeof task !== 'object' || task === null) return false;
      if (typeof (task as Record<string, unknown>).id !== 'string') return false;
      if (typeof (task as Record<string, unknown>).text !== 'string') return false;
    }
  }

  // Validate folders array if present
  if (state.folders !== undefined) {
    if (!Array.isArray(state.folders)) return false;
    for (const folder of state.folders) {
      if (typeof folder !== 'object' || folder === null) return false;
      if (typeof (folder as Record<string, unknown>).id !== 'string') return false;
      if (typeof (folder as Record<string, unknown>).name !== 'string') return false;
    }
  }

  // Validate activeFolderId if present
  if (state.activeFolderId !== undefined && typeof state.activeFolderId !== 'string') {
    return false;
  }

  return true;
}

/**
 * Sanitize task data to ensure all required fields exist
 */
function sanitizeTask(task: Record<string, unknown>): Task {
  return {
    id: typeof task.id === 'string' ? task.id : generateId(),
    text: typeof task.text === 'string' ? task.text : '',
    completed: typeof task.completed === 'boolean' ? task.completed : false,
    createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString(),
    folderId: typeof task.folderId === 'string' ? task.folderId : SYSTEM_FOLDER_IDS.INBOX,
    completedAt: typeof task.completedAt === 'string' ? task.completedAt : undefined,
  };
}

export const useTodosStore = create<TodosState>()(
  persist(
    (set, get) => ({
      tasks: [],
      folders: DEFAULT_FOLDERS,
      activeFolderId: 'today',

      addTask: (text, folderId) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const state = get();
        // Default to active folder, unless active is 'done' → use 'inbox'
        let targetFolderId = folderId || state.activeFolderId;
        if (targetFolderId === SYSTEM_FOLDER_IDS.DONE) {
          targetFolderId = SYSTEM_FOLDER_IDS.INBOX;
        }

        const newTask: Task = {
          id: generateId(),
          text: trimmed,
          completed: false,
          createdAt: new Date().toISOString(),
          folderId: targetFolderId,
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) return task;

            const nowCompleted = !task.completed;
            if (nowCompleted) {
              // Move to 'done' folder and set completedAt
              return {
                ...task,
                completed: true,
                completedAt: new Date().toISOString(),
                folderId: SYSTEM_FOLDER_IDS.DONE,
              };
            } else {
              // Move back to 'inbox' and clear completedAt
              return {
                ...task,
                completed: false,
                completedAt: undefined,
                folderId: SYSTEM_FOLDER_IDS.INBOX,
              };
            }
          }),
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

      moveTask: (taskId, targetFolderId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;

            // If moving to done, mark as completed
            if (targetFolderId === SYSTEM_FOLDER_IDS.DONE) {
              return {
                ...task,
                folderId: targetFolderId,
                completed: true,
                completedAt: task.completedAt || new Date().toISOString(),
              };
            }

            // If moving out of done, mark as incomplete
            if (task.folderId === SYSTEM_FOLDER_IDS.DONE && targetFolderId !== SYSTEM_FOLDER_IDS.DONE) {
              return {
                ...task,
                folderId: targetFolderId,
                completed: false,
                completedAt: undefined,
              };
            }

            return { ...task, folderId: targetFolderId };
          }),
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed),
        }));
      },

      addFolder: (name, color) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const state = get();
        const maxOrder = Math.max(...state.folders.map(f => f.order), 0);

        const newFolder: TaskFolder = {
          id: generateId(),
          name: trimmed,
          icon: 'Folder',
          isSystem: false,
          order: maxOrder + 1,
          color,
        };

        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...updates } : folder
          ),
        }));
      },

      deleteFolder: (id) => {
        const state = get();
        const folder = state.folders.find(f => f.id === id);

        // Cannot delete system folders
        if (!folder || folder.isSystem) return;

        set((state) => ({
          // Remove the folder
          folders: state.folders.filter((f) => f.id !== id),
          // Move orphaned tasks to inbox
          tasks: state.tasks.map((task) =>
            task.folderId === id
              ? { ...task, folderId: SYSTEM_FOLDER_IDS.INBOX }
              : task
          ),
          // If active folder was deleted, switch to inbox
          activeFolderId: state.activeFolderId === id ? SYSTEM_FOLDER_IDS.INBOX : state.activeFolderId,
        }));
      },

      setActiveFolder: (folderId) => {
        set({ activeFolderId: folderId });
      },
    }),
    {
      name: 'hour-one-todos',
      version: 2,
      storage: createJSONStorage(() => chromeStorage),
      migrate: (persistedState: unknown, version: number) => {
        // Validate persisted state before processing
        if (!validatePersistedState(persistedState)) {
          if (import.meta.env.DEV) {
            console.warn('[TodosStore] Invalid persisted state, using defaults');
          }
          return {
            tasks: [],
            folders: DEFAULT_FOLDERS,
            activeFolderId: 'today',
          };
        }

        const state = persistedState;

        if (version < 2) {
          // Migration from v1 to v2: add folders and folderId to tasks
          const rawTasks = (state.tasks || []) as Array<Record<string, unknown>>;
          const tasks = rawTasks.map(t => {
            const sanitized = sanitizeTask(t);
            // Set folder based on completion status if not already set
            if (!t.folderId) {
              sanitized.folderId = sanitized.completed ? SYSTEM_FOLDER_IDS.DONE : SYSTEM_FOLDER_IDS.INBOX;
            }
            return sanitized;
          });

          return {
            ...state,
            folders: DEFAULT_FOLDERS,
            activeFolderId: 'today',
            tasks,
          };
        }

        return state as TodosState;
      },
    }
  )
);
