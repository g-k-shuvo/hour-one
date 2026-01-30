import { useState, useEffect } from 'react';
import { Settings, X, User, HelpCircle, Info, Heart, Eye } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMantraStore } from '@/stores/mantraStore';
import { getMantraById, getAllMantras } from '@/services/mantrasService';
import { Toggle } from './Toggle';
import { IconButton } from './IconButton';

type SettingsSection =
  | 'general'
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
        w-full text-left px-4 py-2 text-sm rounded-lg transition-colors
        ${active
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
    widgets,
    toggleWidget,
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">General</h3>
            <p className="text-sm text-gray-500 mb-6">Customize your dashboard</p>

            <div className="mb-6">
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Name
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Apps</p>
              <div className="divide-y divide-gray-100">
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
                <Toggle
                  enabled={widgets.bookmarks}
                  onChange={() => toggleWidget('bookmarks')}
                  title="Bookmarks"
                  description="Chrome bookmarks bar"
                />
              </div>
            </div>
          </div>
        );

      case 'clock':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Clock</h3>
            <p className="text-sm text-gray-500 mb-6">Time display settings</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Format
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeFormat('12h')}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      timeFormat === '12h'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    12 Hour
                  </button>
                  <button
                    onClick={() => setTimeFormat('24h')}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      timeFormat === '24h'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Quotes</h3>
            <p className="text-sm text-gray-500 mb-6">Daily inspirational quotes</p>

            <div className="divide-y divide-gray-100">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Weather</h3>
            <p className="text-sm text-gray-500 mb-6">Weather display settings</p>

            <div className="divide-y divide-gray-100">
              <Toggle
                enabled={widgets.weather}
                onChange={() => toggleWidget('weather')}
                title="Show weather"
                description="Display weather information"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature Unit
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTemperatureUnit('celsius')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    temperatureUnit === 'celsius'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Celsius (°C)
                </button>
                <button
                  onClick={() => setTemperatureUnit('fahrenheit')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    temperatureUnit === 'fahrenheit'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Search</h3>
            <p className="text-sm text-gray-500 mb-6">Search bar settings</p>

            <div className="divide-y divide-gray-100">
              <Toggle
                enabled={widgets.search}
                onChange={() => toggleWidget('search')}
                title="Show search bar"
                description="Display search on dashboard"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Engine
              </label>
              <select
                value={searchProvider}
                onChange={(e) =>
                  setSearchProvider(
                    e.target.value as 'google' | 'bing' | 'duckduckgo' | 'ecosia'
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Links</h3>
            <p className="text-sm text-gray-500 mb-6">Manage your quick links</p>

            <div className="divide-y divide-gray-100">
              <Toggle
                enabled={widgets.quickLinks}
                onChange={() => toggleWidget('quickLinks')}
                title="Show quick links"
                description="Display quick links panel"
              />
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Tasks</h3>
            <p className="text-sm text-gray-500 mb-6">Todo list settings</p>

            <div className="divide-y divide-gray-100">
              <Toggle
                enabled={widgets.todos}
                onChange={() => toggleWidget('todos')}
                title="Show tasks"
                description="Display todo list panel"
              />
            </div>
          </div>
        );

      case 'photos':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Photos</h3>
            <p className="text-sm text-gray-500 mb-6">Background photo settings</p>

            <p className="text-sm text-gray-500">
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
      {/* Settings Button */}
      <IconButton
        icon={Settings}
        onClick={() => setIsOpen(true)}
        label="Open settings"
      />

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
            className="relative z-10 w-full max-w-3xl mx-4 h-[600px] max-h-[80vh] rounded-2xl bg-white shadow-2xl overflow-hidden"
            style={{ animation: 'scaleIn 200ms ease-out' }}
          >
            <div className="flex h-full">
              {/* Left Sidebar Navigation */}
              <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 flex-1">
                  <nav className="space-y-1">
                    <NavItem
                      label="General"
                      active={activeSection === 'general'}
                      onClick={() => setActiveSection('general')}
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

                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-1">
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
                <div className="p-4 border-t border-gray-200">
                  <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    <User size={16} />
                    <span>{userName || 'Guest'}</span>
                  </button>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 flex flex-col">
                {/* Header with close button */}
                <div className="flex justify-end p-4 border-b border-gray-200">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close settings"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Section Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {renderSectionContent()}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4">
                  <p className="text-center text-xs text-gray-400">
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
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Mantra</h3>
      <p className="text-sm text-gray-500 mb-6">Daily inspirational mantras</p>

      <div className="divide-y divide-gray-100">
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
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Heart size={14} className="text-red-500" />
            Favorites
          </h4>
          <div className="space-y-2">
            {favoriteMantras.map(mantra => (
              <div
                key={mantra.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <p className="text-sm text-gray-700 flex-1 pr-2">{mantra.text}</p>
                <button
                  onClick={() => toggleFavorite(mantra.id)}
                  className="text-xs text-gray-500 hover:text-red-500 transition-colors"
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
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Eye size={14} className="text-gray-500" />
            Hidden Mantras
          </h4>
          <div className="space-y-2">
            {hiddenMantras.map(mantra => (
              <div
                key={mantra.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <p className="text-sm text-gray-500 flex-1 pr-2">{mantra.text}</p>
                <button
                  onClick={() => unhideMantra(mantra.id)}
                  className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
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
