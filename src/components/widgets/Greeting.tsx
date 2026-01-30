import { useState, useEffect } from 'react';
import { MoreHorizontal, Heart, Pin, SkipForward, EyeOff, Settings, Sparkles, Edit3 } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMantraStore } from '@/stores/mantraStore';

export function Greeting() {
  const { userName } = useSettingsStore();
  const {
    showMantra,
    currentMantra,
    pinnedMantraId,
    favoriteIds,
    setShowMantra,
    loadMantra,
    skipMantra,
    pinCurrentMantra,
    unpinMantra,
    toggleFavorite,
    hideMantra,
  } = useMantraStore();

  const [greeting, setGreeting] = useState(getGreeting());
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Update greeting every minute in case hour changes
    const timer = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Load mantra when showing mantra mode
  useEffect(() => {
    if (showMantra) {
      loadMantra();
    }
  }, [showMantra, loadMantra]);

  const handleShowMantra = () => {
    setShowMantra(true);
    setShowMenu(false);
  };

  const handleShowGreeting = () => {
    setShowMantra(false);
    setShowMenu(false);
  };

  const handleEditName = () => {
    // Dispatch custom event to open settings modal to general section
    window.dispatchEvent(new CustomEvent('openSettings', { detail: { section: 'general' } }));
    setShowMenu(false);
  };

  const handleFavorite = () => {
    if (currentMantra) {
      toggleFavorite(currentMantra.id);
    }
    setShowMenu(false);
  };

  const handlePin = () => {
    if (currentMantra) {
      if (pinnedMantraId === currentMantra.id) {
        unpinMantra();
      } else {
        pinCurrentMantra();
      }
    }
    setShowMenu(false);
  };

  const handleSkip = () => {
    skipMantra();
    setShowMenu(false);
  };

  const handleHide = () => {
    if (currentMantra) {
      hideMantra(currentMantra.id);
    }
    setShowMenu(false);
  };

  const handleMantraSettings = () => {
    // Dispatch custom event to open settings modal to mantra section
    window.dispatchEvent(new CustomEvent('openSettings', { detail: { section: 'mantra' } }));
    setShowMenu(false);
  };

  const isFavorite = currentMantra ? favoriteIds.includes(currentMantra.id) : false;
  const isPinned = currentMantra ? pinnedMantraId === currentMantra.id : false;

  return (
    <div className="relative group flex items-center justify-center gap-2">
      {/* Content: Mantra text OR Greeting text */}
      {showMantra && currentMantra ? (
        <p className="text-3xl font-light text-white/90 text-shadow max-w-2xl text-center">
          {currentMantra.text}
        </p>
      ) : (
        <p className="text-3xl font-light text-white/90 text-shadow">
          {greeting}, {userName || 'there'}
        </p>
      )}

      {/* Triple-dot button - visible on hover */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`rounded-full p-0.5 transition-all hover:bg-white/10 hover:text-white/60 ${
            showMenu ? 'opacity-100 text-white/60' : 'opacity-0 group-hover:opacity-100 text-white/40'
          }`}
          aria-label="Greeting options"
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div
              className="absolute left-0 top-full mt-1 z-50 w-44 rounded-lg bg-white py-1.5 shadow-xl"
              style={{ animation: 'fadeIn 150ms ease-out' }}
            >
              {showMantra ? (
                // Mantra mode menu
                <>
                  <button
                    onClick={handleFavorite}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Heart size={14} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
                    <span>{isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                  </button>
                  <button
                    onClick={handlePin}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pin size={14} className={isPinned ? 'fill-blue-500 text-blue-500' : ''} />
                    <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>
                  <button
                    onClick={handleSkip}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <SkipForward size={14} />
                    <span>Skip mantra</span>
                  </button>
                  <button
                    onClick={handleHide}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <EyeOff size={14} />
                    <span>Don't show again</span>
                  </button>
                  <div className="my-1.5 border-t border-gray-100" />
                  <button
                    onClick={handleShowGreeting}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 size={14} />
                    <span>Show greeting</span>
                  </button>
                  <button
                    onClick={handleMantraSettings}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={14} />
                    <span>Mantra settings</span>
                  </button>
                </>
              ) : (
                // Greeting mode menu
                <>
                  <button
                    onClick={handleShowMantra}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Sparkles size={14} />
                    <span>Show today's mantra</span>
                  </button>
                  <button
                    onClick={handleEditName}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 size={14} />
                    <span>Edit name</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
}
