import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Globe,
  Plus,
  X,
  Sun,
  Moon,
  Search,
  Settings,
} from 'lucide-react';
import {
  useWorldClocksStore,
  POPULAR_TIMEZONES,
  formatTimeForTimezone,
  getTimezoneOffset,
  getRelativeOffset,
  isDaytime,
  type WorldClock,
} from '@/stores/worldClocksStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useClickOutside } from '@/hooks/useClickOutside';

// Mini clock display for a single timezone
function MiniClock({ clock, onRemove }: { clock: WorldClock; onRemove: () => void }) {
  const { timeFormat } = useSettingsStore();
  const [time, setTime] = useState(() => formatTimeForTimezone(clock.timezone, timeFormat));
  const [showRemove, setShowRemove] = useState(false);
  const daytime = isDaytime(clock.timezone);
  const offset = getRelativeOffset(clock.timezone);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTimeForTimezone(clock.timezone, timeFormat));
    }, 1000);
    return () => clearInterval(interval);
  }, [clock.timezone, timeFormat]);

  return (
    <div
      className="group relative flex flex-col items-center gap-1 rounded-lg bg-white/5 px-3 py-2 transition-all hover:bg-white/10"
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
    >
      {/* Remove button */}
      {showRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 rounded-full bg-red-500/80 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
        >
          <X size={10} />
        </button>
      )}

      {/* Day/Night indicator */}
      <div className={`${daytime ? 'text-yellow-400' : 'text-blue-400'}`}>
        {daytime ? <Sun size={14} /> : <Moon size={14} />}
      </div>

      {/* Time */}
      <div className="text-lg font-light text-white tabular-nums">
        {time}
      </div>

      {/* Label */}
      <div className="text-[10px] text-white/50 truncate max-w-[80px]" title={clock.label}>
        {clock.label}
      </div>

      {/* Relative offset */}
      <div className="text-[9px] text-white/30">
        {offset}
      </div>
    </div>
  );
}

