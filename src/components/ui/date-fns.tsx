import { format as dfFormat, parseISO, formatISO, addDays, subDays, isBefore, isAfter, startOfToday, endOfDay } from 'date-fns';

/**
 * Re-exports and small wrappers around date-fns to provide a stable import
 * surface for the components in this folder.
 *
 * Consumers can import helpers like:
 * import { formatDateDisplay, parseISO, addDays } from './ui/date-fns'
 */

export { parseISO, formatISO, addDays, subDays, isBefore, isAfter, startOfToday, endOfDay };

/**
 * Format a Date (or ISO string) for display with a sane default pattern.
 * Default pattern uses date-fns `PPP` (e.g. "January 1st, 2020").
 */
export function formatDateDisplay(date?: Date | string | null, pattern = "PPP"): string {
	if (!date) return "";
	const d = typeof date === 'string' ? parseISO(date) : date;
	try {
		return dfFormat(d, pattern as string);
	} catch (e) {
		// Fallback to toString so consumers don't crash if parse fails
		return String(d);
	}
}

/**
 * Format a Date to a short time string like "12:30 PM" using `p` token.
 */
export function formatTime(date?: Date | string | null): string {
	if (!date) return "";
	const d = typeof date === 'string' ? parseISO(date) : date;
	try {
		return dfFormat(d, 'p');
	} catch (e) {
		return String(d);
	}
}

export default {
	formatDateDisplay,
	formatTime,
	parseISO,
	formatISO,
	addDays,
	subDays,
	isBefore,
	isAfter,
	startOfToday,
	endOfDay,
};
