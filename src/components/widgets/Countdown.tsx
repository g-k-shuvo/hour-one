import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Timer,
  Plus,
  X,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  Check,
  Settings,
} from 'lucide-react';
import {
  useCountdownStore,
  getTimeRemaining,
  formatTimeRemaining,
  formatCompact,
  getRelativeDate,
  COUNTDOWN_COLORS,
  type CountdownTimer,
  type TimeRemaining,
} from '@/stores/countdownStore';
import { useClickOutside } from '@/hooks/useClickOutside';

// Single countdown display card
function CountdownCard({
  timer,
  onEdit,
  onDelete,
  onTogglePin,
  compact = false,
}: {
  timer: CountdownTimer;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  compact?: boolean;
}) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    getTimeRemaining(timer.targetDate)
  );
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(timer.targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.targetDate]);

  const relativeDate = getRelativeDate(timer.targetDate);

  if (compact) {
    return (
      <div
        className="group flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
        style={{ borderLeft: `3px solid ${timer.color}` }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white truncate">{timer.title}</div>
          <div className="text-xs text-white/50">{relativeDate}</div>
        </div>
        <div className="text-right">
          <div
            className="text-sm font-medium tabular-nums"
            style={{ color: timer.color }}
          >
            {timeRemaining.isPast ? 'Done' : formatCompact(timeRemaining)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: timer.color }}
      />

      {/* Actions */}
      <div
        className={`absolute right-2 top-2 flex items-center gap-1 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={onTogglePin}
          className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white/70"
          title={timer.pinned ? 'Unpin' : 'Pin to dashboard'}
        >
          {timer.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button
          onClick={onEdit}
          className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white/70"
          title="Edit"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={onDelete}
          className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-red-400"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="pl-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-white font-medium truncate flex-1">{timer.title}</h3>
          {timer.pinned && (
            <Pin size={12} className="text-white/40 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <div
            className="text-2xl font-light tabular-nums"
            style={{ color: timer.color }}
          >
            {timeRemaining.isPast ? (
              <span className="text-white/50">Completed</span>
            ) : (
              formatTimeRemaining(timeRemaining)
            )}
          </div>
        </div>

        <div className="mt-2 text-xs text-white/40">
          {relativeDate}
          {timeRemaining.isPast && ' • '}
          {timeRemaining.isPast && (
            <span className="text-green-400">Event passed</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Add/Edit countdown modal
function CountdownModal({
  onClose,
  onSave,
  initialData,
}: {
  onClose: () => void;
  onSave: (title: string, targetDate: string, color: string) => void;
  initialData?: CountdownTimer;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState(() => {
    if (initialData?.targetDate) {
      return new Date(initialData.targetDate).toISOString().split('T')[0];
    }
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [time, setTime] = useState(() => {
    if (initialData?.targetDate) {
      const d = new Date(initialData.targetDate);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '12:00';
  });
  const [color, setColor] = useState(initialData?.color || COUNTDOWN_COLORS[0]);
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, onClose, true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const targetDate = new Date(`${date}T${time || '00:00'}`).toISOString();
    onSave(title.trim(), targetDate, color);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-80 rounded-xl border border-white/10 bg-gray-900/95 shadow-2xl overflow-hidden"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-medium text-white">
              {initialData ? 'Edit Countdown' : 'New Countdown'}
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
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Event Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Birthday, Vacation, Deadline..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
                autoFocus
                maxLength={50}
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Color</label>
              <div className="flex gap-2">
                {COUNTDOWN_COLORS.map((c) => (
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
              disabled={!title.trim() || !date}
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

// Main countdown panel (for popup panel display)
export function CountdownPanel() {
  const { timers, addTimer, updateTimer, deleteTimer, togglePinned } = useCountdownStore();
  const [showModal, setShowModal] = useState(false);
  const [editingTimer, setEditingTimer] = useState<CountdownTimer | null>(null);

  const handleSave = (title: string, targetDate: string, color: string) => {
    if (editingTimer) {
      updateTimer(editingTimer.id, { title, targetDate, color });
    } else {
      addTimer(title, targetDate, color);
    }
    setEditingTimer(null);
  };

  const handleEdit = (timer: CountdownTimer) => {
    setEditingTimer(timer);
    setShowModal(true);
  };

  const sortedTimers = [...timers].sort((a, b) => {
    // Pinned first, then by target date
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  return (
    <div className="space-y-3">
      {sortedTimers.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/40">
          No countdown timers yet.
        </p>
      ) : (
        <div className="space-y-2">
          {sortedTimers.map((timer) => (
            <CountdownCard
              key={timer.id}
              timer={timer}
              onEdit={() => handleEdit(timer)}
              onDelete={() => deleteTimer(timer.id)}
              onTogglePin={() => togglePinned(timer.id)}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => {
          setEditingTimer(null);
          setShowModal(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-2 text-sm text-white/50 transition-colors hover:border-white/30 hover:text-white/70"
      >
        <Plus size={16} />
        <span>Add Countdown</span>
      </button>

      {showModal && (
        <CountdownModal
          onClose={() => {
            setShowModal(false);
            setEditingTimer(null);
          }}
          onSave={handleSave}
          initialData={editingTimer || undefined}
        />
      )}
    </div>
  );
}

// Compact button for dashboard header
export function CountdownButton() {
  const { timers } = useCountdownStore();
  const [showPopup, setShowPopup] = useState(false);
  const [, setTick] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setShowPopup(false);
  }, []);

  useClickOutside(popupRef, handleClose, showPopup);

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (timers.length === 0) return null;

  // Get the next upcoming timer
  const sortedTimers = [...timers]
    .filter((t) => !getTimeRemaining(t.targetDate).isPast)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  const nextTimer = sortedTimers[0];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowPopup(!showPopup)}
        className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title="Countdown Timers"
      >
        <Timer size={14} />
        {nextTimer && (
          <span className="text-xs tabular-nums">
            {formatCompact(getTimeRemaining(nextTimer.targetDate))}
          </span>
        )}
      </button>

      {showPopup && (
        <div
          ref={popupRef}
          className="absolute top-full mt-2 right-0 z-50 min-w-[220px] rounded-lg border border-white/10 bg-gray-900/95 p-3 shadow-xl backdrop-blur-sm"
        >
          <div className="space-y-2">
            {sortedTimers.slice(0, 5).map((timer) => (
              <CountdownCard key={timer.id} timer={timer} compact onEdit={() => {}} onDelete={() => {}} onTogglePin={() => {}} />
            ))}
            {sortedTimers.length === 0 && (
              <p className="text-sm text-white/40 text-center py-2">No active countdowns</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Pinned countdown widget for dashboard
export function PinnedCountdown({ timer }: { timer: CountdownTimer }) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    getTimeRemaining(timer.targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(timer.targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.targetDate]);

  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm"
      title={timer.title}
    >
      <Timer size={14} style={{ color: timer.color }} />
      <div className="text-xs">
        <span className="text-white/70 truncate max-w-[80px] inline-block align-bottom">
          {timer.title}
        </span>
        <span className="text-white/40 mx-1">·</span>
        <span className="text-white font-medium tabular-nums" style={{ color: timer.color }}>
          {timeRemaining.isPast ? 'Done' : formatCompact(timeRemaining)}
        </span>
      </div>
    </div>
  );
}

// Header actions for PopupPanel
export function CountdownHeaderActions({ onClose }: { onClose?: () => void }) {
  const handleOpenSettings = () => {
    onClose?.();
    window.dispatchEvent(
      new CustomEvent('openSettings', { detail: { section: 'countdowns' } })
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
