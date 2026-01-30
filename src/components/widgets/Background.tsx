import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useBackgroundStore } from '@/stores/backgroundStore';
import { useFocusSessionStore } from '@/stores/focusSessionStore';

export function Background() {
  const { background, isLoading, loadBackground, refreshBackground } =
    useBackgroundStore();
  const { phase } = useFocusSessionStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Small delay to allow store hydration
    const timer = setTimeout(() => {
      loadBackground();
    }, 100);
    return () => clearTimeout(timer);
  }, [loadBackground]);

  // Reset imageLoaded when background changes
  useEffect(() => {
    if (background?.url) {
      setImageLoaded(false);
      setLoadError(false);
    }
  }, [background?.url]);

  // Determine zoom and overlay state based on focus mode phase
  const isZooming = phase === 'entering' || phase === 'transition' || phase === 'active' || phase === 'exiting' || phase === 'celebration';
  const isZoomingOut = phase === 'leaving';
  const showDarkOverlay = phase !== 'idle' && phase !== 'leaving';
  // Never hide background - always show it

  return (
    <>
      {/* Fallback gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-opacity duration-1000"
        style={{ opacity: imageLoaded && !loadError ? 0 : 1 }}
        aria-hidden="true"
      />

      {/* Background image with zoom capability */}
      {background?.url && !loadError && (
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            opacity: imageLoaded ? 1 : 0,
          }}
          aria-hidden="true"
        >
          <div
            className="h-full w-full transition-all duration-[2000ms] ease-out"
            style={{
              transform: isZooming ? 'scale(1.2)' : 'scale(1)',
              filter: isZooming ? 'blur(3px)' : 'blur(0)',
            }}
          >
            <img
              src={background.url}
              alt=""
              className="h-full w-full object-cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setLoadError(true)}
              loading="eager"
            />
          </div>
        </div>
      )}

      {/* Normal overlay for text readability */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
        aria-hidden="true"
      />

      {/* Dark overlay that fades in during focus mode */}
      <div
        className="absolute inset-0 transition-opacity duration-[1500ms]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: showDarkOverlay ? 1 : 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"
        aria-hidden="true"
      />

      {/* Attribution and refresh button - hide during focus mode */}
      {phase === 'idle' && (
        <div className="absolute bottom-4 left-4 z-20 flex flex-row items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={refreshBackground}
            disabled={isLoading}
            className="flex-shrink-0 rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70 disabled:opacity-50"
            aria-label="Change background"
            title="Change background"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Attribution */}
          {background?.photographer && (
            <a
              href={background.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-[10px] text-white/40 transition-colors hover:text-white/70"
            >
              Photo by {background.photographer}
            </a>
          )}
        </div>
      )}
    </>
  );
}
