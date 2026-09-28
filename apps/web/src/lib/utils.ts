import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates an instant, zero-config Google Calendar Web Intent URL.
 * When clicked by a user (candidate or interviewer), it opens Google Calendar
 * with the interview event, times, meeting link, and notes pre-filled.
 */
export function getGoogleCalendarUrl(options: {
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  description?: string;
  location?: string;
}): string {
  try {
    const formatUtc = (dateInput: string | Date) => {
      const d = new Date(dateInput);
      return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    };

    const startStr = formatUtc(options.startTime);
    const endStr = formatUtc(options.endTime);

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: options.title,
      dates: `${startStr}/${endStr}`,
    });

    if (options.description) {
      params.set("details", options.description);
    }
    if (options.location) {
      params.set("location", options.location);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (e) {
    console.error("Error generating Google Calendar URL:", e);
    return "https://calendar.google.com";
  }
}
