import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface PopupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  title?: string;
  maxWidth?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  /** Whether to show an arrow pointing to the corner */
  showArrow?: boolean;
}

const positionClasses: Record<Position, string> = {
  'top-left': 'items-start justify-start pt-14', // Offset below top bar buttons
  'top-right': 'items-start justify-end pt-14',
  'bottom-left': 'items-end justify-start pb-14', // Offset above bottom bar buttons
  'bottom-right': 'items-end justify-end pb-14',
};

const slideAnimations: Record<Position, string> = {
  'top-left': 'slideDown',
  'top-right': 'slideDown',
  'bottom-left': 'slideUp',
  'bottom-right': 'slideUp',
};

// Arrow configurations for each position (pointing to the trigger button location)
const arrowConfigs: Record<Position, { className: string; style: React.CSSProperties }> = {
  'top-left': {
    className: 'absolute -top-1.5 left-4 w-3 h-3 rotate-45 bg-gray-900/95 rounded-tl-sm',
    style: { boxShadow: '-1px -1px 1px rgba(0,0,0,0.1)' },
  },
  'top-right': {
    className: 'absolute -top-1.5 right-4 w-3 h-3 rotate-45 bg-gray-900/95 rounded-tl-sm',
    style: { boxShadow: '-1px -1px 1px rgba(0,0,0,0.1)' },
  },
  'bottom-left': {
    className: 'absolute -bottom-1.5 left-4 w-3 h-3 rotate-45 bg-gray-900/95 rounded-br-sm',
    style: { boxShadow: '1px 1px 1px rgba(0,0,0,0.1)' },
  },
  'bottom-right': {
    className: 'absolute -bottom-1.5 right-6 w-3 h-3 rotate-45 bg-gray-900/95 rounded-br-sm',
    style: { boxShadow: '1px 1px 1px rgba(0,0,0,0.1)' },
  },
};

export function PopupPanel({
  isOpen,
  onClose,
  position,
  title,
  maxWidth = 'max-w-sm',
  headerActions,
  children,
  showArrow = true,
}: PopupPanelProps) {
  if (!isOpen) return null;

  const slideAnimation = slideAnimations[position];
  const arrowConfig = arrowConfigs[position];

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex p-4 ${positionClasses[position]}`}
      style={{ animation: 'popupFadeIn 200ms ease-out' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative z-10 w-full ${maxWidth} rounded-2xl bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-visible`}
        style={{ animation: `popup${slideAnimation} 200ms ease-out` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow */}
        {showArrow && <div className={arrowConfig.className} style={arrowConfig.style} />}

        {/* Header with title, actions, and close button */}
        {(title || headerActions) && (
          <div className="flex items-center justify-between p-4 pb-0">
            <h3 className="text-sm font-medium text-white/80">{title}</h3>
            <div className="flex items-center gap-1">
              {headerActions}
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popupslideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popupslideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
