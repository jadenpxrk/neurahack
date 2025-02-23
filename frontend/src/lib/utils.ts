import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toEasternMidnight(date: Date): Date {
  // Get Eastern date components
  const easternDateStr = formatInTimeZone(
    date,
    "America/New_York",
    "yyyy-MM-dd"
  );
  const [year, month, day] = easternDateStr.split("-").map(Number);

  // Create date at midnight Eastern time
  const easternDate = new Date();
  easternDate.setFullYear(year, month - 1, day);
  easternDate.setHours(0, 0, 0, 0);

  // Convert to UTC for storage
  const utcTimestamp = formatInTimeZone(
    easternDate,
    "America/New_York",
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );

  return new Date(utcTimestamp);
}
import { format, toZonedTime } from "date-fns-tz";

import { parseISO } from "date-fns";

export function formatEasternDate(
  dateStr: string,
  timeZone: string = "EST"
): string {
  // Parse the ISO date string (assumed to be in yyyy-mm-dd format)
  const date = parseISO(dateStr);
  // Convert the parsed date to the desired timezone
  const zonedDate = toZonedTime(date, timeZone);
  // Format the zoned date into the desired string format "MMM, dd, yyyy"
  return format(zonedDate, "MMM dd, yyyy", { timeZone });
}

export function isDateDisabled(date: Date): boolean {
  const today = toEasternMidnight(new Date());
  const compareDate = toEasternMidnight(date);
  return compareDate > today;
}
