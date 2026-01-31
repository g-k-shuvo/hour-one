import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Edit3, X, MoreHorizontal } from 'lucide-react';
import { useFocusStore } from '@/stores/focusStore';
import { useFocusSessionStore } from '@/stores/focusSessionStore';
import { useTodosStore } from '@/stores/todosStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { useClickOutside } from '@/hooks/useClickOutside';
import { SYSTEM_FOLDER_IDS } from '@/types';

export function Focus() {
  const { focus, isCompleted, setFocus, toggleComplete, clearFocus } = useFocusStore();
  const { phase } = useFocusSessionStore();
  const { tasks, toggleTask } = useTodosStore();
  const { topTaskInCenter } = useSettingsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(focus);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const handleCloseMenu = useCallback(() => setShowMenu(false), []);
  useClickOutside(menuContainerRef, handleCloseMenu, showMenu);

  // Get the first incomplete task from Today folder
  const topTodayTask = tasks.find(
    (t) => t.folderId === SYSTEM_FOLDER_IDS.TODAY && !t.completed
  );

  // Sync input value when focus changes (e.g., on day change)
  useEffect(() => {
    setInputValue(focus);
  }, [focus]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      setFocus(trimmed);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setInputValue(focus);
      setIsEditing(false);
    }
  };

  const handleComplete = () => {
    toggleComplete();
  };

  const handleEdit = () => {
    setInputValue(focus);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleClear = () => {
    clearFocus();
    setInputValue('');
    setIsEditing(false);
    setShowMenu(false);
  };

  // Hide this component during focus mode
  if (phase !== 'idle') {
    return null;
  }

  // No focus set - show top Today task if enabled, otherwise show input prompt
  if (!focus && !isEditing) {
    // Show top Today task if enabled and available
    if (topTaskInCenter && topTodayTask) {
      return (
        <div className="relative w-full group">
          <div className="flex items-center justify-center gap-2">
            {/* Checkbox */}
            <button
              onClick={() => toggleTask(topTodayTask.id)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-white/40 text-transparent transition-all hover:border-white/60"
              aria-label="Complete task"
            >
              <Check size={12} strokeWidth={3} />
            </button>

            {/* Task text */}
            <h2
              className="text-center text-xl font-light text-white max-w-sm truncate"
              title={topTodayTask.text}
            >
              {topTodayTask.text}
            </h2>
          </div>

          {/* Label */}
          <p className="mt-2 text-center text-xs text-white/40">
            Today's top task
          </p>
        </div>
      );
    }

    // Default: show input prompt
    return (
      <div className="relative w-full">
        <button
          onClick={() => setIsEditing(true)}
          className="group w-full text-center"
        >
          <p className="text-base text-white/50 transition-colors group-hover:text-white/70">
            What is your main focus for today?
          </p>
          <div className="mx-auto mt-2 h-0.5 w-40 bg-white/20 transition-colors group-hover:bg-white/40" />
        </button>
      </div>
    );
  }

  // Editing mode - show input
  if (isEditing) {
    return (
      <div className="relative w-full">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            placeholder="Enter your focus..."
            className="w-full border-b-2 border-white/30 bg-transparent px-2 py-1.5 text-center text-xl font-light text-white placeholder-white/30 outline-none transition-colors focus:border-white/60"
            maxLength={100}
          />
        </div>
        <p className="mt-1.5 text-center text-[10px] text-white/40">
          Press Enter to save, Escape to cancel
        </p>
      </div>
    );
  }

  // Focus set - show focus with checkbox, menu, and focus button
  return (
    <div className="relative w-full group">
      {/* Centered content */}
      <div className="flex items-center justify-center gap-2">
        {/* Checkbox on left */}
        <button
          onClick={handleComplete}
          className={`
            flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all
            ${isCompleted
              ? 'border-green-400 bg-green-400/20 text-green-400'
              : 'border-white/40 text-transparent hover:border-white/60'
            }
          `}
          aria-label={isCompleted ? 'Focus completed' : 'Mark focus as complete'}
        >
          <Check size={12} strokeWidth={3} />
        </button>

        {/* Focus text */}
        <h2
          className={`text-center text-xl font-light text-white transition-all max-w-sm truncate ${
            isCompleted ? 'text-white/50 line-through decoration-white/50' : ''
          }`}
          title={focus}
        >
          {focus}
        </h2>
      </div>

      {/* Three dots menu - absolute positioned on right */}
      <div ref={menuContainerRef} className="absolute -right-8 top-1/2 -translate-y-1/2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`rounded-full p-1 transition-all hover:bg-white/10 hover:text-white/60 ${
            showMenu ? 'opacity-100 text-white/60' : 'opacity-0 group-hover:opacity-100 text-white/40'
          }`}
          aria-label="Focus options"
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <Dropdown position="right" width="w-32">
            <DropdownItem onClick={handleEdit}>
              <Edit3 size={14} />
              <span>Edit</span>
            </DropdownItem>
            <DropdownItem onClick={handleClear}>
              <X size={14} />
              <span>Clear</span>
            </DropdownItem>
          </Dropdown>
        )}
      </div>

      {/* Completed message */}
      {isCompleted && (
        <button
          onClick={handleClear}
          className="mt-3 block w-full text-center text-xs text-white/40 transition-colors hover:text-white/60"
        >
          Set a new focus
        </button>
      )}

    </div>
  );
}
