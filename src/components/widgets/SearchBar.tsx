import { useState, useRef } from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { AdaptiveDropdown, DropdownItem, DropdownLabel, DropdownContainer } from '@/components/ui/Dropdown';

// Search engine configurations with icons
const SEARCH_ENGINES = {
  google: {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    placeholder: 'Search',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  bing: {
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    placeholder: 'Search',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="#00897B" d="M5 3v16.5l4.5 2.5 8-4.5v-5L10 9V3L5 3zm4.5 11.5l4 2.25-4 2.25v-4.5z"/>
      </svg>
    ),
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    placeholder: 'Search',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18">
        <circle fill="#DE5833" cx="12" cy="12" r="10"/>
        <circle fill="#FFF" cx="9" cy="10" r="2"/>
        <circle fill="#FFF" cx="15" cy="10" r="2"/>
        <circle fill="#333" cx="9" cy="10" r="1"/>
        <circle fill="#333" cx="15" cy="10" r="1"/>
        <path fill="#FFF" d="M8 14h8c0 2.2-1.8 4-4 4s-4-1.8-4-4z"/>
      </svg>
    ),
  },
  ecosia: {
    name: 'Ecosia',
    url: 'https://www.ecosia.org/search?q=',
    placeholder: 'Search',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18">
        <circle fill="#36ACAA" cx="12" cy="12" r="10"/>
        <path fill="white" d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
      </svg>
    ),
  },
} as const;

export function SearchBar() {
  const { searchProvider, setSearchProvider } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const engine = SEARCH_ENGINES[searchProvider];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      window.location.href = `${engine.url}${encodeURIComponent(trimmedQuery)}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative group">
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center gap-2.5 rounded-full border bg-white/10 px-3 py-2.5 backdrop-blur-sm transition-all ${
            isFocused
              ? 'border-white/30 bg-white/15 shadow-lg'
              : 'border-white/10 hover:border-white/20 hover:bg-white/12'
          }`}
        >
          {/* Search icon on left */}
          <Search
            size={16}
            className={`flex-shrink-0 transition-colors ${
              isFocused ? 'text-white/70' : 'text-white/50'
            }`}
          />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={engine.placeholder}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/50 outline-none"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Search engine icon on right (inside bar) */}
          <div className="flex-shrink-0 scale-90">{engine.icon}</div>
        </div>
      </form>

      {/* Three dots menu button - absolute positioned on right */}
      <DropdownContainer
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        className="absolute -right-8 top-1/2 -translate-y-1/2"
      >
        <button
          ref={menuButtonRef}
          onClick={() => setShowMenu(!showMenu)}
          className={`rounded-full p-1.5 transition-all hover:bg-white/10 hover:text-white/60 ${
            showMenu ? 'opacity-100 text-white/60' : 'opacity-0 group-hover:opacity-100 text-white/40'
          }`}
          aria-label="Search settings"
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Dropdown menu */}
        <AdaptiveDropdown triggerRef={menuButtonRef} isOpen={showMenu} width="w-36" preferredPosition="right">
          <DropdownLabel>Search with</DropdownLabel>
          {(['google', 'bing', 'duckduckgo', 'ecosia'] as const).map((eng) => (
            <DropdownItem
              key={eng}
              onClick={() => {
                setSearchProvider(eng);
                setShowMenu(false);
              }}
              active={searchProvider === eng}
            >
              <span className="scale-75">{SEARCH_ENGINES[eng].icon}</span>
              <span>{SEARCH_ENGINES[eng].name}</span>
            </DropdownItem>
          ))}
        </AdaptiveDropdown>
      </DropdownContainer>
    </div>
  );
}
