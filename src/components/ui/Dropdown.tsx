import { ReactNode, useRef, useCallback, RefObject, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDropdownTheme } from '@/hooks/useTheme';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useAdaptivePosition } from '@/hooks/useAdaptivePosition';

// Arrow component for dropdowns
interface DropdownArrowProps {
  position: 'top' | 'bottom';
  alignment: 'left' | 'right' | 'center';
}

function DropdownArrow({ position, alignment }: DropdownArrowProps) {
  const alignmentClass = alignment === 'left' ? 'left-3' :
                         alignment === 'right' ? 'right-3' :
                         'left-1/2 -translate-x-1/2';

  if (position === 'top') {
    // Arrow pointing up (dropdown is below trigger)
    return (
      <div
        className={`absolute -top-1.5 ${alignmentClass} w-3 h-3 rotate-45 bg-inherit rounded-tl-sm`}
        style={{ boxShadow: '-1px -1px 1px rgba(0,0,0,0.1)' }}
      />
    );
  }

  // Arrow pointing down (dropdown is above trigger)
  return (
    <div
      className={`absolute -bottom-1.5 ${alignmentClass} w-3 h-3 rotate-45 bg-inherit rounded-br-sm`}
      style={{ boxShadow: '1px 1px 1px rgba(0,0,0,0.1)' }}
    />
  );
}

interface DropdownProps {
  children: ReactNode;
  className?: string;
  position?: 'left' | 'right' | 'bottom';
  width?: string;
  /** Reference to the trigger element for adaptive positioning */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Whether the dropdown is open (required for adaptive positioning) */
  isOpen?: boolean;
  /** Whether to show an arrow pointing to the trigger */
  showArrow?: boolean;
}

export function Dropdown({
  children,
  className = '',
  position = 'left',
  width = 'w-44',
  triggerRef,
  isOpen = true,
  showArrow = true,
}: DropdownProps) {
  const { dropdown } = useDropdownTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  // Use adaptive positioning if triggerRef is provided
  const { position: adaptivePos, positionClasses } = useAdaptivePosition({
    triggerRef: triggerRef || { current: null },
    contentRef,
    isOpen,
    preferredVertical: 'bottom',
    preferredHorizontal: position === 'right' ? 'right' : 'left',
    estimatedHeight: 200,
    estimatedWidth: 180,
  });

  // Fall back to static positioning if no triggerRef
  const staticPositionClass = position === 'right' ? 'right-0 top-full mt-2' :
                              position === 'bottom' ? 'left-0 top-full mt-2' :
                              'left-0 top-full mt-2';

  const finalPositionClass = triggerRef ? positionClasses : staticPositionClass;

  // Determine arrow position
  const arrowPosition = triggerRef ? (adaptivePos.vertical === 'bottom' ? 'top' : 'bottom') : 'top';
  const arrowAlignment = triggerRef ? adaptivePos.horizontal : (position === 'right' ? 'right' : 'left');

  return (
    <div
      ref={contentRef}
      className={`absolute ${finalPositionClass} z-50 ${width} rounded-lg ${dropdown} py-1.5 shadow-xl ${className} overflow-visible`}
      style={{ animation: 'dropdownFadeIn 150ms ease-out' }}
    >
      {showArrow && <DropdownArrow position={arrowPosition} alignment={arrowAlignment} />}
      {children}
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function DropdownItem({ children, onClick, active = false, className = '' }: DropdownItemProps) {
  const { menuItem, menuItemActive } = useDropdownTheme();

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
        active ? menuItemActive : menuItem
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface DropdownLabelProps {
  children: ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className = '' }: DropdownLabelProps) {
  const { sectionLabel } = useDropdownTheme();

  return (
    <p className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${sectionLabel} ${className}`}>
      {children}
    </p>
  );
}

export function DropdownDivider() {
  const { divider } = useDropdownTheme();

  return <div className={`my-1.5 border-t ${divider}`} />;
}

// Container component that wraps trigger and dropdown with click-outside handling
interface DropdownContainerProps {
  children: ReactNode | ((triggerRef: RefObject<HTMLButtonElement>) => ReactNode);
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function DropdownContainer({ children, isOpen, onClose, className = '' }: DropdownContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useClickOutside(containerRef, handleClose, isOpen);

  return (
    <div ref={containerRef} className={className}>
      {typeof children === 'function' ? children(triggerRef) : children}
    </div>
  );
}

// Adaptive dropdown that automatically calculates its position
interface AdaptiveDropdownProps {
  children: ReactNode;
  triggerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  className?: string;
  width?: string;
  preferredPosition?: 'left' | 'right';
  /** Whether to show an arrow pointing to the trigger */
  showArrow?: boolean;
  /** Render via portal for escaping stacking contexts */
  usePortal?: boolean;
}

export function AdaptiveDropdown({
  children,
  triggerRef,
  isOpen,
  className = '',
  width = 'w-44',
  preferredPosition = 'left',
  showArrow = true,
  usePortal = false,
}: AdaptiveDropdownProps) {
  const { dropdown } = useDropdownTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0 });

  const { position, positionClasses } = useAdaptivePosition({
    triggerRef,
    contentRef,
    isOpen,
    preferredVertical: 'bottom',
    preferredHorizontal: preferredPosition,
    estimatedHeight: 200,
    estimatedWidth: 180,
  });

  // Calculate portal position when using portal mode
  useEffect(() => {
    if (usePortal && isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedWidth = 180;
      const estimatedHeight = 200;

      // Determine horizontal position
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;
      const openRight = preferredPosition === 'right' ? spaceRight >= estimatedWidth : spaceLeft < estimatedWidth;

      // Determine vertical position
      const spaceBelow = window.innerHeight - rect.bottom;
      const openBelow = spaceBelow >= estimatedHeight;

      let left = openRight ? rect.right - estimatedWidth : rect.left;
      let top = openBelow ? rect.bottom + 8 : rect.top - estimatedHeight - 8;

      // Clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - estimatedWidth - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - estimatedHeight - 8));

      setPortalPosition({ top, left });
    }
  }, [usePortal, isOpen, triggerRef, preferredPosition]);

  if (!isOpen) return null;

  // Determine arrow position
  const arrowPosition = position.vertical === 'bottom' ? 'top' : 'bottom';
  const arrowAlignment = position.horizontal;

  const dropdownContent = (
    <div
      ref={contentRef}
      className={`${usePortal ? 'fixed z-[100]' : `absolute ${positionClasses} z-50`} ${width} rounded-lg ${dropdown} py-1.5 shadow-xl ${className} overflow-visible`}
      style={usePortal ? { top: portalPosition.top, left: portalPosition.left, animation: 'dropdownFadeIn 150ms ease-out' } : { animation: 'dropdownFadeIn 150ms ease-out' }}
    >
      {showArrow && <DropdownArrow position={arrowPosition} alignment={arrowAlignment} />}
      {children}
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  if (usePortal) {
    return createPortal(dropdownContent, document.body);
  }

  return dropdownContent;
}

// Legacy backdrop component - kept for backwards compatibility but prefer DropdownContainer
interface DropdownBackdropProps {
  onClose: () => void;
}

export function DropdownBackdrop({ onClose }: DropdownBackdropProps) {
  return (
    <div
      className="fixed inset-0 z-40"
      onClick={onClose}
    />
  );
}
