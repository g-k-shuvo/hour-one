import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Layers,
  Save,
  RotateCcw,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useTabStashStore, type TabSession } from '@/stores/tabStashStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { PopupPanel } from '@/components/ui/PopupPanel';

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Session Item Component
function SessionItem({
  session,
  onRestore,
  onDelete,
  onRename,
  isLoading,
}: {
  session: TabSession;
  onRestore: (closeCurrentTabs: boolean) => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  isLoading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveName = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditName(session.name);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-0.5 p-1 rounded text-white/40 hover:text-white/60 hover:bg-white/10 transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Session info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="flex-1 bg-white/10 rounded px-2 py-0.5 text-sm text-white outline-none focus:ring-1 ring-accent"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 text-green-400 hover:bg-green-400/20 rounded"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setEditName(session.name);
                    setIsEditing(false);
                  }}
                  className="p-1 text-white/40 hover:bg-white/10 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">{session.name}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-white/30 hover:text-white/60 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
              <span>{session.tabCount} tabs</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatRelativeTime(session.createdAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onRestore(false)}
              disabled={isLoading}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Open tabs (keep current)"
            >
              <RotateCcw size={14} />
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={onDelete}
                  className="p-1.5 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                  title="Confirm delete"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-1.5 text-white/40 hover:bg-white/10 rounded-lg transition-colors"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Delete session"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded tabs list */}
      {isExpanded && (
        <div className="border-t border-white/10 px-3 py-2 max-h-48 overflow-y-auto scrollbar-thin">
          <div className="space-y-1">
            {session.tabs.map((tab, index) => (
              <a
                key={index}
                href={tab.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 transition-colors group"
              >
                {tab.favicon ? (
                  <img
                    src={tab.favicon}
                    alt=""
                    className="w-4 h-4 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ExternalLink size={14} className="text-white/30" />
                )}
                <span className="text-xs text-white/70 truncate flex-1">{tab.title}</span>
                {tab.pinned && (
                  <span className="text-[10px] text-accent bg-accent/20 px-1 rounded">pinned</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Tab Stash Panel Component
export function TabStashPanel() {
  const {
    sessions,
    hasPermission,
    isApiAvailable,
    isLoading,
    error,
    checkPermission,
    requestPermission,
    saveCurrentTabs,
    restoreSession,
    deleteSession,
    renameSession,
    clearError,
  } = useTabStashStore();

  const [saveSessionName, setSaveSessionName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  useEffect(() => {
    if (isApiAvailable) {
      checkPermission();
    }
  }, [isApiAvailable, checkPermission]);

  const handleSave = async () => {
    const session = await saveCurrentTabs(saveSessionName || undefined);
    if (session) {
      setSaveSessionName('');
      setShowSaveInput(false);
    }
  };

  // Not in Chrome extension environment
  if (!isApiAvailable) {
    return (
      <div className="text-center py-8">
        <Layers size={32} className="mx-auto text-white/20 mb-3" />
        <p className="text-sm text-white/50">
          Tab Stash is only available in Chrome
        </p>
      </div>
    );
  }

  // Permission not granted
  if (!hasPermission) {
    return (
      <div className="text-center py-8">
        <Layers size={32} className="mx-auto text-white/30 mb-3" />
        <p className="text-sm text-white/70 mb-4">
          Enable Tab Stash to save and restore your browser sessions
        </p>
        <button
          onClick={requestPermission}
          disabled={isLoading}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Enabling...' : 'Enable Tab Stash'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg text-red-400 text-xs">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto p-1 hover:bg-red-500/20 rounded">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Save current tabs */}
      <div className="p-3 bg-white/5 rounded-xl">
        {showSaveInput ? (
          <div className="space-y-2">
            <input
              type="text"
              value={saveSessionName}
              onChange={(e) => setSaveSessionName(e.target.value)}
              placeholder="Session name (optional)"
              autoFocus
              className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:ring-1 ring-accent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setShowSaveInput(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowSaveInput(false)}
                className="px-3 py-2 text-white/60 hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveInput(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Save size={16} />
            <span className="text-sm font-medium">Save Current Tabs</span>
          </button>
        )}
      </div>

      {/* Sessions list */}
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <div className="text-center py-6 text-white/40 text-sm">
            <Layers size={24} className="mx-auto mb-2 opacity-50" />
            <p>No saved sessions yet</p>
            <p className="text-xs mt-1">Save your tabs to access them later</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="group">
              <SessionItem
                session={session}
                onRestore={(closeCurrentTabs) => restoreSession(session.id, closeCurrentTabs)}
                onDelete={() => deleteSession(session.id)}
                onRename={(name) => renameSession(session.id, name)}
                isLoading={isLoading}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Compact button for dashboard
export function TabStashButton({ onClick }: { onClick: () => void }) {
  const { sessions, hasPermission, isApiAvailable } = useTabStashStore();

  if (!isApiAvailable) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
      title="Tab Stash"
    >
      <Layers size={14} />
      {hasPermission && sessions.length > 0 && (
        <span className="text-xs">{sessions.length}</span>
      )}
    </button>
  );
}

// Header actions for the popup panel
export function TabStashHeaderActions({ onClose }: { onClose: () => void }) {
  const { saveCurrentTabs, hasPermission, isLoading } = useTabStashStore();

  if (!hasPermission) return null;

  return (
    <button
      onClick={async () => {
        await saveCurrentTabs();
      }}
      disabled={isLoading}
      className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
      title="Quick save current tabs"
    >
      <Save size={16} />
    </button>
  );
}
