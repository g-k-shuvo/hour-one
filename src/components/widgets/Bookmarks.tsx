import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, RefreshCw, ExternalLink, Folder, ChevronDown, MoreHorizontal, Type, Image } from 'lucide-react';
import { useBookmarksStore } from '@/stores/bookmarksStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDropdownTheme } from '@/hooks/useTheme';
import { useClickOutside } from '@/hooks/useClickOutside';
import type { Bookmark as BookmarkType } from '@/services/bookmarksService';

// Nested folder item component (for folders inside dropdowns)
function NestedFolder({ bookmark, onClose }: { bookmark: BookmarkType; onClose: () => void }) {
  const { dropdown, menuItem } = useDropdownTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Estimate dimensions
      const estimatedWidth = 200;
      const estimatedHeight = Math.min(288, (bookmark.children?.length || 1) * 36 + 12);

      const openLeft = spaceRight < estimatedWidth && spaceLeft > spaceRight;
      const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

      // Calculate fixed position
      let left = openLeft ? rect.left - estimatedWidth - 4 : rect.right + 4;
      let top = openUpward ? rect.bottom - estimatedHeight : rect.top;

      // Clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - estimatedWidth - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - estimatedHeight - 8));

      setPosition({ top, left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${menuItem} ${isOpen ? 'bg-white/10 dark:bg-white/10' : ''}`}
      >
        <Folder size={14} className="text-amber-400/70 flex-shrink-0" />
        <span className="truncate flex-1 text-left">{bookmark.title}</span>
        <ChevronDown
          size={12}
          className="opacity-40 transition-transform flex-shrink-0 -rotate-90"
        />
      </button>

      {/* Nested dropdown - rendered via portal to escape parent stacking context */}
      {isOpen && bookmark.children && bookmark.children.length > 0 && createPortal(
        <div
          className={`fixed z-[100] min-w-44 max-w-60 max-h-72 overflow-y-auto scrollbar-thin rounded-lg ${dropdown} py-1.5 shadow-xl`}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {bookmark.children.slice(0, 12).map((child) =>
            child.isFolder ? (
              <NestedFolder key={child.id} bookmark={child} onClose={onClose} />
            ) : (
              <a
                key={child.id}
                href={child.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${menuItem}`}
                onClick={onClose}
              >
                {child.favicon ? (
                  <img
                    src={child.favicon}
                    alt=""
                    className="h-4 w-4 rounded flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ExternalLink size={14} className="opacity-40 flex-shrink-0" />
                )}
                <span className="truncate">{child.title}</span>
              </a>
            )
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// Top-level folder component (shows in bookmark bar)
function BookmarkFolder({ bookmark, iconOnly }: { bookmark: BookmarkType; iconOnly: boolean }) {
  const { dropdown, menuItem } = useDropdownTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useClickOutside(containerRef, handleClose, isOpen);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      // Estimate dropdown height (max 320px or less)
      const estimatedHeight = Math.min(320, (bookmark.children?.length || 1) * 36 + 12);

      // Open upward if not enough space below but enough space above
      setOpenUpward(spaceBelow < estimatedHeight && spaceAbove > spaceBelow);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`flex items-center gap-1.5 rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white ${iconOnly ? 'p-2' : 'px-3 py-1.5'}`}
        title={bookmark.title}
      >
        <Folder size={14} className="text-amber-400/70" />
        {!iconOnly && <span className="max-w-20 truncate text-sm">{bookmark.title}</span>}
        {!iconOnly && <ChevronDown size={12} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 min-w-44 max-w-64 max-h-80 overflow-y-auto scrollbar-thin rounded-lg ${dropdown} py-1.5 shadow-xl ${
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
          style={{ animation: openUpward ? 'fadeInUp 150ms ease-out' : 'fadeIn 150ms ease-out' }}
        >
          {bookmark.children && bookmark.children.length > 0 ? (
            bookmark.children.slice(0, 15).map((child) =>
              child.isFolder ? (
                <NestedFolder key={child.id} bookmark={child} onClose={handleClose} />
              ) : (
                <a
                  key={child.id}
                  href={child.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${menuItem}`}
                  onClick={handleClose}
                >
                  {child.favicon ? (
                    <img
                      src={child.favicon}
                      alt=""
                      className="h-4 w-4 rounded flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <ExternalLink size={14} className="opacity-40 flex-shrink-0" />
                  )}
                  <span className="truncate">{child.title}</span>
                </a>
              )
            )
          ) : (
            <div className="px-3 py-2 text-xs opacity-40">Empty folder</div>
          )}
        </div>
      )}
    </div>
  );
}

export function Bookmarks() {
  const {
    bookmarks,
    isLoading,
    hasPermission,
    isApiAvailable,
    loadBookmarks,
    requestPermission,
    refreshBookmarks,
  } = useBookmarksStore();

  const { bookmarkDisplayMode, setBookmarkDisplayMode } = useSettingsStore();
  const { dropdown, menuItem, menuItemActive, sectionLabel } = useDropdownTheme();
  const [showConfig, setShowConfig] = useState(false);
  const [configPosition, setConfigPosition] = useState({ top: 0, left: 0 });
  const configButtonRef = useRef<HTMLButtonElement>(null);
  const configPopupRef = useRef<HTMLDivElement>(null);

  const iconOnly = bookmarkDisplayMode === 'icon';

  const handleCloseConfig = useCallback(() => setShowConfig(false), []);

  useClickOutside([configButtonRef, configPopupRef], handleCloseConfig, showConfig);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleConfigToggle = () => {
    if (!showConfig && configButtonRef.current) {
      const rect = configButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedHeight = 100;

      setConfigPosition({
        top: spaceBelow < estimatedHeight ? rect.top - estimatedHeight - 8 : rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 180),
      });
    }
    setShowConfig(!showConfig);
  };

  // Not in Chrome extension environment
  if (!isApiAvailable) {
    return null;
  }

  // Permission not granted
  if (!hasPermission && !isLoading) {
    return (
      <button
        onClick={requestPermission}
        className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm text-white/60 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white/80"
      >
        <Bookmark size={16} />
        <span>Enable bookmarks</span>
      </button>
    );
  }

  // Loading or no bookmarks
  if (isLoading && bookmarks.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-white/50 backdrop-blur-sm">
        <RefreshCw size={16} className="animate-spin" />
        <span className="text-sm">Loading bookmarks...</span>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return null;
  }

  return (
    <>
      <div className="group relative">
        {/* Bookmarks bar */}
        <div className="flex items-center gap-1 rounded-full bg-black/20 px-2 py-1.5 backdrop-blur-sm">
          {bookmarks.slice(0, iconOnly ? 12 : 8).map((bookmark) =>
            bookmark.isFolder ? (
              <BookmarkFolder key={bookmark.id} bookmark={bookmark} iconOnly={iconOnly} />
            ) : (
              <a
                key={bookmark.id}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white ${iconOnly ? 'p-2' : 'px-3 py-1.5'}`}
                title={bookmark.title}
              >
                {bookmark.favicon ? (
                  <img
                    src={bookmark.favicon}
                    alt=""
                    className="h-4 w-4 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ExternalLink size={14} className="text-white/40" />
                )}
                {!iconOnly && <span className="max-w-20 truncate text-sm">{bookmark.title}</span>}
              </a>
            )
          )}

          {/* Refresh button - inside bar */}
          <button
            onClick={refreshBookmarks}
            disabled={isLoading}
            className="rounded-full p-2 text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white/60 group-hover:opacity-100 disabled:opacity-50"
            aria-label="Refresh bookmarks"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Config button - absolute positioned on right */}
        <button
          ref={configButtonRef}
          onClick={handleConfigToggle}
          className={`absolute -right-8 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-all hover:bg-white/10 ${
            showConfig
              ? 'opacity-100 bg-white/20 text-white'
              : 'opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/60'
          }`}
          aria-label="Bookmark settings"
          title="Bookmark display settings"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Config popup */}
      {showConfig && createPortal(
        <div
          ref={configPopupRef}
          className={`fixed z-[100] w-44 rounded-lg ${dropdown} py-2 shadow-xl`}
          style={{ top: configPosition.top, left: configPosition.left }}
        >
          <p className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${sectionLabel}`}>
            Display
          </p>
          <button
            onClick={() => {
              setBookmarkDisplayMode('icon');
              setShowConfig(false);
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
              iconOnly ? menuItemActive : menuItem
            }`}
          >
            <Image size={14} />
            <span>Icon only</span>
          </button>
          <button
            onClick={() => {
              setBookmarkDisplayMode('icon-text');
              setShowConfig(false);
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
              !iconOnly ? menuItemActive : menuItem
            }`}
          >
            <Type size={14} />
            <span>Icon with text</span>
          </button>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInSide {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
