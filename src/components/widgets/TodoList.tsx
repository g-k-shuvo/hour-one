import { useState, useRef } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { useTodosStore } from '@/stores/todosStore';
import type { Task } from '@/types';

export function TodoList() {
  const { tasks, addTask, toggleTask, deleteTask, clearCompleted } = useTodosStore();
  const [newTaskText, setNewTaskText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      addTask(newTaskText);
      setNewTaskText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setNewTaskText('');
      inputRef.current?.blur();
    }
  };

  return (
    <div className="glass-dark w-72 rounded-xl p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-white/80">
          <span>Today's Tasks</span>
          {totalCount > 0 && (
            <span className="text-white/50">
              ({completedCount}/{totalCount})
            </span>
          )}
        </h3>

        {completedCount > 0 && (
          <button
            onClick={clearCompleted}
            className="text-xs text-white/40 transition-colors hover:text-white/70"
            title="Clear completed tasks"
          >
            Clear done
          </button>
        )}
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/30"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className="rounded-lg bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50 disabled:hover:bg-white/10"
            aria-label="Add task"
          >
            <Plus size={18} />
          </button>
        </div>
      </form>

      {/* Task List */}
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/40">
            No tasks yet. Add one above!
          </p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onDelete={() => deleteTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${
          task.completed
            ? 'border-green-500/50 bg-green-500/20 text-green-400'
            : 'border-white/30 hover:border-white/50'
        }`}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Task text */}
      <span
        className={`flex-1 text-sm transition-all ${
          task.completed
            ? 'text-white/40 line-through decoration-white/40'
            : 'text-white/90'
        }`}
      >
        {task.text}
      </span>

      {/* Delete button */}
      <button
        onClick={onDelete}
        className={`flex-shrink-0 rounded p-1 text-white/30 transition-all hover:bg-red-500/20 hover:text-red-400 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Delete task"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
