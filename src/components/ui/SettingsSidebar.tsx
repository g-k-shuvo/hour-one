import { useState, useEffect } from 'react';
import { Settings, X, User, HelpCircle, Info, Heart, Eye, Sun, Moon, Monitor, Check } from 'lucide-react';
import { useSettingsStore, ACCENT_COLORS, type ThemeMode, type AccentColor } from '@/stores/settingsStore';
import { useMantraStore } from '@/stores/mantraStore';
import { getMantraById, getAllMantras } from '@/services/mantrasService';
import { Toggle } from './Toggle';
import { IconButton } from './IconButton';

// Task integrations (non-functional placeholders)
const TASK_INTEGRATIONS = [
  { name: 'Asana', icon: '/icons/asana.svg' },
  { name: 'Basecamp', icon: '/icons/basecamp.svg' },
  { name: 'ClickUp', icon: '/icons/clickup.svg' },
  { name: 'GitHub', icon: '/icons/github.svg' },
  { name: 'Google Tasks', icon: '/icons/google-tasks.svg' },
  { name: 'MS To Do', icon: '/icons/ms-todo.svg' },
  { name: 'Todoist', icon: '/icons/todoist.svg' },
  { name: 'Trello', icon: '/icons/trello.svg' },
];

type SettingsSection =
  | 'general'
  | 'theme'
  | 'clock'
  | 'photos'
  | 'quotes'
  | 'mantra'
  | 'weather'
  | 'search'
  | 'links'
  | 'tasks';

