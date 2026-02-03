import { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Heart, Pin, SkipForward, EyeOff, Settings, Sparkles, Edit3 } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMantraStore } from '@/stores/mantraStore';
import { AdaptiveDropdown, DropdownItem, DropdownDivider, DropdownContainer } from '@/components/ui/Dropdown';

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
    <div className="relative group mt-4">
      {/* Content: Mantra text OR Greeting text - centered */}
      <div className="text-center">
        {showMantra && currentMantra ? (
          <p className="text-3xl font-light text-white/90 text-shadow max-w-2xl mx-auto">
            {currentMantra.text}
          </p>
        ) : (
          <p className="text-3xl font-light text-white/90 text-shadow">
            {greeting}, {userName || 'there'}
          </p>
        )}
      </div>

      {/* Triple-dot button - absolute positioned on right */}
      <DropdownContainer
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        className="absolute -right-8 top-1/2 -translate-y-1/2"
      >
        <button
          ref={menuButtonRef}
          onClick={() => setShowMenu(!showMenu)}
          className={`rounded-full p-1 transition-all hover:bg-white/10 hover:text-white/60 ${
            showMenu ? 'opacity-100 text-white/60' : 'opacity-0 group-hover:opacity-100 text-white/40'
          }`}
          aria-label="Greeting options"
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Dropdown menu - rendered via portal */}
        <AdaptiveDropdown triggerRef={menuButtonRef} isOpen={showMenu} preferredPosition="left" usePortal>
          {showMantra ? (
            // Mantra mode menu
            <>
              <DropdownItem onClick={handleFavorite}>
                <Heart size={14} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
                <span>{isFavorite ? 'Unfavorite' : 'Favorite'}</span>
              </DropdownItem>
              <DropdownItem onClick={handlePin}>
                <Pin size={14} className={isPinned ? 'fill-blue-500 text-blue-500' : ''} />
                <span>{isPinned ? 'Unpin' : 'Pin'}</span>
              </DropdownItem>
              <DropdownItem onClick={handleSkip}>
                <SkipForward size={14} />
                <span>Skip mantra</span>
              </DropdownItem>
              <DropdownItem onClick={handleHide}>
                <EyeOff size={14} />
                <span>Don't show again</span>
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem onClick={handleShowGreeting}>
                <Edit3 size={14} />
                <span>Show greeting</span>
              </DropdownItem>
              <DropdownItem onClick={handleMantraSettings}>
                <Settings size={14} />
                <span>Mantra settings</span>
              </DropdownItem>
            </>
          ) : (
            // Greeting mode menu
            <>
              <DropdownItem onClick={handleShowMantra}>
                <Sparkles size={14} />
                <span>Show today's mantra</span>
              </DropdownItem>
              <DropdownItem onClick={handleEditName}>
                <Edit3 size={14} />
                <span>Edit name</span>
              </DropdownItem>
            </>
          )}
        </AdaptiveDropdown>
      </DropdownContainer>
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
