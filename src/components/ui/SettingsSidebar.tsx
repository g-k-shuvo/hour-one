import { useState, useEffect } from 'react';
import { Settings, X, User, HelpCircle, Info, Heart, Eye, Sun, Moon, Monitor, Check } from 'lucide-react';
import { useSettingsStore, ACCENT_COLORS, type ThemeMode, type AccentColor } from '@/stores/settingsStore';
import { useMantraStore } from '@/stores/mantraStore';
import { useSoundscapeStore, SOUNDSCAPES } from '@/stores/soundscapeStore';
import { useTabStashStore } from '@/stores/tabStashStore';
import { useWorldClocksStore } from '@/stores/worldClocksStore';
import { useCountdownStore } from '@/stores/countdownStore';
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
  | 'tasks'
  | 'soundscapes'
  | 'tabstash'
  | 'worldclocks'
  | 'countdowns';

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

  const {
    enabled: soundscapesEnabled,
    setEnabled: setSoundscapesEnabled,
    volume: soundscapeVolume,
    setVolume: setSoundscapeVolume,
    currentSoundscapeId,
    setCurrentSoundscape,
  } = useSoundscapeStore();

  const {
    sessions: tabSessions,
    hasPermission: tabStashPermission,
    isApiAvailable: tabStashApiAvailable,
    requestPermission: requestTabStashPermission,
  } = useTabStashStore();

  const {
    clocks: worldClocks,
  } = useWorldClocksStore();

  const {
    timers: countdownTimers,
  } = useCountdownStore();

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

      case 'soundscapes':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Soundscapes</h3>
            <p className="text-sm text-theme-secondary mb-6">Ambient sounds for focus</p>

            <div className="divide-y divide-white/10">
              <Toggle
                enabled={widgets.soundscapes}
                onChange={() => toggleWidget('soundscapes')}
                title="Show soundscapes"
                description="Display soundscapes control in dashboard"
              />
              <Toggle
                enabled={soundscapesEnabled}
                onChange={() => setSoundscapesEnabled(!soundscapesEnabled)}
                title="Enable audio"
                description="Allow ambient sound playback"
              />
            </div>

            {soundscapesEnabled && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-theme-primary mb-3">
                  Volume
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={soundscapeVolume}
                    onChange={(e) => setSoundscapeVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-sm text-theme-secondary w-12 text-right">
                    {Math.round(soundscapeVolume * 100)}%
                  </span>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-theme-primary mb-3">
                    Available Sounds
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SOUNDSCAPES.map((sound) => (
                      <button
                        key={sound.id}
                        onClick={() => setCurrentSoundscape(currentSoundscapeId === sound.id ? null : sound.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                          currentSoundscapeId === sound.id
                            ? 'bg-accent/20 ring-1 ring-accent'
                            : 'bg-theme-secondary hover:bg-theme-tertiary'
                        }`}
                      >
                        <span className="text-lg">{sound.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-theme-primary truncate">{sound.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'tabstash':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Tab Stash</h3>
            <p className="text-sm text-theme-secondary mb-6">Save and restore browser sessions</p>

            <div className="divide-y divide-white/10">
              <Toggle
                enabled={widgets.tabStash}
                onChange={() => toggleWidget('tabStash')}
                title="Show Tab Stash"
                description="Display Tab Stash button in dashboard"
              />
            </div>

            {tabStashApiAvailable && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-theme-primary">
                    Permission Status
                  </label>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tabStashPermission
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {tabStashPermission ? 'Granted' : 'Not granted'}
                  </span>
                </div>

                {!tabStashPermission && (
                  <button
                    onClick={requestTabStashPermission}
                    className="w-full py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    Enable Tab Access
                  </button>
                )}

                {tabStashPermission && (
                  <div className="mt-4">
                    <p className="text-sm text-theme-secondary">
                      {tabSessions.length} saved session{tabSessions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!tabStashApiAvailable && (
              <div className="mt-6 p-3 bg-theme-secondary rounded-lg">
                <p className="text-sm text-theme-muted">
                  Tab Stash is only available when running as a Chrome extension.
                </p>
              </div>
            )}
          </div>
        );

      case 'worldclocks':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">World Clocks</h3>
            <p className="text-sm text-theme-secondary mb-6">Display multiple timezone clocks</p>

            <div className="divide-y divide-white/10">
              <Toggle
                enabled={widgets.worldClocks}
                onChange={() => toggleWidget('worldClocks')}
                title="Show World Clocks"
                description="Display world clocks on dashboard"
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-theme-primary">
                  Active Clocks
                </label>
                <span className="text-xs text-theme-muted">
                  {worldClocks.length} clock{worldClocks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {worldClocks.length === 0 ? (
                <p className="text-sm text-theme-muted">
                  No world clocks added yet. Click the globe icon on your dashboard to add clocks.
                </p>
              ) : (
                <div className="space-y-2">
                  {worldClocks.map((clock) => (
                    <div
                      key={clock.id}
                      className="flex items-center justify-between p-2 bg-theme-secondary rounded-lg"
                    >
                      <div>
                        <p className="text-sm text-theme-primary">{clock.label}</p>
                        <p className="text-xs text-theme-muted">{clock.timezone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'countdowns':
        return (
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Countdowns</h3>
            <p className="text-sm text-theme-secondary mb-6">Event and deadline countdowns</p>

            <div className="divide-y divide-white/10">
              <Toggle
                enabled={widgets.countdowns}
                onChange={() => toggleWidget('countdowns')}
                title="Show Countdowns"
                description="Display countdown timers on dashboard"
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-theme-primary">
                  Active Countdowns
                </label>
                <span className="text-xs text-theme-muted">
                  {countdownTimers.length} timer{countdownTimers.length !== 1 ? 's' : ''}
                </span>
              </div>

              {countdownTimers.length === 0 ? (
                <p className="text-sm text-theme-muted">
                  No countdown timers yet. Click the timer icon on your dashboard to add one.
                </p>
              ) : (
                <div className="space-y-2">
                  {countdownTimers.map((timer) => (
                    <div
                      key={timer.id}
                      className="flex items-center justify-between p-2 bg-theme-secondary rounded-lg"
                      style={{ borderLeft: `3px solid ${timer.color}` }}
                    >
                      <div>
                        <p className="text-sm text-theme-primary">{timer.title}</p>
                        <p className="text-xs text-theme-muted">
                          {new Date(timer.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                    <NavItem
                      label="Soundscapes"
                      active={activeSection === 'soundscapes'}
                      onClick={() => setActiveSection('soundscapes')}
                    />
                    <NavItem
                      label="Tab Stash"
                      active={activeSection === 'tabstash'}
                      onClick={() => setActiveSection('tabstash')}
                    />
                    <NavItem
                      label="World Clocks"
                      active={activeSection === 'worldclocks'}
                      onClick={() => setActiveSection('worldclocks')}
                    />
                    <NavItem
                      label="Countdowns"
                      active={activeSection === 'countdowns'}
                      onClick={() => setActiveSection('countdowns')}
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