interface NavItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        nav-item w-full text-left px-4 py-2 text-sm rounded-lg transition-colors
        ${active
          ? 'active bg-theme-tertiary text-theme-primary font-medium'
          : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
        }
      `}
    >
      {label}
    </button>
  );
}

export function SettingsSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const {
    userName,
    setUserName,
    timeFormat,
    setTimeFormat,
    temperatureUnit,
    setTemperatureUnit,
    searchProvider,
    setSearchProvider,
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
    widgets,
    toggleWidget,
    topTaskInCenter,
    setTopTaskInCenter,
  } = useSettingsStore();

  const {
    showMantra,
    setShowMantra,
    favoriteIds,
    hiddenIds,
    toggleFavorite,
    unhideMantra,
  } = useMantraStore();

  // Listen for openSettings event from other components
  useEffect(() => {
    const handleOpenSettings = (event: CustomEvent<{ section?: SettingsSection }>) => {
      setIsOpen(true);
      if (event.detail?.section) {
        setActiveSection(event.detail.section);
      }
    };

    window.addEventListener('openSettings', handleOpenSettings as EventListener);
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings as EventListener);
    };
  }, []);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">General</h3>
            <p className="text-sm text-theme-secondary mb-6">Customize your dashboard</p>

            <div className="mb-6">
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-theme-primary mb-2"
              >
                Your Name
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border border-theme bg-theme-primary px-4 py-2 text-theme-primary placeholder-theme-muted outline-none transition-colors focus:border-accent focus:ring-1 ring-accent"
              />
            </div>

            <div className="border-t border-theme pt-4">
              <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-3">Apps</p>
              <div className="divide-y divide-white/10">
                <Toggle
                  enabled={widgets.clock}
                  onChange={() => toggleWidget('clock')}
                  title="Clock"
                  description="Display time on screen"
                />
                <Toggle
                  enabled={widgets.greeting}
                  onChange={() => toggleWidget('greeting')}
                  title="Greeting"
                  description="Personalized greeting message"
                />
                <Toggle
                  enabled={widgets.focus}
                  onChange={() => toggleWidget('focus')}
                  title="Focus"
                  description="Your main daily focus"
                />
                <Toggle
                  enabled={widgets.quote}
                  onChange={() => toggleWidget('quote')}
                  title="Quote"
                  description="Daily inspirational quotes"
                />
                <Toggle
                  enabled={widgets.search}
                  onChange={() => toggleWidget('search')}
                  title="Search"
                  description="Quick search bar"
                />
              </div>
            </div>
          </div>
        );

      case 'theme':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Theme</h3>
            <p className="text-sm text-theme-secondary mb-6">Customize the look and feel</p>

            {/* Theme Mode */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-theme-primary mb-3">
                Appearance
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    themeMode === 'light'
                      ? 'border-accent bg-accent/10'
                      : 'border-theme hover:border-theme-light'
                  }`}
                >
                  <Sun size={20} className={themeMode === 'light' ? 'text-accent' : 'text-theme-secondary'} />
                  <span className={`text-xs font-medium ${themeMode === 'light' ? 'text-accent' : 'text-theme-secondary'}`}>
                    Light
                  </span>
                </button>
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    themeMode === 'dark'
                      ? 'border-accent bg-accent/10'
                      : 'border-theme hover:border-theme-light'
                  }`}
                >
                  <Moon size={20} className={themeMode === 'dark' ? 'text-accent' : 'text-theme-secondary'} />
                  <span className={`text-xs font-medium ${themeMode === 'dark' ? 'text-accent' : 'text-theme-secondary'}`}>
                    Dark
                  </span>
                </button>
                <button
                  onClick={() => setThemeMode('system')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    themeMode === 'system'
                      ? 'border-accent bg-accent/10'
                      : 'border-theme hover:border-theme-light'
                  }`}
                >
                  <Monitor size={20} className={themeMode === 'system' ? 'text-accent' : 'text-theme-secondary'} />
                  <span className={`text-xs font-medium ${themeMode === 'system' ? 'text-accent' : 'text-theme-secondary'}`}>
                    System
                  </span>
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-3">
                Accent Color
              </label>
              <div className="grid grid-cols-4 gap-3">
                {(Object.entries(ACCENT_COLORS) as [AccentColor, { name: string; value: string }][]).map(
                  ([key, { name, value }]) => (
                    <button
                      key={key}
                      onClick={() => setAccentColor(key)}
                      className={`group relative flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                        accentColor === key ? 'ring-2 ring-offset-2' : ''
                      }`}
                      style={{
                        ringColor: accentColor === key ? value : undefined,
                      }}
                      title={name}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: value }}
                      >
                        {accentColor === key && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <span className="text-xs text-theme-secondary">{name}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case 'clock':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Clock</h3>
            <p className="text-sm text-theme-secondary mb-6">Time display settings</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Time Format
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeFormat('12h')}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      timeFormat === '12h'
                        ? 'bg-accent text-white'
                        : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
                    }`}
                  >
                    12 Hour
                  </button>
                  <button
                    onClick={() => setTimeFormat('24h')}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      timeFormat === '24h'
                        ? 'bg-accent text-white'
                        : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
                    }`}
                  >
                    24 Hour
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'quotes':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Quotes</h3>
            <p className="text-sm text-theme-secondary mb-6">Daily inspirational quotes</p>

            <div className="divide-y divide-white/10">
              <Toggle
                enabled={widgets.quote}
                onChange={() => toggleWidget('quote')}
                title="Show quotes"
                description="Display quotes on dashboard"
              />
            </div>
          </div>
        );

      case 'mantra':
        return <MantraSettings
          showMantra={showMantra}
          setShowMantra={setShowMantra}
          favoriteIds={favoriteIds}
          hiddenIds={hiddenIds}
          toggleFavorite={toggleFavorite}
          unhideMantra={unhideMantra}
        />;

      case 'weather':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Weather</h3>
            <p className="text-sm text-theme-secondary mb-6">Weather display settings</p>

            <div className="divide-y divide-white/10">
              <Toggle
                enabled={widgets.weather}
                onChange={() => toggleWidget('weather')}
                title="Show weather"
                description="Display weather information"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Temperature Unit
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTemperatureUnit('celsius')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    temperatureUnit === 'celsius'
                      ? 'bg-accent text-white'
                      : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
                  }`}
                >
                  Celsius (°C)
                </button>
                <button
                  onClick={() => setTemperatureUnit('fahrenheit')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    temperatureUnit === 'fahrenheit'
                      ? 'bg-accent text-white'
                      : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
                  }`}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>
          </div>
        );

      case 'search':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Search</h3>
            <p className="text-sm text-theme-secondary mb-6">Search bar settings</p>

            <div className="divide-y divide-white/10">
              <Toggle
                enabled={widgets.search}
                onChange={() => toggleWidget('search')}
                title="Show search bar"
                description="Display search on dashboard"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Search Engine
              </label>
              <select
                value={searchProvider}
                onChange={(e) =>
                  setSearchProvider(
                    e.target.value as 'google' | 'bing' | 'duckduckgo' | 'ecosia'
                  )
                }
                className="w-full rounded-lg border border-theme bg-theme-primary px-4 py-2 text-theme-primary outline-none transition-colors focus:border-accent focus:ring-1 ring-accent"
              >
                <option value="google">Google</option>
                <option value="bing">Bing</option>
                <option value="duckduckgo">DuckDuckGo</option>
                <option value="ecosia">Ecosia</option>
              </select>
            </div>
          </div>
        );

      case 'links':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Links & Bookmarks</h3>
            <p className="text-sm text-theme-secondary mb-6">Manage your links and bookmarks</p>

            <div className="divide-y divide-white/10">
              <Toggle
                enabled={widgets.quickLinks}
                onChange={() => toggleWidget('quickLinks')}
                title="Quick Links"
                description="Custom links panel with pinning"
              />
              <Toggle
                enabled={widgets.bookmarks}
                onChange={() => toggleWidget('bookmarks')}
                title="Bookmarks Bar"
                description="Chrome bookmarks bar shortcuts"
              />
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Tasks</h3>
            <p className="text-sm text-theme-secondary mb-6">Todo list settings</p>

            <div className="divide-y divide-white/10">
              <Toggle
                enabled={widgets.todos}
                onChange={() => toggleWidget('todos')}
                title="Show tasks"
                description="Display todo list panel"
              />
              <Toggle
                enabled={topTaskInCenter}
                onChange={() => setTopTaskInCenter(!topTaskInCenter)}
                title="Top task in center"
                description="Show first Today task as daily focus"
              />
            </div>

            {/* Integrations Section */}
            <div className="mt-6 pt-4 border-t border-theme">
              <h4 className="text-sm font-medium text-theme-primary mb-2">Integrations</h4>
              <p className="text-xs text-theme-muted mb-4">Coming soon</p>

              <div className="grid grid-cols-4 gap-3">
                {TASK_INTEGRATIONS.map((integration) => (
                  <button
                    key={integration.name}
                    disabled
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-theme-secondary opacity-50 cursor-not-allowed"
                    title={`${integration.name} (Coming soon)`}
                  >
                    <img
                      src={integration.icon}
                      alt={integration.name}
                      className="w-6 h-6"
                    />
                    <span className="text-[10px] text-theme-secondary">{integration.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'photos':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Photos</h3>
            <p className="text-sm text-theme-secondary mb-6">Background photo settings</p>

            <p className="text-sm text-theme-secondary">
              Background photos change automatically each day.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Settings Modal with Fade Animation */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
          style={{ animation: 'fadeIn 200ms ease-out' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className="settings-modal relative z-10 w-full max-w-3xl mx-4 h-[600px] max-h-[80vh] rounded-2xl bg-theme-primary shadow-2xl overflow-hidden"
            style={{ animation: 'scaleIn 200ms ease-out' }}
          >
            <div className="flex h-full">
              {/* Left Sidebar Navigation */}
              <div className="settings-sidebar w-48 bg-theme-secondary border-r border-theme flex flex-col">
                <div className="p-4 flex-1">
                  <nav className="space-y-1">
                    <NavItem
                      label="General"
                      active={activeSection === 'general'}
                      onClick={() => setActiveSection('general')}
                    />
                    <NavItem
                      label="Theme"
                      active={activeSection === 'theme'}
                      onClick={() => setActiveSection('theme')}
                    />
                    <NavItem
                      label="Clock"
                      active={activeSection === 'clock'}
                      onClick={() => setActiveSection('clock')}
                    />
                    <NavItem
                      label="Photos"
                      active={activeSection === 'photos'}
                      onClick={() => setActiveSection('photos')}
                    />
                    <NavItem
                      label="Quotes"
                      active={activeSection === 'quotes'}
                      onClick={() => setActiveSection('quotes')}
                    />
                    <NavItem
                      label="Mantra"
                      active={activeSection === 'mantra'}
                      onClick={() => setActiveSection('mantra')}
                    />
                    <NavItem
                      label="Weather"
                      active={activeSection === 'weather'}
                      onClick={() => setActiveSection('weather')}
                    />
                    <NavItem
                      label="Search"
                      active={activeSection === 'search'}
                      onClick={() => setActiveSection('search')}
                    />
                    <NavItem
                      label="Links"
                      active={activeSection === 'links'}
                      onClick={() => setActiveSection('links')}
                    />
                    <NavItem
                      label="Tasks"
                      active={activeSection === 'tasks'}
                      onClick={() => setActiveSection('tasks')}
                    />
                  </nav>

                  <div className="mt-6 pt-6 border-t border-theme space-y-1">
                    <NavItem
                      label="Help"
                      active={false}
                      onClick={() => {}}
                    />
                    <NavItem
                      label="About"
                      active={false}
                      onClick={() => {}}
                    />
                  </div>
                </div>

                {/* User section at bottom */}
                <div className="p-4 border-t border-theme">
                  <button className="flex items-center gap-2 text-sm text-theme-secondary hover:text-theme-primary transition-colors">
                    <User size={16} />
                    <span>{userName || 'Guest'}</span>
                  </button>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 flex flex-col">
                {/* Header with close button */}
                <div className="flex justify-end p-4 border-b border-theme">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 text-theme-muted transition-colors hover:bg-theme-secondary hover:text-theme-secondary"
                    aria-label="Close settings"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Section Content */}
                <div className="flex-1 overflow-y-auto scrollbar-theme p-6">
                  {renderSectionContent()}
                </div>

                {/* Footer */}
                <div className="border-t border-theme p-4">
                  <p className="text-center text-xs text-theme-muted">
                    Hour One v0.1.0
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

// MantraSettings component
interface MantraSettingsProps {
  showMantra: boolean;
  setShowMantra: (show: boolean) => void;
  favoriteIds: string[];
  hiddenIds: string[];
  toggleFavorite: (id: string) => void;
  unhideMantra: (id: string) => void;
}

function MantraSettings({
  showMantra,
  setShowMantra,
  favoriteIds,
  hiddenIds,
  toggleFavorite,
  unhideMantra,
}: MantraSettingsProps) {
  const allMantras = getAllMantras();
  const favoriteMantras = favoriteIds
    .map(id => getMantraById(id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  const hiddenMantras = hiddenIds
    .map(id => getMantraById(id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  return (
    <div>
      <h3 className="text-lg font-semibold text-theme-primary mb-1">Mantra</h3>
      <p className="text-sm text-theme-secondary mb-6">Daily inspirational mantras</p>

      <div className="divide-y divide-white/10">
        <Toggle
          enabled={showMantra}
          onChange={() => setShowMantra(!showMantra)}
          title="Show mantra"
          description="Display mantra instead of greeting"
        />
      </div>

      {/* Favorites section */}
      {favoriteMantras.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-theme-primary mb-3 flex items-center gap-2">
            <Heart size={14} className="text-red-500" />
            Favorites
          </h4>
          <div className="space-y-2">
            {favoriteMantras.map(mantra => (
              <div
                key={mantra.id}
                className="flex items-center justify-between p-2 bg-theme-secondary rounded-lg"
              >
                <p className="text-sm text-theme-primary flex-1 pr-2">{mantra.text}</p>
                <button
                  onClick={() => toggleFavorite(mantra.id)}
                  className="text-xs text-theme-muted hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden section */}
      {hiddenMantras.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-theme-primary mb-3 flex items-center gap-2">
            <Eye size={14} className="text-theme-muted" />
            Hidden Mantras
          </h4>
          <div className="space-y-2">
            {hiddenMantras.map(mantra => (
              <div
                key={mantra.id}
                className="flex items-center justify-between p-2 bg-theme-secondary rounded-lg"
              >
                <p className="text-sm text-theme-muted flex-1 pr-2">{mantra.text}</p>
                <button
                  onClick={() => unhideMantra(mantra.id)}
                  className="text-xs text-theme-muted hover:text-accent transition-colors"
                >
                  Unhide
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
