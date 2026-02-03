import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  SkipForward,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { useAutofocusStore, type AutofocusSource } from '@/stores/autofocusStore';
import { useTodosStore } from '@/stores/todosStore';
import { SYSTEM_FOLDER_IDS } from '@/types';
import type { Task } from '@/types';

// Priority colors
const PRIORITY_COLORS = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
};

// Start Modal Component
interface StartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (source: AutofocusSource) => void;
}

function StartModal({ isOpen, onClose, onStart }: StartModalProps) {
  const { tasks } = useTodosStore();

  const todayTasks = tasks.filter(t => !t.completed && t.folderId === SYSTEM_FOLDER_IDS.TODAY);
  const inboxTasks = tasks.filter(t => !t.completed && t.folderId === SYSTEM_FOLDER_IDS.INBOX);
  const allIncompleteTasks = tasks.filter(t => !t.completed && t.folderId !== SYSTEM_FOLDER_IDS.DONE);

  if (!isOpen) return null;

  const sources: { id: AutofocusSource; label: string; count: number; description: string }[] = [
    { id: 'today', label: 'Today', count: todayTasks.length, description: 'Focus on tasks planned for today' },
    { id: 'inbox', label: 'Inbox', count: inboxTasks.length, description: 'Process your inbox tasks' },
    { id: 'all', label: 'All Tasks', count: allIncompleteTasks.length, description: 'Work through all incomplete tasks' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Zap className="text-accent" size={20} />
            <h2 className="text-lg font-semibold text-white">Start Autofocus</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-white/70 text-sm mb-4">
            Work through your tasks one at a time. Choose where to start:
          </p>

          <div className="space-y-2">
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => onStart(source.id)}
                disabled={source.count === 0}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  source.count > 0
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent/50'
                    : 'bg-white/5 opacity-50 cursor-not-allowed border border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{source.label}</span>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${
                    source.count > 0 ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/40'
                  }`}>
                    {source.count} task{source.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-white/50">{source.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  position: { current: number; total: number };
  onComplete: () => void;
  onSkip: () => void;
  onNotToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

function TaskCard({
  task,
  position,
  onComplete,
  onSkip,
  onNotToday,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: TaskCardProps) {
  const { tags: allTags } = useTodosStore();
  const taskTags = (task.tags || [])
    .map(tagId => allTags.find(t => t.id === tagId))
    .filter(Boolean);

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-white/50 text-sm">
          Task {position.current} of {position.total}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={`p-1.5 rounded-full transition-colors ${
              canGoPrevious
                ? 'hover:bg-white/10 text-white/60 hover:text-white'
                : 'text-white/20 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`p-1.5 rounded-full transition-colors ${
              canGoNext
                ? 'hover:bg-white/10 text-white/60 hover:text-white'
                : 'text-white/20 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Task card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        {/* Priority indicator */}
        {task.priority && (
          <div className={`flex items-center gap-1.5 mb-3 ${PRIORITY_COLORS[task.priority]}`}>
            <Target size={14} />
            <span className="text-xs font-medium uppercase">{task.priority} priority</span>
          </div>
        )}

        {/* Task text */}
        <h2 className="text-2xl font-semibold text-white mb-4 leading-relaxed">
          {task.text}
        </h2>

        {/* Description if present */}
        {task.description && (
          <p className="text-white/60 text-sm mb-4">{task.description}</p>
        )}

        {/* Tags */}
        {taskTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {taskTags.map((tag) => tag && (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Due date */}
        {task.dueDate && (
          <div className="flex items-center gap-1.5 text-white/50 text-sm mb-4">
            <Calendar size={14} />
            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Subtasks progress */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-white/50 mb-2">
              <span>Subtasks</span>
              <span>
                {task.subtasks.filter(st => st.completed).length} / {task.subtasks.length}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{
                  width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors"
          >
            <Check size={18} />
            <span>Complete</span>
          </button>

          <button
            onClick={onSkip}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
            title="Skip for now (comes back later)"
          >
            <SkipForward size={18} />
            <span>Skip</span>
          </button>

          <button
            onClick={onNotToday}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white font-medium rounded-xl transition-colors"
            title="Remove from today's focus"
          >
            <Calendar size={18} />
            <span>Not Today</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Completion Screen
interface CompletionScreenProps {
  stats: { completed: number; skipped: number; total: number };
  onExit: () => void;
  onContinue: () => void;
  hasMoreTasks: boolean;
}

function CompletionScreen({ stats, onExit, onContinue, hasMoreTasks }: CompletionScreenProps) {
  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 mb-4">
          <Trophy className="text-accent" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Great work!</h2>
        <p className="text-white/60">
          {stats.completed > 0
            ? `You completed ${stats.completed} task${stats.completed !== 1 ? 's' : ''} this session.`
            : "You've processed all your tasks."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-accent">{stats.completed}</p>
          <p className="text-sm text-white/50">Completed</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{stats.skipped}</p>
          <p className="text-sm text-white/50">Skipped</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {hasMoreTasks && (
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors"
          >
            <ArrowRight size={18} />
            <span>Continue with more tasks</span>
          </button>
        )}
        <button
          onClick={onExit}
          className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
        >
          Exit Autofocus
        </button>
      </div>
    </div>
  );
}

// Main Autofocus Overlay Component
export function AutofocusOverlay() {
  const {
    isActive,
    source,
    taskQueue,
    currentIndex,
    exitAutofocus,
    completeCurrentTask,
    skipCurrentTask,
    markNotToday,
    goToNextTask,
    goToPreviousTask,
    getSessionStats,
    refreshQueue,
  } = useAutofocusStore();

  const { tasks, toggleTask, moveTask } = useTodosStore();

  // Get current task
  const currentTaskId = taskQueue[currentIndex];
  const currentTask = tasks.find(t => t.id === currentTaskId);

  // Get stats
  const stats = getSessionStats();

  // Handle complete
  const handleComplete = () => {
    if (currentTaskId) {
      toggleTask(currentTaskId); // Mark as completed in todos store
      completeCurrentTask(); // Update autofocus state
    }
  };

  // Handle skip
  const handleSkip = () => {
    skipCurrentTask();
  };

  // Handle not today
  const handleNotToday = () => {
    const taskId = markNotToday();
    if (taskId) {
      // Move task back to inbox
      moveTask(taskId, SYSTEM_FOLDER_IDS.INBOX);
    }
  };

  // Check for more tasks in other sources
  const hasMoreTasks = tasks.some(t => !t.completed && t.folderId !== SYSTEM_FOLDER_IDS.DONE);

  if (!isActive) return null;

  const showCompletion = taskQueue.length === 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      {/* Exit button */}
      <button
        onClick={exitAutofocus}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Header */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Zap className="text-accent" size={20} />
        <span className="text-white font-medium">Autofocus Mode</span>
        <span className="text-white/40 text-sm capitalize">• {source}</span>
      </div>

      {/* Main content */}
      <div className="w-full px-4">
        {showCompletion ? (
          <CompletionScreen
            stats={stats}
            onExit={exitAutofocus}
            onContinue={() => {
              // Refresh with all incomplete tasks
              const allIncomplete = tasks
                .filter(t => !t.completed && t.folderId !== SYSTEM_FOLDER_IDS.DONE)
                .map(t => t.id);
              refreshQueue(allIncomplete);
            }}
            hasMoreTasks={hasMoreTasks}
          />
        ) : currentTask ? (
          <TaskCard
            task={currentTask}
            position={{ current: currentIndex + 1, total: taskQueue.length }}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onNotToday={handleNotToday}
            onPrevious={goToPreviousTask}
            onNext={goToNextTask}
            canGoPrevious={currentIndex > 0}
            canGoNext={currentIndex < taskQueue.length - 1}
          />
        ) : null}
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/30 text-xs">
        <span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter</kbd> Complete
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">S</kbd> Skip
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">N</kbd> Not Today
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> Exit
        </span>
      </div>
    </div>,
    document.body
  );
}

// Button to trigger autofocus mode
export function AutofocusButton() {
  const [showStartModal, setShowStartModal] = useState(false);
  const { startAutofocus } = useAutofocusStore();
  const { tasks } = useTodosStore();

  const handleStart = (source: AutofocusSource) => {
    let taskIds: string[] = [];

    switch (source) {
      case 'today':
        taskIds = tasks
          .filter(t => !t.completed && t.folderId === SYSTEM_FOLDER_IDS.TODAY)
          .map(t => t.id);
        break;
      case 'inbox':
        taskIds = tasks
          .filter(t => !t.completed && t.folderId === SYSTEM_FOLDER_IDS.INBOX)
          .map(t => t.id);
        break;
      case 'all':
        taskIds = tasks
          .filter(t => !t.completed && t.folderId !== SYSTEM_FOLDER_IDS.DONE)
          .map(t => t.id);
        break;
    }

    if (taskIds.length > 0) {
      startAutofocus(source, taskIds);
      setShowStartModal(false);
    }
  };

  // Count incomplete tasks
  const incompleteCount = tasks.filter(
    t => !t.completed && t.folderId !== SYSTEM_FOLDER_IDS.DONE
  ).length;

  return (
    <>
      <button
        onClick={() => setShowStartModal(true)}
        disabled={incompleteCount === 0}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          incompleteCount > 0
            ? 'bg-accent/20 text-accent hover:bg-accent/30'
            : 'bg-white/5 text-white/30 cursor-not-allowed'
        }`}
      >
        <Zap size={14} />
        <span>Autofocus</span>
        {incompleteCount > 0 && (
          <span className="px-1.5 py-0.5 bg-accent/30 rounded-full text-xs">
            {incompleteCount}
          </span>
        )}
      </button>

      <StartModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        onStart={handleStart}
      />
    </>
  );
}

// Hook for keyboard shortcuts
export function useAutofocusKeyboard() {
  const {
    isActive,
    exitAutofocus,
    taskQueue,
    currentIndex,
  } = useAutofocusStore();

  const { toggleTask } = useTodosStore();

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentTaskId = taskQueue[currentIndex];

      switch (e.key) {
        case 'Escape':
          exitAutofocus();
          break;
        case 'Enter':
          if (currentTaskId) {
            toggleTask(currentTaskId);
            useAutofocusStore.getState().completeCurrentTask();
          }
          break;
        case 's':
        case 'S':
          useAutofocusStore.getState().skipCurrentTask();
          break;
        case 'n':
        case 'N':
          useAutofocusStore.getState().markNotToday();
          break;
        case 'ArrowLeft':
          useAutofocusStore.getState().goToPreviousTask();
          break;
        case 'ArrowRight':
          useAutofocusStore.getState().goToNextTask();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, taskQueue, currentIndex, exitAutofocus, toggleTask]);
}
