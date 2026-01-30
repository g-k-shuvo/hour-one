import { useState } from 'react';
import { CheckSquare, ExternalLink, MapPin, Search, Target, SlidersHorizontal } from 'lucide-react';
import { Clock } from '@/components/widgets/Clock';
import { Greeting } from '@/components/widgets/Greeting';
import { Focus } from '@/components/widgets/Focus';
import { Quote } from '@/components/widgets/Quote';
import { TodoList } from '@/components/widgets/TodoList';
import { QuickLinks } from '@/components/widgets/QuickLinks';
import { SearchBar } from '@/components/widgets/SearchBar';
import { Weather } from '@/components/widgets/Weather';
import { Bookmarks } from '@/components/widgets/Bookmarks';
import { Background } from '@/components/widgets/Background';
import { SettingsSidebar } from '@/components/ui/SettingsSidebar';
import { IconButton } from '@/components/ui/IconButton';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTodosStore } from '@/stores/todosStore';
import { useWeatherStore } from '@/stores/weatherStore';

type CenterMode = 'focus' | 'search';

export function Dashboard() {
  const { widgets } = useSettingsStore();
  const { tasks } = useTodosStore();
  const { weather } = useWeatherStore();

  const [showTodos, setShowTodos] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [centerMode, setCenterMode] = useState<CenterMode>('focus');
  const [showModeToggle, setShowModeToggle] = useState(false);

  const incompleteTasks = tasks.filter((t) => !t.completed).length;

  // Determine if we should show the toggle (both focus and search are enabled)
  const showToggle = widgets.focus && widgets.search;
  const showFocus = centerMode === 'focus' && widgets.focus;
  const showSearch = centerMode === 'search' && widgets.search;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Dynamic Background */}
      <Background />

      {/* Main Content */}
      <main className="relative z-10 flex min-h-screen flex-col text-white">
        {/* Top Bar - Icons left, Weather right */}
        <div className="flex w-full items-center justify-between p-4">
          {/* Top Left - Icon buttons */}
          <div className="flex items-center gap-1">
            <IconButton
              icon={ExternalLink}
              onClick={() => setShowLinks(!showLinks)}
              label="Quick Links"
            />
            <SettingsSidebar />
          </div>

          {/* Top Right - Compact Weather */}
          <div className="flex-shrink-0">
          <div className="flex items-center gap-4">
              {weather?.location && (
                <div className="flex items-center gap-1.5 text-white/50 text-sm">
                  <MapPin size={14} />
                  <span>{weather.location}</span>
                </div>
              )}
            </div>
            {widgets.weather && <Weather compact />}
          </div>
        </div>

        {/* Center Content - vertically centered */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-4">
          {widgets.clock && <Clock />}
          {widgets.greeting && <Greeting />}

          {/* Focus/Search container with mode toggle on left */}
          <div className="flex items-center justify-center gap-3 w-full max-w-xl mt-8">
            {/* Mode toggle - on the left side */}
            {showToggle && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Expand/collapse button */}
                <button
                  onClick={() => setShowModeToggle(!showModeToggle)}
                  className={`rounded-full p-1.5 transition-all ${
                    showModeToggle
                      ? 'bg-white/20 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/10'
                  }`}
                  aria-label="Toggle mode selector"
                  title="Switch between Focus and Search"
                >
                  <SlidersHorizontal size={14} />
                </button>

                {/* Mode toggle pill - only shown when expanded */}
                {showModeToggle && (
                  <div
                    className="flex items-center rounded-full bg-white/10 p-0.5 backdrop-blur-sm"
                    style={{ animation: 'expandIn 150ms ease-out' }}
                  >
                    <button
                      onClick={() => setCenterMode('focus')}
                      className={`rounded-full p-1.5 transition-all ${
                        centerMode === 'focus'
                          ? 'bg-white/20 text-white'
                          : 'text-white/50 hover:text-white/70'
                      }`}
                      aria-label="Focus mode"
                      title="Focus"
                    >
                      <Target size={14} />
                    </button>
                    <button
                      onClick={() => setCenterMode('search')}
                      className={`rounded-full p-1.5 transition-all ${
                        centerMode === 'search'
                          ? 'bg-white/20 text-white'
                          : 'text-white/50 hover:text-white/70'
                      }`}
                      aria-label="Search mode"
                      title="Search"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Content area */}
            <div className="w-full max-w-lg">
              {showToggle ? (
                <>
                  {/* Focus or Search based on mode (when both enabled) */}
                  {showFocus && <Focus />}
                  {showSearch && <SearchBar />}
                </>
              ) : (
                <>
                  {/* Show single widget directly (when only one enabled) */}
                  {widgets.focus && <Focus />}
                  {widgets.search && !widgets.focus && <SearchBar />}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="w-full px-6 pb-4">
          {/* Bookmarks Bar (above bottom bar) */}
          {widgets.bookmarks && (
            <div className="mb-4 flex justify-center">
              <Bookmarks />
            </div>
          )}

          {/* Bottom bar row */}
          <div className="flex items-center justify-between">
            {/* Left - Location */}
            

            {/* Center - Quote */}
            <div className="flex-1 flex justify-center px-4">
              {widgets.quote && <Quote compact />}
            </div>

            {/* Right - Todo icon */}
            <div className="relative">
              <IconButton
                icon={CheckSquare}
                onClick={() => setShowTodos(!showTodos)}
                label="Todo List"
              />
              {incompleteTasks > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-medium text-white">
                  {incompleteTasks}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Todo List Panel (slides in from right) */}
        {showTodos && widgets.todos && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTodos(false)}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div
              className="absolute right-0 top-0 h-full w-80 bg-black/40 backdrop-blur-md p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: 'slideInRight 200ms ease-out' }}
            >
              <TodoList />
            </div>
          </div>
        )}

        {/* Quick Links Panel (slides in from left) */}
        {showLinks && widgets.quickLinks && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowLinks(false)}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div
              className="absolute left-0 top-0 h-full w-80 bg-black/40 backdrop-blur-md p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: 'slideInLeft 200ms ease-out' }}
            >
              <QuickLinks />
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes expandIn {
          from {
            opacity: 0;
            transform: scaleX(0);
            transform-origin: left;
          }
          to {
            opacity: 1;
            transform: scaleX(1);
            transform-origin: left;
          }
        }
      `}</style>
    </div>
  );
}
