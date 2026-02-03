import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Play, Pause, RotateCcw, MoreHorizontal, Check, Plus, Clock, Bell, Eye, Volume2, Timer, ArrowUpDown, Edit3, ExternalLink, CheckSquare, Settings } from 'lucide-react';
import {
  useFocusSessionStore,
  getRandomFocusQuote,
  getCelebrationMessage,
} from '@/stores/focusSessionStore';
import { useFocusStore } from '@/stores/focusStore';
import { useDropdownTheme } from '@/hooks/useTheme';
import { useClickOutside } from '@/hooks/useClickOutside';
import { IconButton } from '@/components/ui/IconButton';
import { PopupPanel } from '@/components/ui/PopupPanel';
import { TodoList, TodoListHeaderActions } from '@/components/widgets/TodoList';
import { QuickLinks, QuickLinksHeaderActions } from '@/components/widgets/QuickLinks';
import { useTodosStore } from '@/stores/todosStore';
import { useSettingsStore } from '@/stores/settingsStore';

// Format seconds to MM:SS or HH:MM:SS
function formatTime(seconds: number, hideSeconds: boolean = false): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hideSeconds) {
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}`;
    }
    return `${mins}`;
  }

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format session duration for display
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m ${seconds % 60}s`;
}

// Confetti particle component
function Confetti() {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
      color: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f8a5c2', '#778beb'][
        Math.floor(Math.random() * 6)
      ],
      size: 8 + Math.random() * 8,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Transition screen with motivational quote
function TransitionScreen() {
  const [quote] = useState(() => getRandomFocusQuote());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
      <div className="text-center px-8 max-w-lg">
        {/* Animated icon */}
        <div className="text-6xl mb-6 animate-pulse">{quote.icon}</div>

        {/* Quote text */}
        <p className="text-2xl md:text-3xl font-light text-white mb-8 animate-slideUp">
          {quote.text}
        </p>

        {/* Loading dots */}
        <div className="flex justify-center gap-2">
          <div
            className="w-2 h-2 rounded-full bg-white/60 animate-loadingDot"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="w-2 h-2 rounded-full bg-white/60 animate-loadingDot"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-2 h-2 rounded-full bg-white/60 animate-loadingDot"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>
    </div>
  );
}

