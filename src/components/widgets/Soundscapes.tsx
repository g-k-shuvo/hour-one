import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, Music, ChevronDown } from 'lucide-react';
import { useSoundscapeStore, SOUNDSCAPES, getSoundscapeById, type Soundscape } from '@/stores/soundscapeStore';
import { useClickOutside } from '@/hooks/useClickOutside';

type Category = 'all' | Soundscape['category'];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'urban', label: 'Urban' },
  { id: 'ambient', label: 'Ambient' },
  { id: 'white-noise', label: 'Noise' },
];

interface SoundscapesPanelProps {
  compact?: boolean;
}

export function SoundscapesPanel({ compact = false }: SoundscapesPanelProps) {
  const {
    enabled,
    volume,
    currentSoundscapeId,
    isPlaying,
    isLoading,
    error,
    setVolume,
    setCurrentSoundscape,
    play,
    pause,
    toggle,
  } = useSoundscapeStore();

  const [category, setCategory] = useState<Category>('all');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const currentSoundscape = currentSoundscapeId ? getSoundscapeById(currentSoundscapeId) : null;

  const filteredSoundscapes = category === 'all'
    ? SOUNDSCAPES
    : SOUNDSCAPES.filter((s) => s.category === category);

  const handleSelectSoundscape = (soundscape: Soundscape) => {
    if (currentSoundscapeId === soundscape.id) {
      // Toggle playback if same soundscape
      toggle();
    } else {
      // Select new soundscape and play
      setCurrentSoundscape(soundscape.id);
      play();
    }
  };

  if (!enabled) {
    return (
      <div className="text-center py-4 text-white/40 text-sm">
        Soundscapes are disabled in settings
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Now Playing */}
      {currentSoundscape && (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <button
            onClick={toggle}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white transition-transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : isPlaying ? (
              <Pause size={18} />
            ) : (
              <Play size={18} className="ml-0.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentSoundscape.icon} {currentSoundscape.name}
            </p>
            <p className="text-xs text-white/50 truncate">
              {isPlaying ? 'Now playing' : 'Paused'}
            </p>
          </div>

          {/* Volume control */}
          <div className="relative">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="p-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {showVolumeSlider && (
              <div className="absolute right-0 top-full mt-2 p-3 bg-black/80 backdrop-blur-xl rounded-lg shadow-xl z-10">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 accent-accent"
                />
                <p className="text-xs text-white/50 text-center mt-1">
                  {Math.round(volume * 100)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
          {error}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              category === cat.id
                ? 'bg-accent text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Soundscape grid */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {filteredSoundscapes.map((soundscape) => {
          const isSelected = currentSoundscapeId === soundscape.id;
          const isActive = isSelected && isPlaying;

          return (
            <button
              key={soundscape.id}
              onClick={() => handleSelectSoundscape(soundscape)}
              className={`relative p-3 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-accent/20 ring-1 ring-accent'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-2xl mb-1">{soundscape.icon}</div>
              <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                {soundscape.name}
              </p>
              <p className="text-xs text-white/40 truncate">{soundscape.description}</p>

              {/* Playing indicator */}
              {isActive && (
                <div className="absolute top-2 right-2 flex gap-0.5">
                  <div className="w-0.5 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-0.5 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-0.5 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact button for dashboard
export function SoundscapesButton() {
  const { currentSoundscapeId, isPlaying, enabled, toggle } = useSoundscapeStore();
  const currentSoundscape = currentSoundscapeId ? getSoundscapeById(currentSoundscapeId) : null;

  if (!enabled) return null;

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
        isPlaying
          ? 'bg-accent/20 text-accent'
          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
      }`}
      title={currentSoundscape ? `${currentSoundscape.name} - ${isPlaying ? 'Playing' : 'Paused'}` : 'No soundscape selected'}
    >
      {isPlaying ? (
        <>
          <Music size={14} className="animate-pulse" />
          <span className="text-xs">{currentSoundscape?.icon}</span>
        </>
      ) : (
        <Music size={14} />
      )}
    </button>
  );
}

// Dropdown version for top bar
export function SoundscapesDropdown() {
  const { currentSoundscapeId, isPlaying, enabled, toggle } = useSoundscapeStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setIsOpen(false), []);
  useClickOutside(containerRef, handleClose, isOpen);

  const currentSoundscape = currentSoundscapeId ? getSoundscapeById(currentSoundscapeId) : null;

  if (!enabled) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
          isPlaying
            ? 'bg-accent/20 text-white'
            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
        }`}
        title="Soundscapes"
      >
        {currentSoundscape ? (
          <>
            <span>{currentSoundscape.icon}</span>
            {isPlaying && (
              <div className="flex gap-0.5">
                <div className="w-0.5 h-2.5 bg-current rounded-full animate-pulse" />
                <div className="w-0.5 h-2.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-0.5 h-2.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </>
        ) : (
          <Music size={16} />
        )}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl p-4 z-50"
          style={{ animation: 'fadeIn 150ms ease-out' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Soundscapes</h3>
            {currentSoundscape && (
              <button
                onClick={toggle}
                className="p-1.5 rounded-full bg-accent text-white hover:bg-accent/80 transition-colors"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
            )}
          </div>
          <SoundscapesPanel compact />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
