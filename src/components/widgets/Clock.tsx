import { useState, useEffect, useRef, useCallback } from 'react';
import { MoreHorizontal, Clock as ClockIcon, Circle } from 'lucide-react';
import { useSettingsStore, type AnalogClockVariant } from '@/stores/settingsStore';
import { useDropdownTheme } from '@/hooks/useTheme';
import { useClickOutside } from '@/hooks/useClickOutside';

const ROMAN_NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

interface AnalogClockProps {
  time: Date;
  variant: AnalogClockVariant;
}

function AnalogClock({ time, variant }: AnalogClockProps) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const milliseconds = time.getMilliseconds();

  const hourDeg = (hours + minutes / 60) * 30;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const secondDeg = seconds * 6;
  // Smooth second degree including milliseconds for badge variant
  const smoothSecondDeg = (seconds + milliseconds / 1000) * 6;

  // Classic style - traditional with bar markers
  if (variant === 'classic') {
    return (
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm">
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-3 bg-white/40 rounded-full"
              style={{
                top: '8px',
                left: '50%',
                transformOrigin: '50% 88px',
                transform: `translateX(-50%) rotate(${i * 30}deg)`,
              }}
            />
          ))}
          {/* Hour hand */}
          <div
            className="absolute w-1.5 h-14 bg-white rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
          />
          {/* Minute hand */}
          <div
            className="absolute w-1 h-20 bg-white/80 rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
          />
          {/* Second hand */}
          <div
            className="absolute w-0.5 h-20 bg-red-400 rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
          />
          {/* Center dot */}
          <div className="absolute w-3 h-3 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  // Minimal style - clean, no markers, no second hand
  if (variant === 'minimal') {
    return (
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
          {/* Hour hand */}
          <div
            className="absolute w-1 h-12 bg-white rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
          />
          {/* Minute hand */}
          <div
            className="absolute w-0.5 h-16 bg-white/70 rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
          />
          {/* Center dot */}
          <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  // Modern style - dot markers, thin hands, accent color
  if (variant === 'modern') {
    return (
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-full border border-white/15 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
          {/* Dot markers */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${i % 3 === 0 ? 'w-2 h-2 bg-white/60' : 'w-1 h-1 bg-white/30'}`}
              style={{
                top: i % 3 === 0 ? '10px' : '12px',
                left: '50%',
                transformOrigin: `50% ${i % 3 === 0 ? '84px' : '82px'}`,
                transform: `translateX(-50%) rotate(${i * 30}deg)`,
              }}
            />
          ))}
          {/* Hour hand */}
          <div
            className="absolute w-1 h-12 bg-white rounded-full shadow-lg"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
          />
          {/* Minute hand */}
          <div
            className="absolute w-0.5 h-[72px] bg-white/90 rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
          />
          {/* Second hand */}
          <div
            className="absolute w-[1px] h-[76px] bg-cyan-400 rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
          />
          {/* Center dot */}
          <div className="absolute w-2.5 h-2.5 bg-cyan-400 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-cyan-400/50" />
        </div>
      </div>
    );
  }

  // Roman style - roman numerals
  if (variant === 'roman') {
    return (
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm">
          {/* Roman numerals */}
          {ROMAN_NUMERALS.map((numeral, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const radius = 72;
            const x = 96 + radius * Math.cos(angle);
            const y = 96 + radius * Math.sin(angle);
            return (
              <span
                key={i}
                className="absolute text-[10px] font-medium text-white/50"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {numeral}
              </span>
            );
          })}
          {/* Hour hand */}
          <div
            className="absolute w-1.5 h-12 bg-white rounded-sm"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
          />
          {/* Minute hand */}
          <div
            className="absolute w-1 h-16 bg-white/80 rounded-sm"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
          />
          {/* Second hand */}
          <div
            className="absolute w-0.5 h-[70px] bg-amber-400 rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
          />
          {/* Center dot */}
          <div className="absolute w-3 h-3 bg-amber-400 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  // Badge style - minimal with a dot for seconds
  if (variant === 'badge') {
    return (
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm">
          {/* Hour hand */}
          <div
            className="absolute w-1.5 h-14 bg-white rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
          />
          {/* Minute hand */}
          <div
            className="absolute w-1 h-20 bg-white/80 rounded-full"
            style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
          />
          {/* Second dot - smooth orbiting using milliseconds */}
          <div
            className="absolute w-2.5 h-2.5 bg-red-400 rounded-full"
            style={{
              top: '14px',
              left: '50%',
              transformOrigin: '50% 82px',
              transform: `translateX(-50%) rotate(${smoothSecondDeg}deg)`,
            }}
          />
          {/* Center dot */}
          <div className="absolute w-3 h-3 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  // Numbered style - numbers 1-12
  return (
    <div className="relative w-48 h-48">
      <div className="absolute inset-0 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm">
        {/* Numbers */}
        {[...Array(12)].map((_, i) => {
          const num = i === 0 ? 12 : i;
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const radius = 74;
          const x = 96 + radius * Math.cos(angle);
          const y = 96 + radius * Math.sin(angle);
          return (
            <span
              key={i}
              className="absolute text-sm font-light text-white/60"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {num}
            </span>
          );
        })}
        {/* Hour hand */}
        <div
          className="absolute w-1.5 h-11 bg-white rounded-full"
          style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
        />
        {/* Minute hand */}
        <div
          className="absolute w-1 h-[60px] bg-white/80 rounded-full"
          style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
        />
        {/* Second hand */}
        <div
          className="absolute w-0.5 h-[64px] bg-rose-400 rounded-full"
          style={{ bottom: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
        />
        {/* Center dot */}
        <div className="absolute w-2.5 h-2.5 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}

const VARIANT_LABELS: Record<AnalogClockVariant, string> = {
  classic: 'Classic',
  minimal: 'Minimal',
  modern: 'Modern',
  roman: 'Roman',
  numbered: 'Numbered',
  badge: 'Badge',
};

export function Clock() {
  const { timeFormat, clockStyle, analogClockVariant, setTimeFormat, setClockStyle, setAnalogClockVariant } = useSettingsStore();
  const { dropdown, menuItem, menuItemActive, sectionLabel, divider } = useDropdownTheme();
  const [time, setTime] = useState(new Date());
  const [showConfig, setShowConfig] = useState(false);
  const [configPosition, setConfigPosition] = useState({ top: 0, left: 0 });
  const configButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const handleCloseConfig = useCallback(() => {
    setShowConfig(false);
  }, []);

  useClickOutside(dropdownContainerRef, handleCloseConfig, showConfig);

  // Use faster updates for badge variant (smooth second dot)
  useEffect(() => {
    const interval = clockStyle === 'analog' && analogClockVariant === 'badge' ? 50 : 1000;
    const timer = setInterval(() => {
      setTime(new Date());
    }, interval);

    return () => clearInterval(timer);
  }, [clockStyle, analogClockVariant]);

  const formatTime = (date: Date): string => {
    if (timeFormat === '24h') {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleConfigToggle = () => {
    if (!showConfig && configButtonRef.current) {
      const rect = configButtonRef.current.getBoundingClientRect();
      setConfigPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 160),
      });
    }
    setShowConfig(!showConfig);
  };

  return (
    <div className="text-center select-none group relative">
      {clockStyle === 'analog' ? (
        <AnalogClock time={time} variant={analogClockVariant} />
      ) : (
        <time
          className="block text-9xl font-extralight tracking-tight text-white text-shadow-lg tabular-nums"
          style={{ fontWeight: 200 }}
          dateTime={time.toISOString()}
        >
          {formatTime(time)}
        </time>
      )}

      {/* Config button and popup container */}
      <div ref={dropdownContainerRef}>
        {/* Config button - visible on hover */}
        <button
          ref={configButtonRef}
          onClick={handleConfigToggle}
          className={`absolute -right-8 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-all hover:bg-white/10 hover:text-white/60 ${
            showConfig ? 'opacity-100 text-white/60' : 'opacity-0 group-hover:opacity-100 text-white/40'
          }`}
          aria-label="Clock settings"
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Config popup */}
        {showConfig && (
          <div
            className={`fixed z-50 w-40 rounded-lg ${dropdown} py-2 shadow-xl overflow-visible`}
            style={{ top: configPosition.top, left: configPosition.left }}
          >
            {/* Arrow pointing up */}
            <div
              className="absolute -top-1.5 left-3 w-3 h-3 rotate-45 bg-inherit rounded-tl-sm"
              style={{ boxShadow: '-1px -1px 1px rgba(0,0,0,0.1)' }}
            />
            {/* Time format section */}
            <p className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${sectionLabel}`}>
              Format
            </p>
            <button
              onClick={() => setTimeFormat('12h')}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                timeFormat === '12h' ? menuItemActive : menuItem
              }`}
            >
              <span>12-hour</span>
            </button>
            <button
              onClick={() => setTimeFormat('24h')}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                timeFormat === '24h' ? menuItemActive : menuItem
              }`}
            >
              <span>24-hour</span>
            </button>

            {/* Clock style section */}
            <div className={`my-1.5 border-t ${divider}`} />
            <p className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${sectionLabel}`}>
              Style
            </p>
            <button
              onClick={() => setClockStyle('digital')}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                clockStyle === 'digital' ? menuItemActive : menuItem
              }`}
            >
              <ClockIcon size={14} />
              <span>Digital</span>
            </button>
            <button
              onClick={() => setClockStyle('analog')}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                clockStyle === 'analog' ? menuItemActive : menuItem
              }`}
            >
              <Circle size={14} />
              <span>Analog</span>
            </button>

            {/* Analog variant section - only show when analog is selected */}
            {clockStyle === 'analog' && (
              <>
                <div className={`my-1.5 border-t ${divider}`} />
                <p className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${sectionLabel}`}>
                  Variant
                </p>
                {(['classic', 'minimal', 'modern', 'roman', 'numbered', 'badge'] as const).map((variant) => (
                  <button
                    key={variant}
                    onClick={() => setAnalogClockVariant(variant)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                      analogClockVariant === variant ? menuItemActive : menuItem
                    }`}
                  >
                    <span>{VARIANT_LABELS[variant]}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
