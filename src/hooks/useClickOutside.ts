import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook that handles clicking outside of the specified element(s)
 * Uses document event listener instead of a blocking backdrop
 * Supports multiple refs for cases like portals where content is in different DOM locations
 *
 * IMPORTANT: The handler function should be memoized using useCallback to avoid
 * re-registering the event listener on every render. Example:
 *
 * ```tsx
 * const handleClose = useCallback(() => setIsOpen(false), []);
 * useClickOutside(ref, handleClose, isOpen);
 * ```
 *
 * @param refs - Single ref or array of refs to elements that should not trigger close
 * @param handler - Callback to invoke when clicking outside (should be wrapped in useCallback)
 * @param enabled - Whether the click outside handler is active (default: true)
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled: boolean = true
) {
  // Store handler in ref to avoid effect re-running on handler change
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const refsArray = Array.isArray(refs) ? refs : [refs];

      // Check if click is inside any of the refs
      const isInside = refsArray.some(ref => {
        return ref.current && ref.current.contains(event.target as Node);
      });

      if (!isInside) {
        handlerRef.current();
      }
    };

    // Use mousedown instead of click to handle before other click handlers
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refs, enabled]); // handler is accessed via ref, no need in deps
}