// Celebration/stats screen
function CelebrationScreen() {
  const { totalSessionSeconds, pomodorosCompleted } = useFocusSessionStore();
  const celebration = getCelebrationMessage(totalSessionSeconds);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
      {celebration.showConfetti && <Confetti />}

      <div className="text-center px-8 max-w-lg">
        {/* Celebration emoji */}
        <div className="text-7xl mb-4 animate-bounce">{celebration.emoji}</div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3 animate-slideUp">
          {celebration.title}
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-white/70 mb-8 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          {celebration.subtitle}
        </p>

        {/* Stats card */}
        <div
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-scaleIn"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex justify-center gap-8">
            {/* Session time */}
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {formatDuration(totalSessionSeconds)}
              </div>
              <div className="text-sm text-white/50">Total Time</div>
            </div>

            {/* Pomodoros completed */}
            {pomodorosCompleted > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {pomodorosCompleted}
                </div>
                <div className="text-sm text-white/50">
                  {pomodorosCompleted === 1 ? 'Pomodoro' : 'Pomodoros'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle switch component
function ToggleSwitch({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-green-500' : 'bg-white/20'}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// Arc progress component (70% of circle, gap centered at bottom)
function ArcProgress({ progress, size = 320, strokeWidth = 4, children }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // 70% of circle = 252 degrees, gap = 108 degrees (30%)
  const arcPercent = 0.7;
  const arcLength = circumference * arcPercent;
  const gapLength = circumference * (1 - arcPercent);

  // Progress arc length based on remaining time
  // progress = 1 means full arc, progress = 0 means no arc
  const progressArcLength = arcLength * progress;

  // Rotation to center gap at bottom:
  // SVG starts at 3 o'clock (0deg), we want gap centered at 6 o'clock (90deg from start)
  // Arc is 252deg, gap is 108deg (54deg on each side of bottom)
  // Start drawing arc at: 90deg + 54deg = 144deg from 3 o'clock position
  const rotation = 144;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Background track arc (70%) - always visible */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${gapLength}`}
        />
        {/* Progress arc - shrinks as time passes */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progressArcLength} ${circumference}`}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Timer settings dropdown for Pomodoro
function PomodoroSettingsDropdown({ onClose, onSwitchMode, triggerRef }: { onClose: () => void; onSwitchMode: () => void; triggerRef?: React.RefObject<HTMLElement | null> }) {
  const {
    settings,
    updateSettings,
    resetTimer,
    addMinutes,
    completeCurrentTimer,
    isTimerRunning,
  } = useFocusSessionStore();
  const { dropdown, menuItem, divider } = useDropdownTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  const [focusTime, setFocusTime] = useState(settings.focusDuration.toString());
  const [breakTime, setBreakTime] = useState(settings.breakDuration.toString());

  // Calculate adaptive position
  const [position, setPosition] = useState<{ vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' }>({ vertical: 'bottom', horizontal: 'right' });

  useEffect(() => {
    if (!triggerRef?.current) return;

    const calculatePosition = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const contentHeight = contentRef.current?.offsetHeight || 400;
      const contentWidth = contentRef.current?.offsetWidth || 256;

      const spaceBelow = window.innerHeight - triggerRect.bottom - 8;
      const spaceAbove = triggerRect.top - 8;
      const spaceRight = window.innerWidth - triggerRect.right;
      const spaceLeft = triggerRect.left;

      setPosition({
        vertical: spaceBelow < contentHeight && spaceAbove > spaceBelow ? 'top' : 'bottom',
        horizontal: spaceRight < contentWidth && spaceLeft > spaceRight ? 'left' : 'right',
      });
    };

    calculatePosition();
    const frameId = requestAnimationFrame(calculatePosition);
    window.addEventListener('resize', calculatePosition);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [triggerRef]);

  const handleFocusTimeChange = (value: string) => {
    setFocusTime(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0 && num <= 120) {
      updateSettings({ focusDuration: num });
    }
  };

  const handleBreakTimeChange = (value: string) => {
    setBreakTime(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0 && num <= 60) {
      updateSettings({ breakDuration: num });
    }
  };

  const positionClasses = `${position.horizontal === 'right' ? 'right-0' : 'left-0'} ${position.vertical === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}`;

  // Arrow positioning
  const arrowAlignmentClass = position.horizontal === 'right' ? 'right-3' : 'left-3';

  return (
    <div
      ref={contentRef}
      className={`absolute ${positionClasses} z-50 w-64 rounded-xl ${dropdown} backdrop-blur-sm shadow-2xl overflow-visible`}
      style={{ animation: 'fadeIn 150ms ease-out' }}
    >
        {/* Arrow */}
        {position.vertical === 'bottom' ? (
          <div
            className={`absolute -top-1.5 ${arrowAlignmentClass} w-3 h-3 rotate-45 bg-inherit rounded-tl-sm`}
            style={{ boxShadow: '-1px -1px 1px rgba(0,0,0,0.1)' }}
          />
        ) : (
          <div
            className={`absolute -bottom-1.5 ${arrowAlignmentClass} w-3 h-3 rotate-45 bg-inherit rounded-br-sm`}
            style={{ boxShadow: '1px 1px 1px rgba(0,0,0,0.1)' }}
          />
        )}

        {/* Header with mode toggle */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
          <div className="flex items-center gap-2">
            <Timer size={16} />
            <span className="font-medium">Pomodoro</span>
          </div>
          <button
            onClick={() => { onSwitchMode(); }}
            disabled={isTimerRunning}
            className={`p-1.5 rounded-md transition-colors ${
              isTimerRunning
                ? 'opacity-20 cursor-not-allowed'
                : 'opacity-50 hover:opacity-80 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="Switch to Count Up"
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className={`p-2 border-b ${divider}`}>
          <button
            onClick={() => { completeCurrentTimer(); onClose(); }}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm rounded-lg transition-colors ${menuItem}`}
          >
            <Check size={16} />
            <span>Complete timer</span>
          </button>
          <button
            onClick={() => { resetTimer(); onClose(); }}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm rounded-lg transition-colors ${menuItem}`}
          >
            <RotateCcw size={16} />
            <span>Restart timer</span>
          </button>
          <button
            onClick={() => { addMinutes(10); onClose(); }}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm rounded-lg transition-colors ${menuItem}`}
          >
            <Plus size={16} />
            <span>Add 10 minutes</span>
          </button>
        </div>

        {/* Duration inputs */}
        <div className={`p-3 border-b ${divider} space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Focus</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={focusTime}
                onChange={(e) => handleFocusTimeChange(e.target.value)}
                disabled={isTimerRunning}
                className="w-12 bg-transparent border-none text-sm opacity-70 text-right disabled:opacity-50 outline-none"
                min="1"
                max="120"
              />
              <span className="text-sm opacity-40">min</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Break</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={breakTime}
                onChange={(e) => handleBreakTimeChange(e.target.value)}
                disabled={isTimerRunning}
                className="w-12 bg-transparent border-none text-sm opacity-70 text-right disabled:opacity-50 outline-none"
                min="1"
                max="60"
              />
              <span className="text-sm opacity-40">min</span>
            </div>
          </div>
        </div>

        {/* Toggle settings */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Timer sound effects</span>
            <ToggleSwitch
              checked={settings.soundEnabled}
              onChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Auto-start timers</span>
            <ToggleSwitch
              checked={settings.autoStartTimers}
              onChange={(checked) => updateSettings({ autoStartTimers: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Hide seconds</span>
            <ToggleSwitch
              checked={settings.hideSeconds}
              onChange={(checked) => updateSettings({ hideSeconds: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Browser notifications</span>
            <ToggleSwitch
              checked={settings.notificationsEnabled}
              onChange={(checked) => updateSettings({ notificationsEnabled: checked })}
            />
          </div>
        </div>
      </div>
  );
}

// Timer settings dropdown for Count Up
function CountUpSettingsDropdown({ onClose, onSwitchMode, triggerRef }: { onClose: () => void; onSwitchMode: () => void; triggerRef?: React.RefObject<HTMLElement | null> }) {
  const { settings, updateSettings, resetTimer, isTimerRunning } = useFocusSessionStore();
  const { dropdown, menuItem, divider } = useDropdownTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate adaptive position
  const [position, setPosition] = useState<{ vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' }>({ vertical: 'bottom', horizontal: 'right' });

  useEffect(() => {
    if (!triggerRef?.current) return;

    const calculatePosition = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const contentHeight = contentRef.current?.offsetHeight || 200;
      const contentWidth = contentRef.current?.offsetWidth || 224;

      const spaceBelow = window.innerHeight - triggerRect.bottom - 8;
      const spaceAbove = triggerRect.top - 8;
      const spaceRight = window.innerWidth - triggerRect.right;
      const spaceLeft = triggerRect.left;

      setPosition({
        vertical: spaceBelow < contentHeight && spaceAbove > spaceBelow ? 'top' : 'bottom',
        horizontal: spaceRight < contentWidth && spaceLeft > spaceRight ? 'left' : 'right',
      });
    };

    calculatePosition();
    const frameId = requestAnimationFrame(calculatePosition);
    window.addEventListener('resize', calculatePosition);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [triggerRef]);

  const positionClasses = `${position.horizontal === 'right' ? 'right-0' : 'left-0'} ${position.vertical === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}`;

  // Arrow positioning
  const arrowAlignmentClass = position.horizontal === 'right' ? 'right-3' : 'left-3';

  return (
    <div
        ref={contentRef}
        className={`absolute ${positionClasses} z-50 w-56 rounded-xl ${dropdown} backdrop-blur-sm shadow-2xl overflow-visible`}
        style={{ animation: 'fadeIn 150ms ease-out' }}
      >
        {/* Arrow */}
        {position.vertical === 'bottom' ? (
          <div
            className={`absolute -top-1.5 ${arrowAlignmentClass} w-3 h-3 rotate-45 bg-inherit rounded-tl-sm`}
            style={{ boxShadow: '-1px -1px 1px rgba(0,0,0,0.1)' }}
          />
        ) : (
          <div
            className={`absolute -bottom-1.5 ${arrowAlignmentClass} w-3 h-3 rotate-45 bg-inherit rounded-br-sm`}
            style={{ boxShadow: '1px 1px 1px rgba(0,0,0,0.1)' }}
          />
        )}

        {/* Header with mode toggle */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span className="font-medium">Count Up</span>
          </div>
          <button
            onClick={() => { onSwitchMode(); }}
            disabled={isTimerRunning}
            className={`p-1.5 rounded-md transition-colors ${
              isTimerRunning
                ? 'opacity-20 cursor-not-allowed'
                : 'opacity-50 hover:opacity-80 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="Switch to Pomodoro"
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className={`p-2 border-b ${divider}`}>
          <button
            onClick={() => { resetTimer(); onClose(); }}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm rounded-lg transition-colors ${menuItem}`}
          >
            <RotateCcw size={16} />
            <span>Restart timer</span>
          </button>
        </div>

        {/* Toggle settings */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Hide seconds</span>
            <ToggleSwitch
              checked={settings.hideSeconds}
              onChange={(checked) => updateSettings({ hideSeconds: checked })}
            />
          </div>
        </div>
      </div>
  );
}

// Focus input component inside the timer (matches normal mode functionality)
function FocusInput() {
  const { focus, isCompleted, setFocus, completeFocus, clearFocus, toggleComplete } = useFocusStore();
  const { dropdown, menuItem } = useDropdownTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(focus);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ vertical: 'top' | 'bottom' }>({ vertical: 'bottom' });

  const handleCloseMenu = useCallback(() => setShowMenu(false), []);
  useClickOutside(menuContainerRef, handleCloseMenu, showMenu);

  // Calculate adaptive position for menu
  useEffect(() => {
    if (!showMenu || !menuButtonRef.current) return;

    const calculatePosition = () => {
      const triggerRect = menuButtonRef.current!.getBoundingClientRect();
      const contentHeight = menuContentRef.current?.offsetHeight || 80;
      const spaceBelow = window.innerHeight - triggerRect.bottom - 8;
      const spaceAbove = triggerRect.top - 8;

      setMenuPosition({
        vertical: spaceBelow < contentHeight && spaceAbove > spaceBelow ? 'top' : 'bottom',
      });
    };

    calculatePosition();
    const frameId = requestAnimationFrame(calculatePosition);

    return () => cancelAnimationFrame(frameId);
  }, [showMenu]);

  useEffect(() => {
    setInputValue(focus);
  }, [focus]);

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

  const handleToggleComplete = () => {
    if (toggleComplete) {
      toggleComplete();
    } else {
      completeFocus();
    }
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

  // No focus set - show prompt
  if (!focus && !isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-lg text-white/50 hover:text-white/70 transition-colors"
      >
        I will focus on...
      </button>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        placeholder="I will focus on..."
        className="w-full max-w-[240px] bg-transparent text-lg text-white text-center outline-none placeholder-white/40"
        maxLength={100}
      />
    );
  }

  // Focus is set - show with checkbox and menu
  return (
    <div className="relative group">
      {/* Centered content */}
      <div className="flex items-center justify-center gap-2">
        {/* Checkbox - toggleable */}
        <button
          onClick={handleToggleComplete}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? 'border-green-400 bg-green-400/20 text-green-400'
              : 'border-white/40 hover:border-white/60 text-transparent hover:text-white/40'
          }`}
        >
          <Check size={12} strokeWidth={3} />
        </button>

        {/* Focus text */}
        <span
          className={`text-lg transition-all max-w-[180px] truncate ${
            isCompleted ? 'text-white/40 line-through' : 'text-white/90'
          }`}
          title={focus}
        >
          {focus}
        </span>
      </div>

      {/* Three dots menu - absolute positioned on right */}
      <div ref={menuContainerRef} className="absolute -right-8 top-1/2 -translate-y-1/2">
        <button
          ref={menuButtonRef}
          onClick={() => setShowMenu(!showMenu)}
          className={`p-1 rounded-full transition-all hover:bg-white/10 ${
            showMenu ? 'opacity-100 text-white/60' : 'opacity-0 group-hover:opacity-100 text-white/40'
          }`}
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div
            ref={menuContentRef}
            className={`absolute right-0 ${menuPosition.vertical === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} z-50 w-28 rounded-lg ${dropdown} backdrop-blur-sm py-1 shadow-xl overflow-visible`}
            style={{ animation: 'fadeIn 150ms ease-out' }}
          >
            {/* Arrow */}
            {menuPosition.vertical === 'bottom' ? (
              <div
                className="absolute -top-1.5 right-3 w-3 h-3 rotate-45 bg-inherit rounded-tl-sm"
                style={{ boxShadow: '-1px -1px 1px rgba(0,0,0,0.1)' }}
              />
            ) : (
              <div
                className="absolute -bottom-1.5 right-3 w-3 h-3 rotate-45 bg-inherit rounded-br-sm"
                style={{ boxShadow: '1px 1px 1px rgba(0,0,0,0.1)' }}
              />
            )}
            <button
              onClick={handleEdit}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${menuItem}`}
            >
              <Edit3 size={12} />
              <span>Edit</span>
            </button>
            <button
              onClick={handleClear}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${menuItem}`}
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Focus Mode UI
function FocusModeUI() {
  const {
    timerMode,
    pomodoroPhase,
    pomodorosCompleted,
    isTimerRunning,
    timerSeconds,
    initialTimerSeconds,
    totalSessionSeconds,
    settings,
    exitFocusMode,
    setTimerMode,
    setPomodoroPhase,
    startTimer,
    pauseTimer,
    tick,
  } = useFocusSessionStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const settingsContainerRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const { tasks } = useTodosStore();
  const { widgets } = useSettingsStore();
  const incompleteTasks = tasks.filter((t) => !t.completed).length;

  const handleCloseSettings = useCallback(() => setShowSettings(false), []);
  useClickOutside(settingsContainerRef, handleCloseSettings, showSettings);

  const openSettings = () => {
    window.dispatchEvent(new CustomEvent('openSettings', { detail: {} }));
  };

  // Calculate progress for arc indicator
  const progress = timerMode === 'pomodoro' && initialTimerSeconds > 0
    ? timerSeconds / initialTimerSeconds
    : 0;

  // Use ref for tick to avoid recreating interval on every state change
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // Timer tick effect - stable interval that doesn't recreate on tick changes
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = window.setInterval(() => {
      tickRef.current();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Use ref for exitFocusMode to avoid ESC handler re-registration
  const exitFocusModeRef = useRef(exitFocusMode);
  useEffect(() => {
    exitFocusModeRef.current = exitFocusMode;
  }, [exitFocusMode]);

  // ESC key handler - stable handler that doesn't re-register on exitFocusMode changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        exitFocusModeRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSwitchMode = () => {
    setTimerMode(timerMode === 'pomodoro' ? 'countup' : 'pomodoro');
    setShowSettings(false);
  };

  // Format time with m suffix for display
  const formatTimeDisplay = (seconds: number, hideSeconds: boolean) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hideSeconds) {
      if (hrs > 0) {
        return `${hrs}h ${mins}m`;
      }
      return `${mins}m`;
    }

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col">
      {/* Header - Status and Exit button */}
      <div
        className="flex items-center justify-between p-6 animate-slideDown"
        style={{ animationDelay: '0s' }}
      >
        {/* Left - Quick Links, Settings, Focus indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <IconButton
              icon={ExternalLink}
              onClick={() => setShowLinks(!showLinks)}
              label="Quick Links"
            />
            <IconButton
              icon={Settings}
              onClick={openSettings}
              label="Settings"
            />
          </div>

          {/* Pulsing green dot + Focus Mode label */}
          <div className="flex items-center gap-3 ml-2 pl-3 border-l border-white/20">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
            </div>
            <div>
              <span className="text-white/90 font-medium">Focus Mode</span>
              <span className="text-white/50 ml-2 text-sm">
                {formatDuration(totalSessionSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Right - End Focus button */}
        <button
          onClick={exitFocusMode}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
        >
          <X size={18} />
          <span className="text-sm font-medium">End Focus</span>
          <span className="text-xs text-white/40 ml-1">ESC</span>
        </button>
      </div>

      {/* Main content - Timer */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Timer display with arc */}
        <div className="relative animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          {timerMode === 'pomodoro' ? (
            <div className="relative group">
              <ArcProgress progress={progress} size={340}>
                <div className="flex flex-col items-center justify-center">
                  {/* FOCUS / BREAK tabs inside circle - clickable */}
                  <div className="flex items-center gap-6 mb-3">
                    <button
                      onClick={() => !isTimerRunning && setPomodoroPhase('focus')}
                      disabled={isTimerRunning}
                      className={`text-sm font-medium tracking-wider transition-colors ${
                        pomodoroPhase === 'focus' ? 'text-white' : 'text-white/40 hover:text-white/60'
                      } ${isTimerRunning ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      FOCUS
                    </button>
                    <button
                      onClick={() => !isTimerRunning && setPomodoroPhase('break')}
                      disabled={isTimerRunning}
                      className={`text-sm font-medium tracking-wider transition-colors ${
                        pomodoroPhase === 'break' ? 'text-white' : 'text-white/40 hover:text-white/60'
                      } ${isTimerRunning ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      BREAK
                    </button>
                  </div>

                  {/* Time - centered */}
                  <div className="text-6xl font-extralight text-white tracking-tight mb-3">
                    {formatTimeDisplay(timerSeconds, settings.hideSeconds)}
                  </div>

                  {/* Focus input inside the arc */}
                  <FocusInput />

                  {/* Play/Pause button inside circle */}
                  <button
                    onClick={isTimerRunning ? pauseTimer : startTimer}
                    className={`mt-4 flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                      isTimerRunning
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    {isTimerRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>
                </div>
              </ArcProgress>

              {/* Settings button - absolute positioned on right */}
              <div ref={settingsContainerRef} className="absolute -right-10 top-1/2 -translate-y-1/2">
                <button
                  ref={settingsButtonRef}
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-full transition-all hover:bg-white/10 ${
                    showSettings
                      ? 'opacity-100 bg-white/20 text-white'
                      : 'opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/70'
                  }`}
                >
                  <MoreHorizontal size={18} />
                </button>

                {/* Settings dropdown */}
                {showSettings && (
                  <PomodoroSettingsDropdown onClose={() => setShowSettings(false)} onSwitchMode={handleSwitchMode} triggerRef={settingsButtonRef} />
                )}
              </div>
            </div>
          ) : (
            /* Count Up mode - no arc, just centered content */
            <div className="relative group">
              <div className="w-[340px] h-[340px] flex flex-col items-center justify-center">
                {/* Time - centered */}
                <div className="text-6xl font-extralight text-white tracking-tight mb-3">
                  {formatTimeDisplay(timerSeconds, settings.hideSeconds)}
                </div>

                {/* Focus input */}
                <FocusInput />

                {/* Play/Pause button */}
                <button
                  onClick={isTimerRunning ? pauseTimer : startTimer}
                  className={`mt-4 flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                    isTimerRunning
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {isTimerRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
              </div>

              {/* Settings button - absolute positioned on right */}
              <div ref={settingsContainerRef} className="absolute -right-10 top-1/2 -translate-y-1/2">
                <button
                  ref={settingsButtonRef}
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-full transition-all hover:bg-white/10 ${
                    showSettings
                      ? 'opacity-100 bg-white/20 text-white'
                      : 'opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/70'
                  }`}
                >
                  <MoreHorizontal size={18} />
                </button>

                {/* Settings dropdown */}
                {showSettings && (
                  <CountUpSettingsDropdown onClose={() => setShowSettings(false)} onSwitchMode={handleSwitchMode} triggerRef={settingsButtonRef} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pomodoros completed */}
        {timerMode === 'pomodoro' && pomodorosCompleted > 0 && (
          <div
            className="mt-4 text-sm text-white/40 animate-fadeIn"
            style={{ animationDelay: '0.4s' }}
          >
            {pomodorosCompleted} {pomodorosCompleted === 1 ? 'pomodoro' : 'pomodoros'} completed
          </div>
        )}
      </div>

      {/* Footer - Tasks icon on right */}
      <div
        className="p-6 flex items-center justify-between animate-fadeIn"
        style={{ animationDelay: '0.5s' }}
      >
        {/* Left spacer for centering */}
        <div className="w-10" />

        {/* Center - motivational text */}
        <p className="text-white/30 text-sm italic">
          {timerMode === 'pomodoro'
            ? 'Now is the time to tune out the world and focus.'
            : 'Track your focused work time'}
        </p>

        {/* Right - Tasks icon */}
        <div className="relative">
          <IconButton
            icon={CheckSquare}
            onClick={() => setShowTodos(!showTodos)}
            label="Todo List"
          />
          {incompleteTasks > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-medium text-white">
              {incompleteTasks}
            </span>
          )}
        </div>
      </div>

      {/* Todo List Popup */}
      <PopupPanel
        isOpen={showTodos && widgets.todos}
        onClose={() => setShowTodos(false)}
        position="bottom-right"
        title="Tasks"
        maxWidth="max-w-sm"
        headerActions={<TodoListHeaderActions onClose={() => setShowTodos(false)} />}
      >
        <TodoList />
      </PopupPanel>

      {/* Quick Links Popup */}
      <PopupPanel
        isOpen={showLinks && widgets.quickLinks}
        onClose={() => setShowLinks(false)}
        position="top-left"
        title="Quick Links"
        maxWidth="max-w-sm"
        headerActions={<QuickLinksHeaderActions onClose={() => setShowLinks(false)} />}
      >
        <QuickLinks />
      </PopupPanel>
    </div>
  );
}

// Main overlay component - orchestrates all phases
export function FocusModeOverlay() {
  const { phase, setPhase, resetSession } = useFocusSessionStore();

  // Use refs to avoid stale closures in setTimeout callbacks
  const setPhaseRef = useRef(setPhase);
  const resetSessionRef = useRef(resetSession);

  useEffect(() => {
    setPhaseRef.current = setPhase;
    resetSessionRef.current = resetSession;
  }, [setPhase, resetSession]);

  // Handle phase transitions using refs to avoid stale closures
  useEffect(() => {
    if (phase === 'idle' || phase === 'active') return;

    let timeoutId: number;

    switch (phase) {
      case 'entering':
        // After zoom animation, show transition screen
        timeoutId = window.setTimeout(() => setPhaseRef.current('transition'), 2000);
        break;
      case 'transition':
        // After quote screen, show focus UI
        timeoutId = window.setTimeout(() => setPhaseRef.current('active'), 2200);
        break;
      case 'exiting':
        // After fade out, show celebration
        timeoutId = window.setTimeout(() => setPhaseRef.current('celebration'), 400);
        break;
      case 'celebration':
        // After celebration, start zoom out
        timeoutId = window.setTimeout(() => setPhaseRef.current('leaving'), 2800);
        break;
      case 'leaving':
        // After zoom out, reset to idle
        timeoutId = window.setTimeout(() => resetSessionRef.current(), 2000);
        break;
    }

    // Cleanup timeout on phase change or unmount
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [phase]);

  // Don't render anything in idle state
  if (phase === 'idle') return null;

  return (
    <>
      {/* Transition screen */}
      {phase === 'transition' && <TransitionScreen />}

      {/* Focus Mode UI */}
      {phase === 'active' && <FocusModeUI />}

      {/* Exit animation */}
      {phase === 'exiting' && (
        <div className="fixed inset-0 z-40 animate-fadeOut">
          <FocusModeUI />
        </div>
      )}

      {/* Celebration screen */}
      {phase === 'celebration' && <CelebrationScreen />}

      {/* Animations CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes loadingDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-fadeOut {
          animation: fadeOut 0.4s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.5s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out forwards;
        }

        .animate-loadingDot {
          animation: loadingDot 1.4s ease-in-out infinite;
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </>
  );
}
