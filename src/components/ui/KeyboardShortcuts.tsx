import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Keyboard, Command } from 'lucide-react';
import {
  useKeyboardStore,
  formatShortcut,
  matchesShortcut,
  type KeyboardShortcut,
} from '@/stores/keyboardStore';
import { useFocusSessionStore } from '@/stores/focusSessionStore';
import { useFocusStore } from '@/stores/focusStore';
import { useBalanceStore } from '@/stores/balanceStore';

// Shortcut handlers type
export interface ShortcutHandlers {
  openSettings: () => void;
  toggleTodos: () => void;
  toggleLinks: () => void;
  toggleHabits: () => void;
  toggleBalance: () => void;
  toggleMetrics: () => void;
  toggleWorldClocks: () => void;
  toggleCountdowns: () => void;
  startFocusMode: () => void;
  startAutofocus: () => void;
  newTask: () => void;
}

// Hook to handle keyboard shortcuts
export function useKeyboardShortcuts(handlers: Partial<ShortcutHandlers>) {
  const { enabled, getAllShortcuts, toggleHelp } = useKeyboardStore();
  const { phase: focusPhase, togglePause, skipBreak, exitFocusMode } = useFocusSessionStore();
  const { focus } = useFocusStore();
  const { activeSession, startWork, stopWork } = useBalanceStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape to work even in inputs
      if (event.key !== 'Escape') return;
    }

    const shortcuts = getAllShortcuts();
    const isInFocusMode = focusPhase !== 'idle' && focusPhase !== 'leaving';

    for (const shortcut of shortcuts) {
      if (!matchesShortcut(event, shortcut)) continue;

      // Focus mode specific shortcuts
      if (shortcut.category === 'focus') {
        if (!isInFocusMode) continue;

        event.preventDefault();
        switch (shortcut.id) {
          case 'pauseResume':
            togglePause();
            break;
          case 'skipBreak':
            if (focusPhase === 'break') skipBreak();
            break;
          case 'exitFocus':
            exitFocusMode();
            break;
        }
        return;
      }

      // Don't trigger regular shortcuts during focus mode
      if (isInFocusMode && shortcut.category !== 'focus') continue;

      event.preventDefault();

      switch (shortcut.id) {
        case 'showHelp':
          toggleHelp();
          break;
        case 'openSettings':
          handlers.openSettings?.();
          break;
        case 'toggleTodos':
          handlers.toggleTodos?.();
          break;
        case 'toggleLinks':
          handlers.toggleLinks?.();
          break;
        case 'toggleHabits':
          handlers.toggleHabits?.();
          break;
        case 'toggleBalance':
          handlers.toggleBalance?.();
          break;
        case 'toggleMetrics':
          handlers.toggleMetrics?.();
          break;
        case 'toggleWorldClocks':
          handlers.toggleWorldClocks?.();
          break;
        case 'toggleCountdowns':
          handlers.toggleCountdowns?.();
          break;
        case 'startFocusMode':
          handlers.startFocusMode?.();
          break;
        case 'startAutofocus':
          handlers.startAutofocus?.();
          break;
        case 'startWork':
          if (activeSession?.type === 'work') {
            stopWork();
          } else {
            startWork();
          }
          break;
        case 'newTask':
          handlers.newTask?.();
          break;
      }
      return;
    }
  }, [enabled, getAllShortcuts, focusPhase, togglePause, skipBreak, exitFocusMode, toggleHelp, handlers, activeSession, startWork, stopWork]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Shortcut Badge Component
function ShortcutBadge({ shortcut }: { shortcut: KeyboardShortcut }) {
  const formatted = formatShortcut(shortcut);
  const keys = formatted.split(' + ');

  return (
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={i}>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono text-white/80">
            {key}
          </kbd>
          {i < keys.length - 1 && <span className="text-white/30 mx-0.5">+</span>}
        </span>
      ))}
    </div>
  );
}

// Shortcut Row Component
function ShortcutRow({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-white/80">{shortcut.description}</span>
      <ShortcutBadge shortcut={shortcut} />
    </div>
  );
}

// Help Modal Component
export function KeyboardShortcutsHelp() {
  const { showHelp, setShowHelp, getAllShortcuts, enabled, setEnabled } = useKeyboardStore();

  if (!showHelp) return null;

  const shortcuts = getAllShortcuts();
  const categories = {
    navigation: shortcuts.filter(s => s.category === 'navigation'),
    panels: shortcuts.filter(s => s.category === 'panels'),
    actions: shortcuts.filter(s => s.category === 'actions'),
    focus: shortcuts.filter(s => s.category === 'focus'),
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowHelp(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Keyboard className="text-accent" size={20} />
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl mb-4">
            <div>
              <p className="text-sm font-medium text-white">Enable Shortcuts</p>
              <p className="text-xs text-white/50">Toggle all keyboard shortcuts</p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                enabled ? 'bg-accent' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Navigation */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Navigation
            </h3>
            <div className="divide-y divide-white/5">
              {categories.navigation.map(s => (
                <ShortcutRow key={s.id} shortcut={s} />
              ))}
            </div>
          </div>

          {/* Panels */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Panels
            </h3>
            <div className="divide-y divide-white/5">
              {categories.panels.map(s => (
                <ShortcutRow key={s.id} shortcut={s} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Actions
            </h3>
            <div className="divide-y divide-white/5">
              {categories.actions.map(s => (
                <ShortcutRow key={s.id} shortcut={s} />
              ))}
            </div>
          </div>

          {/* Focus Mode */}
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Focus Mode
            </h3>
            <p className="text-xs text-white/30 mb-2">Only active during focus sessions</p>
            <div className="divide-y divide-white/5">
              {categories.focus.map(s => (
                <ShortcutRow key={s.id} shortcut={s} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <p className="text-xs text-white/40 text-center">
            Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-white/60 font-mono">Ctrl</kbd>
            {' + '}
            <kbd className="px-1 py-0.5 bg-white/10 rounded text-white/60 font-mono">/</kbd>
            {' '}anytime to toggle this help
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Small indicator button for shortcuts
export function KeyboardShortcutsButton() {
  const { toggleHelp, enabled } = useKeyboardStore();

  if (!enabled) return null;

  return (
    <button
      onClick={toggleHelp}
      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
      title="Keyboard Shortcuts (Ctrl + /)"
    >
      <Command size={14} />
    </button>
  );
}
