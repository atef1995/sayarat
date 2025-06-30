/**
 * Utility functions for handling dates and timezones
 */

/**
 * Format a date string to local timezone
 * @param dateString - ISO date string from server
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string in user's local timezone
 */
export const formatToLocalDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat("ar-SY", options).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param dateString - ISO date string from server
 * @returns Relative time string in Arabic
 */
export const getRelativeTime = (dateString: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "منذ لحظات";
    if (diffInSeconds < 3600)
      return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400)
      return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    if (diffInSeconds < 2592000)
      return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    if (diffInSeconds < 31536000)
      return `منذ ${Math.floor(diffInSeconds / 2592000)} شهر`;

    return `منذ ${Math.floor(diffInSeconds / 31536000)} سنة`;
  } catch (error) {
    console.error("Error calculating relative time:", error);
    return dateString;
  }
};

/**
 * Get user's current timezone
 * @returns Timezone string (e.g., "Asia/Damascus")
 */
export const getCurrentTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert UTC date to local date with timezone info
 * @param utcDateString - UTC date string
 * @returns Object with local date and timezone info
 */
export const convertToLocalTime = (utcDateString: string) => {
  if (!utcDateString) return null;

  try {
    const utcDate = new Date(utcDateString);
    const timezone = getCurrentTimezone();

    return {
      localDate: utcDate,
      timezone,
      formatted: formatToLocalDate(utcDateString),
      relative: getRelativeTime(utcDateString),
    };
  } catch (error) {
    console.error("Error converting to local time:", error);
    return null;
  }
};
