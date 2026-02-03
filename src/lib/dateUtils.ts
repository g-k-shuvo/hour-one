/**
 * Shared date utility functions
 * Uses local timezone for consistent user experience
 */

/**
 * Get today's date as YYYY-MM-DD in local timezone
 * (NOT UTC - uses user's local time for correct date display)
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string is today (in local timezone)
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayDate();
}

/**
 * Check if a date string is before today (in local timezone)
 */
export function isPastDate(dateString: string): boolean {
  return dateString < getTodayDate();
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number, hideSeconds: boolean = false): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hideSeconds) {
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}`;
    }
    return `${mins}`;
  }

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration for display (e.g., "1h 30m" or "25m 30s")
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m ${seconds % 60}s`;
}
