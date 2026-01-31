import { useState } from 'react';
import { CheckSquare, ExternalLink, MapPin, Search, Target, SlidersHorizontal, Play } from 'lucide-react';
import { Clock } from '@/components/widgets/Clock';
import { Greeting } from '@/components/widgets/Greeting';
import { Focus } from '@/components/widgets/Focus';
import { Quote } from '@/components/widgets/Quote';
import { TodoList } from '@/components/widgets/TodoList';
import { QuickLinks, QuickLinksHeaderActions } from '@/components/widgets/QuickLinks';
import { PinnedLinkItem, PinnedGroupItem } from '@/components/widgets/PinnedItem';
import { SearchBar } from '@/components/widgets/SearchBar';
import { Weather } from '@/components/widgets/Weather';
import { Bookmarks } from '@/components/widgets/Bookmarks';
import { Background } from '@/components/widgets/Background';
import { FocusModeOverlay } from '@/components/widgets/FocusModeOverlay';
import { SettingsSidebar } from '@/components/ui/SettingsSidebar';
import { IconButton } from '@/components/ui/IconButton';
import { PopupPanel } from '@/components/ui/PopupPanel';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTodosStore } from '@/stores/todosStore';
import { useWeatherStore } from '@/stores/weatherStore';
import { useFocusSessionStore } from '@/stores/focusSessionStore';
import { useFocusStore } from '@/stores/focusStore';
import { useQuickLinksStore, usePinnedItems } from '@/stores/quickLinksStore';

type CenterMode = 'focus' | 'search';

export function Dashboard() {
  const { widgets } = useSettingsStore();
  const { tasks } = useTodosStore();
  const { weather } = useWeatherStore();
  const { phase, enterFocusMode } = useFocusSessionStore();
  const { focus } = useFocusStore();
  const { links } = useQuickLinksStore();
  const pinnedItems = usePinnedItems();

  const [showTodos, setShowTodos] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [centerMode, setCenterMode] = useState<CenterMode>('focus');
  const [showModeToggle, setShowModeToggle] = useState(false);

  const incompleteTasks = tasks.filter((t) => !t.completed).length;

  // Determine if we should show the toggle (both focus and search are enabled)
  const showToggle = widgets.focus && widgets.search;
  const showFocus = centerMode === 'focus' && widgets.focus;
  const showSearch = centerMode === 'search' && widgets.search;

  // Hide main dashboard during active focus mode phases
  const isInFocusMode = phase !== 'idle' && phase !== 'leaving';
  const isReturningFromFocus = phase === 'leaving';

  // Staggered animation delays for elements returning from focus mode
  const getReturnDelay = (index: number) => {
    if (!isReturningFromFocus) return '0s';
    return `${0.3 + index * 0.1}s`;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Dynamic Background */}
      <Background />

      {/* Focus Mode Overlay */}
      <FocusModeOverlay />

      {/* Main Content - hidden during focus mode */}
      <main
        className={`relative z-10 flex min-h-screen flex-col text-white transition-opacity duration-500 ${
          isInFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Top Bar - Icons left, Weather right */}
        <div
          className="flex w-full items-center justify-between p-4"
          style={{
            animation: isReturningFromFocus ? `fadeInStagger 0.5s ease-out ${getReturnDelay(0)} both` : undefined,
          }}
        >
          {/* Top Left - Icon buttons */}
          <div className="flex items-center gap-1">
            <IconButton
              icon={ExternalLink}
              onClick={() => setShowLinks(!showLinks)}
              label="Quick Links"
            />

            {/* Pinned Items Bar */}
            {pinnedItems.length > 0 && (
              <div className="flex items-center gap-0.5 ml-1 pl-2 border-l border-white/10">
                {pinnedItems.map((item) =>
                  item.type === 'link' ? (
                    <PinnedLinkItem
                      key={item.item.id}
                      link={item.item}
                      onEdit={() => setShowLinks(true)}
                    />
                  ) : (
                    <PinnedGroupItem
                      key={item.item.id}
                      group={item.item}
                      links={links.filter((l) => l.groupId === item.item.id)}
                      onEdit={() => setShowLinks(true)}
                    />
                  )
                )}
              </div>
            )}

            <IconButton
              icon={Play}
              onClick={() => enterFocusMode(focus)}
              label="Focus Mode"
            />
            <SettingsSidebar />
          </div>

          {/* Top Right - Compact Weather */}
          <div className="flex gap-4">
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
          <div
            style={{
              animation: isReturningFromFocus ? `fadeInStagger 0.5s ease-out ${getReturnDelay(2)} both` : undefined,
            }}
          >
            {widgets.clock && <Clock />}
          </div>

          <div
            style={{
              animation: isReturningFromFocus ? `fadeInStagger 0.5s ease-out ${getReturnDelay(3)} both` : undefined,
            }}
          >
            {widgets.greeting && <Greeting />}
          </div>

          {/* Focus/Search container with mode toggle */}
          <div
            className="relative w-full max-w-xl mt-8 group/toggle"
            style={{
              animation: isReturningFromFocus ? `fadeInStagger 0.5s ease-out ${getReturnDelay(4)} both` : undefined,
            }}
          >
            {/* Mode toggle - absolute positioned on left */}
            {showToggle && (
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/toggle:opacity-100 transition-opacity">
                {/* Expand/collapse button */}
                <button
                  onClick={() => setShowModeToggle(!showModeToggle)}
                  className={`rounded-full p-1.5 transition-all hover:bg-white/10 ${
                    showModeToggle
                      ? 'bg-white/20 text-white opacity-100'
                      : 'text-white/40 hover:text-white/60'
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

            {/* Content area - centered */}
            <div className="w-full max-w-lg mx-auto">
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
            <div
              className="mb-4 flex justify-center"
              style={{
                animation: isReturningFromFocus ? `fadeInStagger 0.5s ease-out ${getReturnDelay(1)} both` : undefined,
              }}
            >
              <Bookmarks />
            </div>
          )}

          {/* Bottom bar row */}
          <div className="flex items-center justify-between">
            {/* Left - Location */}


            {/* Center - Quote */}
            <div
              className="flex-1 flex justify-center px-4"
              style={{
                animation: isReturningFromFocus ? `fadeInStagger 0.5s ease-out ${getReturnDelay(5)} both` : undefined,
              }}
            >
              {widgets.quote && <Quote compact />}
            </div>

            {/* Right - Todo icon */}
            <div
              className="relative"
              style={{
                animation: isReturningFromFocus ? `fadeInStagger 0.5s ease-out ${getReturnDelay(6)} both` : undefined,
              }}
            >
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

        {/* Todo List Popup */}
        <PopupPanel
          isOpen={showTodos && widgets.todos}
          onClose={() => setShowTodos(false)}
          position="bottom-right"
          title="Today's Tasks"
          maxWidth="max-w-sm"
        >
          <TodoList />
        </PopupPanel>

        {/* Quick Links Popup */}
        <PopupPanel
          isOpen={showLinks && widgets.quickLinks}
          onClose={() => setShowLinks(false)}
          position="top-left"
          title="Quick Links"
          maxWidth="max-w-sm"
          headerActions={<QuickLinksHeaderActions />}
        >
          <QuickLinks />
        </PopupPanel>
      </main>

      <style>{`
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
        @keyframes fadeInStagger {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
