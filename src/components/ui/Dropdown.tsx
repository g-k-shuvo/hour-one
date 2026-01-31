import { ReactNode, useRef, useCallback } from 'react';
import { useDropdownTheme } from '@/hooks/useTheme';
import { useClickOutside } from '@/hooks/useClickOutside';

interface DropdownProps {
  children: ReactNode;
  className?: string;
  position?: 'left' | 'right';
  width?: string;
}

export function Dropdown({ children, className = '', position = 'left', width = 'w-44' }: DropdownProps) {
  const { dropdown } = useDropdownTheme();

  const positionClass = position === 'right' ? 'right-0' : 'left-0';

  return (
    <div
      className={`absolute ${positionClass} top-full mt-1 z-50 ${width} rounded-lg ${dropdown} py-1.5 shadow-xl ${className}`}
      style={{ animation: 'dropdownFadeIn 150ms ease-out' }}
    >
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
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function DropdownContainer({ children, isOpen, onClose, className = '' }: DropdownContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useClickOutside(containerRef, handleClose, isOpen);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
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
