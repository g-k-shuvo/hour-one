import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  X,
  Check,
  Flame,
  Trophy,
  Settings,
  Trash2,
  Edit3,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import {
  useHabitStore,
  calculateStreak,
  calculateLongestStreak,
  getWeekCompletions,
  isCompletedToday,
  shouldTrackDay,
  HABIT_COLORS,
  HABIT_ICONS,
  type Habit,
} from '@/stores/habitStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { getTodayDate } from '@/lib/dateUtils';

// Single habit card
function HabitCard({
  habit,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
}: {
  habit: Habit;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const streak = calculateStreak(habit);
  const completedToday = isCompletedToday(habit);
  const weekCompletions = getWeekCompletions(habit);
  const today = new Date(getTodayDate());
  const shouldTrackToday = shouldTrackDay(habit, today);

  return (
    <div
      className="group rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        {/* Completion button */}
        <button
          onClick={onToggle}
          disabled={!shouldTrackToday}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg transition-all ${
            completedToday
              ? 'bg-opacity-100 shadow-lg'
              : shouldTrackToday
              ? 'bg-opacity-20 hover:bg-opacity-40'
              : 'bg-opacity-10 cursor-not-allowed opacity-50'
          }`}
          style={{
            backgroundColor: completedToday ? habit.color : `${habit.color}33`,
          }}
          title={shouldTrackToday ? (completedToday ? 'Mark incomplete' : 'Mark complete') : 'Not scheduled today'}
        >
          {completedToday ? (
            <Check size={20} className="text-white" />
          ) : (
            <span>{habit.icon}</span>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-white truncate">{habit.name}</h3>

            {/* Actions */}
            <div
              className={`flex items-center gap-1 transition-opacity ${
                showActions ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                onClick={onEdit}
                className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white/70"
                title="Edit"
              >
                <Edit3 size={12} />
              </button>
              <button
                onClick={onArchive}
                className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white/70"
                title={habit.archived ? 'Restore' : 'Archive'}
              >
                {habit.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
              </button>
              <button
                onClick={onDelete}
                className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Week view */}
          <div className="flex items-center gap-1 mt-2">
            {weekCompletions.map((day) => (
              <div
                key={day.date}
                className={`flex flex-col items-center ${day.isToday ? 'opacity-100' : 'opacity-70'}`}
                title={`${day.dayName}: ${day.completed ? 'Completed' : day.shouldTrack ? 'Not completed' : 'Not scheduled'}`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                    day.completed
                      ? ''
                      : day.shouldTrack
                      ? 'bg-white/10'
                      : 'bg-white/5'
                  }`}
                  style={{
                    backgroundColor: day.completed ? habit.color : undefined,
                  }}
                >
                  {day.completed && <Check size={10} className="text-white" />}
                </div>
                <span className={`text-[9px] mt-0.5 ${day.isToday ? 'text-white/70 font-medium' : 'text-white/40'}`}>
                  {day.dayName.charAt(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Flame size={12} className="text-orange-400" />
              <span className="text-xs text-orange-400 font-medium">{streak} day streak</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add/Edit habit modal
function HabitModal({
  onClose,
  onSave,
  initialData,
}: {
  onClose: () => void;
  onSave: (name: string, icon: string, color: string, frequency: Habit['frequency'], customDays?: number[]) => void;
  initialData?: Habit;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [icon, setIcon] = useState(initialData?.icon || HABIT_ICONS[0]);
  const [color, setColor] = useState(initialData?.color || HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<Habit['frequency']>(initialData?.frequency || 'daily');
  const [customDays, setCustomDays] = useState<number[]>(initialData?.customDays || [1, 2, 3, 4, 5]);
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, onClose, true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), icon, color, frequency, frequency === 'custom' ? customDays : undefined);
    onClose();
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleCustomDay = (day: number) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day].sort());
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-80 max-h-[90vh] rounded-xl border border-white/10 bg-gray-900/95 shadow-2xl overflow-hidden"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-medium text-white">
              {initialData ? 'Edit Habit' : 'New Habit'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white/70"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
            {/* Name */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Habit Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Exercise, Read, Meditate..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
                autoFocus
                maxLength={30}
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Icon</label>
              <div className="grid grid-cols-8 gap-1">
                {HABIT_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                      icon === ic
                        ? 'bg-white/20 ring-2 ring-white/40'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Color</label>
              <div className="flex gap-2">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {(['daily', 'weekdays', 'weekends', 'custom'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      frequency === freq
                        ? 'bg-accent text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>

              {/* Custom days selector */}
              {frequency === 'custom' && (
                <div className="mt-3 flex justify-center gap-1">
                  {dayNames.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleCustomDay(index)}
                      className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                        customDays.includes(index)
                          ? 'bg-accent text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialData ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Stats summary component
function HabitStats({ habits }: { habits: Habit[] }) {
  const activeHabits = habits.filter(h => !h.archived);

  const totalStreak = activeHabits.reduce((sum, h) => sum + calculateStreak(h), 0);
  const bestStreak = Math.max(0, ...activeHabits.map(h => calculateLongestStreak(h)));
  const completedToday = activeHabits.filter(h => {
    const today = new Date(getTodayDate());
    return shouldTrackDay(h, today) && isCompletedToday(h);
  }).length;

  const todayTotal = activeHabits.filter(h => {
    const today = new Date(getTodayDate());
    return shouldTrackDay(h, today);
  }).length;

  if (activeHabits.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="rounded-lg bg-white/5 p-2 text-center">
        <div className="text-lg font-semibold text-white">{completedToday}/{todayTotal}</div>
        <div className="text-[10px] text-white/50">Today</div>
      </div>
      <div className="rounded-lg bg-white/5 p-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <Flame size={14} className="text-orange-400" />
          <span className="text-lg font-semibold text-white">{totalStreak}</span>
        </div>
        <div className="text-[10px] text-white/50">Total Streak</div>
      </div>
      <div className="rounded-lg bg-white/5 p-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <Trophy size={14} className="text-yellow-400" />
          <span className="text-lg font-semibold text-white">{bestStreak}</span>
        </div>
        <div className="text-[10px] text-white/50">Best Streak</div>
      </div>
    </div>
  );
}

// Main habit tracker panel
export function HabitTrackerPanel() {
  const { habits, addHabit, updateHabit, deleteHabit, archiveHabit, toggleCompletion } = useHabitStore();
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const handleSave = (name: string, icon: string, color: string, frequency: Habit['frequency'], customDays?: number[]) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, { name, icon, color, frequency, customDays });
    } else {
      addHabit(name, icon, color, frequency, customDays);
    }
    setEditingHabit(null);
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowModal(true);
  };

  const activeHabits = habits.filter(h => !h.archived).sort((a, b) => a.order - b.order);
  const archivedHabits = habits.filter(h => h.archived);

  return (
    <div className="space-y-3">
      {/* Stats */}
      <HabitStats habits={habits} />

      {/* Active habits */}
      {activeHabits.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/40">
          No habits yet. Create one to start tracking!
        </p>
      ) : (
        <div className="space-y-2">
          {activeHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={() => toggleCompletion(habit.id)}
              onEdit={() => handleEdit(habit)}
              onDelete={() => deleteHabit(habit.id)}
              onArchive={() => archiveHabit(habit.id)}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => {
          setEditingHabit(null);
          setShowModal(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-2 text-sm text-white/50 transition-colors hover:border-white/30 hover:text-white/70"
      >
        <Plus size={16} />
        <span>Add Habit</span>
      </button>

      {/* Archived section */}
      {archivedHabits.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60"
          >
            <Archive size={12} />
            <span>{archivedHabits.length} archived habit{archivedHabits.length !== 1 ? 's' : ''}</span>
          </button>

          {showArchived && (
            <div className="mt-2 space-y-2 opacity-60">
              {archivedHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={() => toggleCompletion(habit.id)}
                  onEdit={() => handleEdit(habit)}
                  onDelete={() => deleteHabit(habit.id)}
                  onArchive={() => archiveHabit(habit.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <HabitModal
          onClose={() => {
            setShowModal(false);
            setEditingHabit(null);
          }}
          onSave={handleSave}
          initialData={editingHabit || undefined}
        />
      )}
    </div>
  );
}

// Compact button for dashboard
export function HabitTrackerButton() {
  const { habits } = useHabitStore();
  const [showPopup, setShowPopup] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setShowPopup(false);
  }, []);

  useClickOutside(popupRef, handleClose, showPopup);

  const activeHabits = habits.filter(h => !h.archived);
  if (activeHabits.length === 0) return null;

  const today = new Date(getTodayDate());
  const todayHabits = activeHabits.filter(h => shouldTrackDay(h, today));
  const completedToday = todayHabits.filter(h => isCompletedToday(h)).length;
  const totalStreak = activeHabits.reduce((sum, h) => sum + calculateStreak(h), 0);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowPopup(!showPopup)}
        className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title="Habit Tracker"
      >
        <Flame size={14} className={totalStreak > 0 ? 'text-orange-400' : ''} />
        <span className="text-xs tabular-nums">
          {completedToday}/{todayHabits.length}
        </span>
      </button>

      {showPopup && (
        <div
          ref={popupRef}
          className="absolute top-full mt-2 right-0 z-50 min-w-[200px] rounded-lg border border-white/10 bg-gray-900/95 p-3 shadow-xl backdrop-blur-sm"
        >
          <div className="space-y-2">
            {todayHabits.slice(0, 5).map((habit) => {
              const completed = isCompletedToday(habit);
              return (
                <div key={habit.id} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-sm ${
                      completed ? '' : 'bg-white/10'
                    }`}
                    style={{ backgroundColor: completed ? habit.color : undefined }}
                  >
                    {completed ? <Check size={12} className="text-white" /> : habit.icon}
                  </div>
                  <span className={`text-sm flex-1 truncate ${completed ? 'text-white/50 line-through' : 'text-white/80'}`}>
                    {habit.name}
                  </span>
                </div>
              );
            })}
            {todayHabits.length === 0 && (
              <p className="text-sm text-white/40 text-center py-2">No habits today</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Header actions for PopupPanel
export function HabitTrackerHeaderActions({ onClose }: { onClose?: () => void }) {
  const handleOpenSettings = () => {
    onClose?.();
    window.dispatchEvent(
      new CustomEvent('openSettings', { detail: { section: 'habits' } })
    );
  };

  return (
    <button
      onClick={handleOpenSettings}
      className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
      aria-label="Settings"
      title="Settings"
    >
      <Settings size={16} />
    </button>
  );
}
