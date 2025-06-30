import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ar";

// Extend dayjs with plugins
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.extend(timezone);
dayjs.extend(utc);

dayjs.updateLocale("ar", {
  relativeTime: {
    future: "في %s",
    past: "منذ %s",
    s: "ثوان",
    m: "دقيقة",
    mm: "%d دقائق",
    h: "ساعة",
    hh: "%d ساعات",
    d: "يوم",
    dd: "%d أيام",
    M: "شهر",
    MM: "%d أشهر",
    y: "سنة",
    yy: "%d سنوات",
  },
});

dayjs.locale("ar");

const timeTranslations = {
  justNow: "الآن",
  minutesAgo: "دقيقة مضت",
  minutesAgoPlural: "دقائق مضت",
};

// Get user's timezone
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Create a standardized date for sending to backend
export const createStandardDate = () => {
  const now = dayjs();
  return {
    utc: now.utc().toISOString(), // Always send UTC to backend
    timezone: getUserTimezone(), // User's timezone for reference
    local: now.format("YYYY-MM-DD HH:mm:ss"), // Local formatted time
    timestamp: now.valueOf(), // Timestamp for calculations
  };
};

// Format date for display (converts UTC to local)
export const formatDisplayDate = (
  utcDate: string,
  format: string = "YYYY-MM-DD HH:mm"
) => {
  return dayjs.utc(utcDate).tz(getUserTimezone()).format(format);
};

// Format relative time (converts UTC to local first)
export const formatRelativeTime = (utcDate: string) => {
  const date = dayjs.utc(utcDate).tz(getUserTimezone());
  const now = dayjs();
  const diffMinutes = now.diff(date, "minute");
  const diffHours = now.diff(date, "hour");

  // Less than a minute
  if (diffMinutes < 1) {
    return timeTranslations.justNow;
  }

  // Less than an hour
  if (diffHours < 1) {
    if (diffMinutes === 1) {
      return `${diffMinutes} ${timeTranslations.minutesAgo}`;
    }
    return `${diffMinutes} ${timeTranslations.minutesAgoPlural}`;
  }

  // More than an hour
  return date.fromNow();
};

// Format message time (your existing function but enhanced)
export const formatMessageTime = (timestamp: string) => {
  return formatRelativeTime(timestamp);
};

// Format listing time with more details
export const formatListingTime = (utcDate: string) => {
  const date = dayjs.utc(utcDate).tz(getUserTimezone());
  const now = dayjs();
  const diffDays = now.diff(date, "day");

  if (diffDays === 0) {
    return `اليوم ${date.format("HH:mm")}`;
  } else if (diffDays === 1) {
    return `أمس ${date.format("HH:mm")}`;
  } else if (diffDays < 7) {
    return date.fromNow();
  } else {
    return date.format("DD/MM/YYYY HH:mm");
  }
};

// Validate if date is valid
export const isValidDate = (date: string) => {
  return dayjs(date).isValid();
};

// Get date range for filters
export const getDateRange = (period: "today" | "week" | "month" | "year") => {
  const now = dayjs();

  switch (period) {
    case "today":
      return {
        start: now.startOf("day").utc().toISOString(),
        end: now.endOf("day").utc().toISOString(),
      };
    case "week":
      return {
        start: now.startOf("week").utc().toISOString(),
        end: now.endOf("week").utc().toISOString(),
      };
    case "month":
      return {
        start: now.startOf("month").utc().toISOString(),
        end: now.endOf("month").utc().toISOString(),
      };
    case "year":
      return {
        start: now.startOf("year").utc().toISOString(),
        end: now.endOf("year").utc().toISOString(),
      };
    default:
      return {
        start: now.startOf("day").utc().toISOString(),
        end: now.endOf("day").utc().toISOString(),
      };
  }
};
