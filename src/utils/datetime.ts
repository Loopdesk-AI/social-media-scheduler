/**
 * Generates an ISO datetime string for a specific slot
 * @param date - Date string in YYYY-MM-DD format
 * @param hour - Hour of the day (0-23)
 * @returns ISO 8601 datetime string
 */
export function getSlotDateTime(date: string, hour: number): string {
  return `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`;
}

/**
 * Formats an ISO datetime string for display
 * @param iso - ISO 8601 datetime string
 * @returns Formatted string like "Jan 15, 2025 at 3:00 PM"
 */
export function formatDateTimeLabel(iso: string): string {
  const date = new Date(iso);
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  return `${dateStr} at ${timeStr}`;
}

/**
 * Gets the date string in YYYY-MM-DD format
 * @param iso - ISO 8601 datetime string
 * @returns Date string
 */
export function getDateString(iso: string): string {
  const date = new Date(iso);
  return date.toISOString().split('T')[0];
}

/**
 * Gets the hour from an ISO datetime
 * @param iso - ISO 8601 datetime string
 * @returns Hour (0-23)
 */
export function getHourFromISO(iso: string): number {
  return new Date(iso).getUTCHours();
}

/**
 * Checks if a date is in the past
 * @param iso - ISO 8601 datetime string
 * @returns True if the date is before now
 */
export function isPastDate(iso: string): boolean {
  return new Date(iso) < new Date();
}

/**
 * Generates an array of dates for the current week
 * @param startDate - Optional start date, defaults to start of current week
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getWeekDates(startDate?: Date): string[] {
  const start = startDate || getStartOfWeek(new Date());
  const dates: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Gets the start of the week (Sunday) for a given date
 * @param date - Date to find week start for
 * @returns Date representing start of week
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Formats a date string for display
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted string like "Sun, Jan 15"
 */
export function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}
