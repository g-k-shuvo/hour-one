import { useState, useEffect, useCallback, RefObject } from 'react';

interface Position {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'right';
}

interface PositionStyles {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

interface UseAdaptivePositionOptions {
  triggerRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  preferredVertical?: 'top' | 'bottom';
  preferredHorizontal?: 'left' | 'right';
  offset?: number;
  /** Estimated height of dropdown if content hasn't rendered yet */
  estimatedHeight?: number;
  /** Estimated width of dropdown if content hasn't rendered yet */
  estimatedWidth?: number;
}

interface UseAdaptivePositionResult {
  position: Position;
  styles: PositionStyles;
  positionClasses: string;
}

export function useAdaptivePosition({
  triggerRef,
  contentRef,
  isOpen,
  preferredVertical = 'bottom',
  preferredHorizontal = 'left',
  offset = 4,
  estimatedHeight = 200,
  estimatedWidth = 200,
}: UseAdaptivePositionOptions): UseAdaptivePositionResult {
  const [position, setPosition] = useState<Position>({
    vertical: preferredVertical,
    horizontal: preferredHorizontal,
  });

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentHeight = contentRef.current?.offsetHeight || estimatedHeight;
    const contentWidth = contentRef.current?.offsetWidth || estimatedWidth;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate available space in each direction
    const spaceBelow = viewportHeight - triggerRect.bottom - offset;
    const spaceAbove = triggerRect.top - offset;
    const spaceRight = viewportWidth - triggerRect.left;
    const spaceLeft = triggerRect.right;

    // Determine vertical position
    let vertical: 'top' | 'bottom';
    if (preferredVertical === 'bottom') {
      // Prefer bottom, but flip to top if not enough space below and more space above
      vertical = spaceBelow < contentHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    } else {
      // Prefer top, but flip to bottom if not enough space above and more space below
      vertical = spaceAbove < contentHeight && spaceBelow > spaceAbove ? 'bottom' : 'top';
    }

    // Determine horizontal position
    let horizontal: 'left' | 'right';
    if (preferredHorizontal === 'left') {
      // Prefer left-aligned, but switch to right-aligned if would overflow
      horizontal = triggerRect.left + contentWidth > viewportWidth && spaceLeft > contentWidth ? 'right' : 'left';
    } else {
      // Prefer right-aligned, but switch to left-aligned if would overflow
      horizontal = triggerRect.right - contentWidth < 0 && spaceRight > contentWidth ? 'left' : 'right';
    }

    setPosition({ vertical, horizontal });
  }, [triggerRef, contentRef, preferredVertical, preferredHorizontal, offset, estimatedHeight, estimatedWidth]);

  useEffect(() => {
    if (isOpen) {
      // Calculate immediately
      calculatePosition();

      // Recalculate after a frame to account for content rendering
      const frameId = requestAnimationFrame(calculatePosition);

      // Also listen for resize
      window.addEventListener('resize', calculatePosition);

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isOpen, calculatePosition]);

  // Generate CSS classes for positioning (mt-2/mb-2 to accommodate arrow)
  const positionClasses = [
    position.vertical === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
    position.horizontal === 'left' ? 'left-0' : 'right-0',
  ].join(' ');

  // Generate inline styles (for cases where more control is needed)
  const styles: PositionStyles = {};
  if (position.vertical === 'bottom') {
    styles.top = '100%';
  } else {
    styles.bottom = '100%';
  }
  if (position.horizontal === 'left') {
    styles.left = '0';
  } else {
    styles.right = '0';
  }

  return { position, styles, positionClasses };
}
