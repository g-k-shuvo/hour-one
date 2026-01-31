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
}

const positionClasses: Record<Position, string> = {
  'top-left': 'items-start justify-start',
  'top-right': 'items-start justify-end',
  'bottom-left': 'items-end justify-start',
  'bottom-right': 'items-end justify-end',
};

const slideAnimations: Record<Position, string> = {
  'top-left': 'slideDown',
  'top-right': 'slideDown',
  'bottom-left': 'slideUp',
  'bottom-right': 'slideUp',
};

export function PopupPanel({
  isOpen,
  onClose,
  position,
  title,
  maxWidth = 'max-w-sm',
  headerActions,
  children,
}: PopupPanelProps) {
  if (!isOpen) return null;

  const slideAnimation = slideAnimations[position];

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
