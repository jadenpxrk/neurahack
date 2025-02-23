import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toEasternMidnight(date: Date): Date {
  // Get Eastern date in 'yyyy-MM-dd' format
  const easternDateStr = formatInTimeZone(
    date,
    "America/New_York",
    "yyyy-MM-dd"
  );
  // Extract year, month, and day
  const [year, month, day] = easternDateStr.split("-").map(Number);

  // Create a dummy UTC date for the Eastern date (interpreted as midnight UTC)
  const dummyUTC = new Date(Date.UTC(year, month - 1, day));

  // Get the Eastern timezone offset for this dummy date, e.g. "-05:00" or "-04:00"
  const offsetStr = formatInTimeZone(dummyUTC, "America/New_York", "XXX");
  // Parse offset (we use absolute values because Eastern is behind UTC)
  const [offsetHourStr, offsetMinuteStr] = offsetStr.slice(1).split(":");
  const offsetHours = parseInt(offsetHourStr, 10);
  const offsetMinutes = parseInt(offsetMinuteStr, 10);

  // Eastern midnight in UTC is the dummy date plus the offset hours and minutes
  return new Date(Date.UTC(year, month - 1, day, offsetHours, offsetMinutes));
}

export function formatEasternDate(date: Date): string {
  return formatInTimeZone(date, "America/New_York", "MMMM d, yyyy");
}

export function isDateDisabled(date: Date): boolean {
  const today = toEasternMidnight(new Date());
  const compareDate = toEasternMidnight(date);
  return compareDate > today;
}
