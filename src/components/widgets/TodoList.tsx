import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Check,
  Sun,
  Inbox,
  CheckCircle,
  Folder,
  MoreVertical,
  Edit3,
  ArrowRight,
  X,
  Settings,
  Search,
  Calendar,
  Flag,
  Tag,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { useTodosStore } from '@/stores/todosStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { SYSTEM_FOLDER_IDS } from '@/types';
import type { Task, TaskFolder, TaskPriority, Subtask } from '@/types';

// Map folder icon names to Lucide components
const FOLDER_ICONS: Record<string, LucideIcon> = {
  Sun,
  Inbox,
  CheckCircle,
  Folder,
};

// Priority colors and labels
const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bgColor: string; label: string }> = {
  low: { color: 'text-blue-400', bgColor: 'bg-blue-400/20', label: 'Low' },
  medium: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', label: 'Medium' },
  high: { color: 'text-orange-400', bgColor: 'bg-orange-400/20', label: 'High' },
  urgent: { color: 'text-red-400', bgColor: 'bg-red-400/20', label: 'Urgent' },
};

// Format due date for display
function formatDueDate(dateStr: string): { text: string; isOverdue: boolean; isToday: boolean } {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
  if (diffDays === 0) return { text: 'Today', isOverdue: false, isToday: true };
  if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false, isToday: false };
  if (diffDays < 7) return { text: `${diffDays}d`, isOverdue: false, isToday: false };
  return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false, isToday: false };
}

type ViewState =
  | { type: 'list' }
  | { type: 'add-task' }
  | { type: 'edit-task'; taskId: string }
  | { type: 'add-folder' }
  | { type: 'edit-folder'; folderId: string };