// Add clock modal
function AddClockModal({ onClose, onAdd }: { onClose: () => void; onAdd: (timezone: string, label?: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { clocks } = useWorldClocksStore();

  useClickOutside(modalRef, onClose, true);

  const regions = ['Americas', 'Europe', 'Asia', 'Oceania', 'Africa'];

  // Filter timezones based on search and region
  const filteredTimezones = POPULAR_TIMEZONES.filter((tz) => {
    const matchesSearch = !searchQuery ||
      tz.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tz.timezone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = !selectedRegion || tz.region === selectedRegion;
    const notAdded = !clocks.some(c => c.timezone === tz.timezone);
    return matchesSearch && matchesRegion && notAdded;
  });

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-80 max-h-[80vh] rounded-xl border border-white/10 bg-gray-900/95 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-medium text-white">Add World Clock</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white/70"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-white/10 p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cities..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
              autoFocus
            />
          </div>
        </div>

        {/* Region tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2 scrollbar-thin">
          <button
            onClick={() => setSelectedRegion(null)}
            className={`rounded-lg px-2 py-1 text-xs whitespace-nowrap transition-colors ${
              !selectedRegion ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            All
          </button>
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`rounded-lg px-2 py-1 text-xs whitespace-nowrap transition-colors ${
                selectedRegion === region ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Timezone list */}
        <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin">
          {filteredTimezones.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/40">
              {searchQuery ? 'No cities found' : 'All cities added'}
            </p>
          ) : (
            filteredTimezones.map((tz) => (
              <button
                key={tz.timezone}
                onClick={() => {
                  onAdd(tz.timezone, tz.label);
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/10"
              >
                <div>
                  <div className="text-sm text-white">{tz.label}</div>
                  <div className="text-[10px] text-white/40">{tz.timezone}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/70 tabular-nums">
                    {formatTimeForTimezone(tz.timezone, '12h')}
                  </div>
                  <div className="text-[10px] text-white/40">
                    {getTimezoneOffset(tz.timezone)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Main WorldClocks widget
export function WorldClocks() {
  const { clocks, addClock, removeClock } = useWorldClocksStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const sortedClocks = [...clocks].sort((a, b) => a.order - b.order);

  if (clocks.length === 0) {
    return (
      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-3 text-sm text-white/50 transition-colors hover:border-white/30 hover:text-white/70"
      >
        <Globe size={16} />
        <span>Add world clocks</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {sortedClocks.map((clock) => (
          <MiniClock
            key={clock.id}
            clock={clock}
            onRemove={() => removeClock(clock.id)}
          />
        ))}

        {/* Add button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-[76px] w-[76px] items-center justify-center rounded-lg border border-dashed border-white/20 text-white/40 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white/60"
          title="Add world clock"
        >
          <Plus size={20} />
        </button>
      </div>

      {showAddModal && (
        <AddClockModal
          onClose={() => setShowAddModal(false)}
          onAdd={addClock}
        />
      )}
    </div>
  );
}

// Button variant for dashboard header or compact display
export function WorldClocksButton() {
  const { clocks } = useWorldClocksStore();
  const { timeFormat } = useSettingsStore();
  const [showPopup, setShowPopup] = useState(false);
  const [_time, setTime] = useState(new Date()); // Used to trigger re-renders
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setShowPopup(false);
  }, []);

  useClickOutside(popupRef, handleClose, showPopup);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (clocks.length === 0) return null;

  const sortedClocks = [...clocks].sort((a, b) => a.order - b.order);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowPopup(!showPopup)}
        className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        title="World Clocks"
      >
        <Globe size={14} />
        <span className="text-xs tabular-nums">
          {clocks.length} {clocks.length === 1 ? 'clock' : 'clocks'}
        </span>
      </button>

      {showPopup && (
        <div
          ref={popupRef}
          className="absolute top-full mt-2 right-0 z-50 min-w-[200px] rounded-lg border border-white/10 bg-gray-900/95 p-3 shadow-xl backdrop-blur-sm"
        >
          <div className="space-y-2">
            {sortedClocks.map((clock) => {
              const daytime = isDaytime(clock.timezone);
              return (
                <div key={clock.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={daytime ? 'text-yellow-400' : 'text-blue-400'}>
                      {daytime ? <Sun size={12} /> : <Moon size={12} />}
                    </span>
                    <span className="text-sm text-white/70">{clock.label}</span>
                  </div>
                  <span className="text-sm text-white tabular-nums">
                    {formatTimeForTimezone(clock.timezone, timeFormat)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Panel variant for popup panel display
export function WorldClocksPanel() {
  const { clocks, addClock, removeClock } = useWorldClocksStore();
  const { timeFormat } = useSettingsStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const sortedClocks = [...clocks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      {/* Clock list */}
      {sortedClocks.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/40">
          No world clocks added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {sortedClocks.map((clock) => {
            const daytime = isDaytime(clock.timezone);
            const offset = getRelativeOffset(clock.timezone);
            const tzOffset = getTimezoneOffset(clock.timezone);

            return (
              <div
                key={clock.id}
                className="group flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className={daytime ? 'text-yellow-400' : 'text-blue-400'}>
                    {daytime ? <Sun size={16} /> : <Moon size={16} />}
                  </span>
                  <div>
                    <div className="text-sm text-white">{clock.label}</div>
                    <div className="text-[10px] text-white/40">
                      GMT{tzOffset} · {offset}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-light text-white tabular-nums">
                    {formatTimeForTimezone(clock.timezone, timeFormat)}
                  </span>
                  <button
                    onClick={() => removeClock(clock.id)}
                    className="rounded p-1 text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-2 text-sm text-white/50 transition-colors hover:border-white/30 hover:text-white/70"
      >
        <Plus size={16} />
        <span>Add World Clock</span>
      </button>

      {showAddModal && (
        <AddClockModal
          onClose={() => setShowAddModal(false)}
          onAdd={addClock}
        />
      )}
    </div>
  );
}

// Header actions for PopupPanel
export function WorldClocksHeaderActions({ onClose }: { onClose?: () => void }) {
  const handleOpenSettings = () => {
    onClose?.();
    window.dispatchEvent(
      new CustomEvent('openSettings', { detail: { section: 'widgets' } })
    );
  };

  return (
    <button
      onClick={handleOpenSettings}
      className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
      aria-label="Settings"
      title="Settings"
    >
      <Settings size={16} />
    </button>
  );
}
