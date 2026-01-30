import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQuoteStore } from '@/stores/quoteStore';

interface QuoteProps {
  compact?: boolean;
}

export function Quote({ compact = false }: QuoteProps) {
  const { quote, loadQuote, refreshQuote } = useQuoteStore();

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  if (!quote) {
    return null;
  }

  // Compact mode - smaller, inline for bottom bar
  if (compact) {
    return (
      <div className="group flex items-center gap-2 max-w-md">
        <p className="text-sm font-light italic text-white/60 truncate">
          "{quote.text}"
        </p>
        {quote.author && (
          <span className="text-xs text-white/40 shrink-0">— {quote.author}</span>
        )}
        <button
          onClick={refreshQuote}
          className="shrink-0 rounded-full p-1 text-white/0 transition-all hover:bg-white/10 hover:text-white/60 group-hover:text-white/30"
          aria-label="Get new quote"
          title="Get new quote"
        >
          <RefreshCw size={12} />
        </button>
      </div>
    );
  }

  // Full mode - original display
  return (
    <div className="group w-full max-w-2xl">
      <figure className="text-center">
        <blockquote>
          <p className="text-lg font-light italic leading-relaxed text-white/80 text-shadow">
            "{quote.text}"
          </p>
        </blockquote>
        {quote.author && (
          <figcaption className="mt-3 flex items-center justify-center gap-2">
            <span className="text-sm text-white/50">— {quote.author}</span>
            <button
              onClick={refreshQuote}
              className="rounded-full p-1 text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white/60 group-hover:opacity-100"
              aria-label="Get new quote"
              title="Get new quote"
            >
              <RefreshCw size={14} />
            </button>
          </figcaption>
        )}
      </figure>
    </div>
  );
}