export function TodoList() {
  const {
    tasks,
    folders,
    tags,
    activeFolderId,
    searchQuery,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
    moveTask,
    addFolder,
    updateFolder,
    deleteFolder,
    setActiveFolder,
    clearCompleted,
    setTaskPriority,
    setTaskDueDate,
    addTaskTag,
    removeTaskTag,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    setSearchQuery,
  } = useTodosStore();

  const { topTaskInCenter, setTopTaskInCenter } = useSettingsStore();

  const [viewState, setViewState] = useState<ViewState>({ type: 'list' });
  const [inputValue, setInputValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sort folders by order
  const sortedFolders = [...folders].sort((a, b) => a.order - b.order);

  // Filter tasks by active folder and search query
  let activeTasks = tasks.filter((t) => t.folderId === activeFolderId);

  // Apply search filter if query exists
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    activeTasks = tasks.filter((t) =>
      t.text.toLowerCase().includes(query) ||
      t.tags?.some(tagId => tags.find(tag => tag.id === tagId)?.name.toLowerCase().includes(query))
    );
  }

  const completedInDone = activeFolderId === SYSTEM_FOLDER_IDS.DONE
    ? activeTasks.length
    : tasks.filter((t) => t.completed).length;

  // Get count for each folder
  const getTaskCount = (folderId: string) => {
    return tasks.filter((t) => t.folderId === folderId).length;
  };

  const handleAddTask = () => {
    if (inputValue.trim()) {
      addTask(inputValue.trim());
      setInputValue('');
    }
    setViewState({ type: 'list' });
  };

  const handleEditTask = (taskId: string, newText: string) => {
    if (newText.trim()) {
      editTask(taskId, newText.trim());
    }
    setViewState({ type: 'list' });
  };

  const handleAddFolder = () => {
    if (inputValue.trim()) {
      addFolder(inputValue.trim());
      setInputValue('');
    }
    setViewState({ type: 'list' });
  };

  const handleEditFolder = (folderId: string, newName: string) => {
    if (newName.trim()) {
      updateFolder(folderId, { name: newName.trim() });
    }
    setViewState({ type: 'list' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (viewState.type === 'add-task') handleAddTask();
      else if (viewState.type === 'add-folder') handleAddFolder();
      else if (viewState.type === 'edit-task') handleEditTask(viewState.taskId, inputValue);
      else if (viewState.type === 'edit-folder') handleEditFolder(viewState.folderId, inputValue);
    } else if (e.key === 'Escape') {
      setInputValue('');
      setViewState({ type: 'list' });
    }
  };

  const startEditTask = (task: Task) => {
    setInputValue(task.text);
    setViewState({ type: 'edit-task', taskId: task.id });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const startEditFolder = (folder: TaskFolder) => {
    setInputValue(folder.name);
    setViewState({ type: 'edit-folder', folderId: folder.id });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const startAddTask = () => {
    setInputValue('');
    setViewState({ type: 'add-task' });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const startAddFolder = () => {
    setInputValue('');
    setViewState({ type: 'add-folder' });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Render input form for various states
  const renderInputForm = () => {
    if (viewState.type === 'list') return null;

    const placeholders: Record<string, string> = {
      'add-task': 'Add a task...',
      'edit-task': 'Edit task...',
      'add-folder': 'New folder name...',
      'edit-folder': 'Edit folder name...',
    };

    return (
      <div className="mb-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[viewState.type]}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/30"
            maxLength={100}
            autoFocus
          />
          <button
            onClick={() => {
              if (viewState.type === 'add-task') handleAddTask();
              else if (viewState.type === 'add-folder') handleAddFolder();
              else if (viewState.type === 'edit-task') handleEditTask(viewState.taskId, inputValue);
              else if (viewState.type === 'edit-folder') handleEditFolder(viewState.folderId, inputValue);
            }}
            disabled={!inputValue.trim()}
            className="rounded-lg bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50 disabled:hover:bg-white/10"
            aria-label="Confirm"
          >
            <Check size={18} />
          </button>
          <button
            onClick={() => {
              setInputValue('');
              setViewState({ type: 'list' });
            }}
            className="rounded-lg bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Folder Tabs */}
      <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
        {sortedFolders.map((folder) => {
          const IconComponent = FOLDER_ICONS[folder.icon] || Folder;
          const count = getTaskCount(folder.id);
          const isActive = folder.id === activeFolderId;

          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              onDoubleClick={() => !folder.isSystem && startEditFolder(folder)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white/80'
              }`}
              style={folder.color ? { color: isActive ? 'white' : folder.color } : undefined}
              title={folder.isSystem ? folder.name : `${folder.name} (double-click to edit)`}
            >
              <IconComponent size={14} />
              <span>{folder.name}</span>
              {count > 0 && (
                <span className="ml-0.5 text-[10px] opacity-60">{count}</span>
              )}
            </button>
          );
        })}

        {/* Add folder button */}
        <button
          onClick={startAddFolder}
          className="flex items-center justify-center rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
          aria-label="Add folder"
        >
          <Plus size={14} />
        </button>

        {/* Search toggle button */}
        <button
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) setSearchQuery('');
          }}
          className={`ml-auto flex items-center justify-center rounded-lg p-1.5 transition-colors ${
            showSearch || searchQuery
              ? 'bg-white/20 text-white'
              : 'text-white/40 hover:bg-white/10 hover:text-white/70'
          }`}
          aria-label="Search tasks"
        >
          <Search size={14} />
        </button>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-3 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-8 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/30"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Input Form (conditionally shown) */}
      {renderInputForm()}

      {/* Add Task Button (when in list view) */}
      {viewState.type === 'list' && activeFolderId !== SYSTEM_FOLDER_IDS.DONE && (
        <button
          onClick={startAddTask}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-sm text-white/50 transition-colors hover:border-white/30 hover:text-white/70"
        >
          <Plus size={16} />
          <span>Add a task...</span>
        </button>
      )}

      {/* Task List */}
      <div className="max-h-60 space-y-1 overflow-y-auto overflow-x-visible scrollbar-thin">
        {activeTasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/40">
            {activeFolderId === SYSTEM_FOLDER_IDS.DONE
              ? 'No completed tasks yet.'
              : 'No tasks here. Add one above!'}
          </p>
        ) : (
          activeTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              folders={sortedFolders}
              tags={tags}
              onToggle={() => toggleTask(task.id)}
              onDelete={() => deleteTask(task.id)}
              onEdit={() => startEditTask(task)}
              onMove={(targetFolderId) => moveTask(task.id, targetFolderId)}
              onSetPriority={(priority) => setTaskPriority(task.id, priority)}
              onSetDueDate={(date) => setTaskDueDate(task.id, date)}
              onAddTag={(tagId) => addTaskTag(task.id, tagId)}
              onRemoveTag={(tagId) => removeTaskTag(task.id, tagId)}
              onAddSubtask={(text) => addSubtask(task.id, text)}
              onToggleSubtask={(subtaskId) => toggleSubtask(task.id, subtaskId)}
              onDeleteSubtask={(subtaskId) => deleteSubtask(task.id, subtaskId)}
            />
          ))
        )}
      </div>

      {/* Footer - Clear completed / Delete folder / Top task toggle */}
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-3">
          {activeFolderId === SYSTEM_FOLDER_IDS.DONE && completedInDone > 0 && (
            <button
              onClick={clearCompleted}
              className="text-xs text-white/40 transition-colors hover:text-white/70"
            >
              Clear all completed
            </button>
          )}

          {!folders.find(f => f.id === activeFolderId)?.isSystem && (
            <button
              onClick={() => deleteFolder(activeFolderId)}
              className="text-xs text-red-400/60 transition-colors hover:text-red-400"
            >
              Delete folder
            </button>
          )}
        </div>

        {/* Top task in center toggle */}
        <button
          onClick={() => setTopTaskInCenter(!topTaskInCenter)}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
            topTaskInCenter
              ? 'bg-white/15 text-white/80'
              : 'text-white/40 hover:bg-white/10 hover:text-white/60'
          }`}
          title="Show first Today task in center"
        >
          <Sun size={12} />
          <span>Top in center</span>
        </button>
      </div>
    </div>
  );
}

// Header Actions component for PopupPanel
export function TodoListHeaderActions({ onClose }: { onClose?: () => void }) {
  const handleOpenSettings = () => {
    // Close the popup first
    onClose?.();
    // Then open settings
    window.dispatchEvent(
      new CustomEvent('openSettings', { detail: { section: 'tasks' } })
    );
  };

  return (
    <button
      onClick={handleOpenSettings}
      className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
      aria-label="Open settings"
      title="Settings"
    >
      <Settings size={16} />
    </button>
  );
}

interface TaskItemProps {
  task: Task;
  folders: TaskFolder[];
  tags: { id: string; name: string; color: string }[];
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMove: (targetFolderId: string) => void;
  onSetPriority: (priority: TaskPriority | undefined) => void;
  onSetDueDate: (date: string | undefined) => void;
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onAddSubtask: (text: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}

function TaskItem({
  task,
  folders,
  tags,
  onToggle,
  onDelete,
  onEdit,
  onMove,
  onSetPriority,
  onSetDueDate,
  onAddTag,
  onRemoveTag,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0, openLeft: false });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const priorityButtonRef = useRef<HTMLButtonElement>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
    setShowMoveMenu(false);
    setShowPriorityMenu(false);
    setShowTagMenu(false);
  }, []);

  useClickOutside(menuRef, handleCloseMenu, showMenu);

  const handleOpenMenu = () => {
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 160,
      });
    }
    setShowMenu(!showMenu);
  };

  // Format completion date for display
  const formatCompletedAt = (date: string) => {
    const completed = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return completed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get available folders to move to (exclude current folder)
  const moveableFolders = folders.filter(f => f.id !== task.folderId);

  // Get task's tags
  const taskTags = (task.tags || []).map(tagId => tags.find(t => t.id === tagId)).filter(Boolean);

  // Get available tags (not already on task)
  const availableTags = tags.filter(t => !(task.tags || []).includes(t.id));

  // Calculate submenu position
  const calcSubmenuPosition = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      const estimatedWidth = 130;
      const openLeft = spaceRight < estimatedWidth;

      setSubmenuPosition({
        top: rect.top,
        left: openLeft ? rect.left - estimatedWidth - 4 : rect.right + 4,
        openLeft,
      });
    }
  };

  // Handle adding subtask
  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      onAddSubtask(newSubtaskText.trim());
      setNewSubtaskText('');
    }
  };

  // Subtask count display
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

  return (
    <div className="rounded-lg transition-colors hover:bg-white/5">
      <div className="group flex items-start gap-2 px-2 py-1.5">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${
            task.completed
              ? 'border-green-500/50 bg-green-500/20 text-green-400'
              : 'border-white/30 hover:border-white/50'
          }`}
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Priority indicator */}
            {task.priority && (
              <span className={`flex-shrink-0 ${PRIORITY_CONFIG[task.priority].color}`}>
                <Flag size={12} />
              </span>
            )}

            {/* Task text */}
            <span
              className={`flex-1 text-sm transition-all truncate ${
                task.completed
                  ? 'text-white/40 line-through decoration-white/40'
                  : 'text-white/90'
              }`}
            >
              {task.text}
            </span>

            {/* Subtask toggle */}
            {subtaskCount > 0 && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex-shrink-0 flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60"
              >
                {showSubtasks ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span>{completedSubtasks}/{subtaskCount}</span>
              </button>
            )}
          </div>

          {/* Badges row: due date, tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {/* Due date badge */}
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${
                  formatDueDate(task.dueDate).isOverdue
                    ? 'bg-red-500/20 text-red-400'
                    : formatDueDate(task.dueDate).isToday
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                <Calendar size={10} />
                {formatDueDate(task.dueDate).text}
              </span>
            )}

            {/* Tags */}
            {taskTags.map(tag => tag && (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}

            {/* Completion date (in Done folder) */}
            {task.completedAt && task.folderId === SYSTEM_FOLDER_IDS.DONE && (
              <span className="text-[10px] text-white/30">
                {formatCompletedAt(task.completedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Menu button */}
        <button
          ref={menuButtonRef}
          onClick={handleOpenMenu}
          className={`flex-shrink-0 rounded p-1 text-white/30 transition-all hover:bg-white/10 hover:text-white/60 ${
            showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          aria-label="Task options"
        >
          <MoreVertical size={14} />
        </button>

        {/* Dropdown Menu - rendered via portal */}
        {showMenu && createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] min-w-[160px] rounded-lg border border-white/10 bg-gray-900/95 py-1 shadow-xl backdrop-blur-sm overflow-visible"
            style={{ top: menuPosition.top + 4, left: menuPosition.left }}
          >
            {/* Arrow pointing up */}
            <div
              className="absolute -top-1.5 right-3 w-3 h-3 rotate-45 bg-gray-900/95 border-l border-t border-white/10 rounded-tl-sm"
            />
            <button
              onClick={() => {
                onEdit();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>

            {/* Priority submenu */}
            <div className="relative">
              <button
                ref={priorityButtonRef}
                onClick={() => {
                  calcSubmenuPosition(priorityButtonRef);
                  setShowPriorityMenu(!showPriorityMenu);
                  setShowMoveMenu(false);
                  setShowTagMenu(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 ${showPriorityMenu ? 'bg-white/10' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <Flag size={14} />
                  <span>Priority</span>
                </div>
                <ArrowRight size={12} className="opacity-50" />
              </button>

              {showPriorityMenu && createPortal(
                <div
                  className="fixed z-[100] min-w-[120px] rounded-lg border border-white/10 bg-gray-900/95 py-1 shadow-xl backdrop-blur-sm overflow-visible"
                  style={{ top: submenuPosition.top, left: submenuPosition.left }}
                >
                  {submenuPosition.openLeft ? (
                    <div className="absolute top-3 -right-1.5 w-3 h-3 rotate-45 bg-gray-900/95 border-r border-t border-white/10 rounded-tr-sm" />
                  ) : (
                    <div className="absolute top-3 -left-1.5 w-3 h-3 rotate-45 bg-gray-900/95 border-l border-b border-white/10 rounded-bl-sm" />
                  )}
                  {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(priority => (
                    <button
                      key={priority}
                      onClick={() => {
                        onSetPriority(task.priority === priority ? undefined : priority);
                        setShowMenu(false);
                        setShowPriorityMenu(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/10 ${
                        task.priority === priority ? 'bg-white/10' : ''
                      } ${PRIORITY_CONFIG[priority].color}`}
                    >
                      <Flag size={14} />
                      <span>{PRIORITY_CONFIG[priority].label}</span>
                    </button>
                  ))}
                  {task.priority && (
                    <>
                      <div className="my-1 border-t border-white/10" />
                      <button
                        onClick={() => {
                          onSetPriority(undefined);
                          setShowMenu(false);
                          setShowPriorityMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10"
                      >
                        <X size={14} />
                        <span>Clear</span>
                      </button>
                    </>
                  )}
                </div>,
                document.body
              )}
            </div>

            {/* Due Date */}
            <button
              onClick={() => {
                setShowDatePicker(true);
                setShowMenu(false);
                setTimeout(() => dateInputRef.current?.showPicker(), 100);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              <Calendar size={14} />
              <span>{task.dueDate ? 'Change date' : 'Set due date'}</span>
            </button>

            {/* Tags submenu */}
            <div className="relative">
              <button
                ref={tagButtonRef}
                onClick={() => {
                  calcSubmenuPosition(tagButtonRef);
                  setShowTagMenu(!showTagMenu);
                  setShowMoveMenu(false);
                  setShowPriorityMenu(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 ${showTagMenu ? 'bg-white/10' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <Tag size={14} />
                  <span>Tags</span>
                </div>
                <ArrowRight size={12} className="opacity-50" />
              </button>

              {showTagMenu && createPortal(
                <div
                  className="fixed z-[100] min-w-[120px] rounded-lg border border-white/10 bg-gray-900/95 py-1 shadow-xl backdrop-blur-sm overflow-visible"
                  style={{ top: submenuPosition.top, left: submenuPosition.left }}
                >
                  {submenuPosition.openLeft ? (
                    <div className="absolute top-3 -right-1.5 w-3 h-3 rotate-45 bg-gray-900/95 border-r border-t border-white/10 rounded-tr-sm" />
                  ) : (
                    <div className="absolute top-3 -left-1.5 w-3 h-3 rotate-45 bg-gray-900/95 border-l border-b border-white/10 rounded-bl-sm" />
                  )}
                  {/* Current tags (click to remove) */}
                  {taskTags.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-[10px] text-white/40 uppercase">Current</div>
                      {taskTags.map(tag => tag && (
                        <button
                          key={tag.id}
                          onClick={() => onRemoveTag(tag.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/10"
                          style={{ color: tag.color }}
                        >
                          <Check size={14} />
                          <span>{tag.name}</span>
                        </button>
                      ))}
                      {availableTags.length > 0 && <div className="my-1 border-t border-white/10" />}
                    </>
                  )}
                  {/* Available tags (click to add) */}
                  {availableTags.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-[10px] text-white/40 uppercase">Add</div>
                      {availableTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => onAddTag(tag.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/10"
                          style={{ color: tag.color }}
                        >
                          <Tag size={14} />
                          <span>{tag.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {tags.length === 0 && (
                    <div className="px-3 py-2 text-sm text-white/40">No tags available</div>
                  )}
                </div>,
                document.body
              )}
            </div>

            {/* Add subtask */}
            <button
              onClick={() => {
                setShowSubtasks(true);
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              <Plus size={14} />
              <span>Add subtask</span>
            </button>

            <div className="my-1 border-t border-white/10" />

            {/* Move to submenu */}
            <div className="relative">
              <button
                ref={moveButtonRef}
                onClick={() => {
                  calcSubmenuPosition(moveButtonRef);
                  setShowMoveMenu(!showMoveMenu);
                  setShowPriorityMenu(false);
                  setShowTagMenu(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 ${showMoveMenu ? 'bg-white/10' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <ArrowRight size={14} />
                  <span>Move to</span>
                </div>
                <ArrowRight size={12} className="opacity-50" />
              </button>

              {/* Move submenu - rendered via portal */}
              {showMoveMenu && createPortal(
                <div
                  className="fixed z-[100] min-w-[120px] rounded-lg border border-white/10 bg-gray-900/95 py-1 shadow-xl backdrop-blur-sm overflow-visible"
                  style={{ top: submenuPosition.top, left: submenuPosition.left }}
                >
                  {/* Arrow pointing toward parent menu */}
                  {submenuPosition.openLeft ? (
                    <div
                      className="absolute top-3 -right-1.5 w-3 h-3 rotate-45 bg-gray-900/95 border-r border-t border-white/10 rounded-tr-sm"
                    />
                  ) : (
                    <div
                      className="absolute top-3 -left-1.5 w-3 h-3 rotate-45 bg-gray-900/95 border-l border-b border-white/10 rounded-bl-sm"
                    />
                  )}
                  {moveableFolders.map((folder) => {
                    const IconComponent = FOLDER_ICONS[folder.icon] || Folder;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => {
                          onMove(folder.id);
                          setShowMenu(false);
                          setShowMoveMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
                        style={folder.color ? { color: folder.color } : undefined}
                      >
                        <IconComponent size={14} />
                        <span>{folder.name}</span>
                      </button>
                    );
                  })}
                </div>,
                document.body
              )}
            </div>

            <div className="my-1 border-t border-white/10" />

            {/* Clear due date (if set) */}
            {task.dueDate && (
              <button
                onClick={() => {
                  onSetDueDate(undefined);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10"
              >
                <Calendar size={14} />
                <span>Clear due date</span>
              </button>
            )}

            <button
              onClick={() => {
                onDelete();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>,
          document.body
        )}
      </div>

      {/* Hidden date input for native date picker */}
      <input
        ref={dateInputRef}
        type="date"
        className="sr-only"
        value={task.dueDate || ''}
        onChange={(e) => {
          onSetDueDate(e.target.value || undefined);
          setShowDatePicker(false);
        }}
        onBlur={() => setShowDatePicker(false)}
      />

      {/* Subtasks section */}
      {showSubtasks && (
        <div className="ml-7 mb-2 space-y-1 border-l border-white/10 pl-3">
          {/* Existing subtasks */}
          {task.subtasks?.map(subtask => (
            <div key={subtask.id} className="group/sub flex items-center gap-2 py-0.5">
              <button
                onClick={() => onToggleSubtask(subtask.id)}
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all ${
                  subtask.completed
                    ? 'border-green-500/50 bg-green-500/20 text-green-400'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                {subtask.completed && <Check size={10} strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-xs ${subtask.completed ? 'text-white/40 line-through' : 'text-white/70'}`}>
                {subtask.text}
              </span>
              <button
                onClick={() => onDeleteSubtask(subtask.id)}
                className="opacity-0 group-hover/sub:opacity-100 p-0.5 text-white/30 hover:text-red-400 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Add subtask input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubtask();
                if (e.key === 'Escape') {
                  setNewSubtaskText('');
                  setShowSubtasks(false);
                }
              }}
              placeholder="Add subtask..."
              className="flex-1 bg-transparent text-xs text-white/70 placeholder-white/30 outline-none"
            />
            {newSubtaskText && (
              <button
                onClick={handleAddSubtask}
                className="text-white/40 hover:text-white/70"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
