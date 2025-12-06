/**
 * Get the user's current timezone offset in the format "GMT+/-HH:MM"
 */
export function getCurrentTimezone(): string {
  const offset = -new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? "+" : "-";

  return `GMT${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Get the user's timezone name (e.g., "America/Los_Angeles")
 */
export function getTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get today's date with time set to midnight
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Convert a date to IST (India Standard Time)
 */
export function convertToIST(date: Date): Date {
  // IST is UTC+5:30
  const istOffset = 5.5 * 60; // 5 hours and 30 minutes in minutes
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + istOffset * 60000);
}

/**
 * Format a date and time for the API (ISO format in IST)
 */
export function formatForAPI(
  date: Date,
  time: string,
  period: "AM" | "PM",
): string {
  // Parse the time
  const [hours, minutes] = time.split(":").map(Number);

  // Convert to 24-hour format
  let hour24 = hours;
  if (period === "AM" && hours === 12) {
    hour24 = 0;
  } else if (period === "PM" && hours !== 12) {
    hour24 = hours + 12;
  }

  // Create a new date with the selected time
  const scheduledDate = new Date(date);
  scheduledDate.setHours(hour24, minutes, 0, 0);

  // Convert to IST for storage
  const istDate = convertToIST(scheduledDate);

  // Return ISO string
  return istDate.toISOString();
}

/**
 * Validate time format (HH:MM) for 12-hour format (1-12 hours)
 */
export function isValidTimeFormat(time: string): boolean {
  // Match 12-hour format: 1:00-12:59 with optional leading zero
  const match = time.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])$/);
  return match !== null;
}

/**
 * Validate and normalize time input to HH:MM format
 * Returns null if invalid, normalized time string if valid
 */
export function validateAndNormalizeTime(time: string): string | null {
  const match = time.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = match[2];

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}
