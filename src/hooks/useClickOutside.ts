import { useEffect, RefObject } from 'react';

/**
 * Hook that handles clicking outside of the specified element(s)
 * Uses document event listener instead of a blocking backdrop
 * Supports multiple refs for cases like portals where content is in different DOM locations
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const refsArray = Array.isArray(refs) ? refs : [refs];

      // Check if click is inside any of the refs
      const isInside = refsArray.some(ref => {
        return ref.current && ref.current.contains(event.target as Node);
      });

      if (!isInside) {
        handler();
      }
    };

    // Use mousedown instead of click to handle before other click handlers
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refs, handler, enabled]);
}
