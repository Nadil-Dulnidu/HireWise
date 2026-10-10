import { describe, it, expect } from "vitest";
import { cn, getGoogleCalendarUrl } from "../utils";

describe("cn utility", () => {
  it("merges standard class names correctly", () => {
    const result = cn("flex", "items-center", "justify-between");
    expect(result).toBe("flex items-center justify-between");
  });

  it("handles conditional and falsy class values", () => {
    const isHidden = false;
    const isVisible = true;
    const result = cn(
      "base-class",
      isHidden && "hidden",
      isVisible && "block",
      undefined,
      null,
      false
    );
    expect(result).toBe("base-class block");
  });

  it("resolves conflicting Tailwind CSS utility classes using twMerge", () => {
    const result = cn("p-2", "p-4", "text-red-500", "text-blue-500");
    expect(result).toBe("p-4 text-blue-500");
  });

  it("handles arrays and nested class definitions", () => {
    const result = cn(["px-2", "py-1"], ["text-sm", false && "font-bold"]);
    expect(result).toBe("px-2 py-1 text-sm");
  });
});

describe("getGoogleCalendarUrl", () => {
  it("generates a valid calendar URL with required title and dates", () => {
    const startTime = new Date("2026-10-15T10:00:00Z");
    const endTime = new Date("2026-10-15T11:00:00Z");

    const url = getGoogleCalendarUrl({
      title: "Technical Interview - Full Stack",
      startTime,
      endTime,
    });

    expect(url).toContain("https://calendar.google.com/calendar/render?");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("text=Technical+Interview+-+Full+Stack");
    expect(url).toContain("dates=20261015T100000Z%2F20261015T110000Z");
  });

  it("includes description and location parameters when provided", () => {
    const url = getGoogleCalendarUrl({
      title: "Design Review",
      startTime: "2026-11-01T14:00:00Z",
      endTime: "2026-11-01T15:00:00Z",
      description: "Meeting link: https://meet.google.com/abc-xyz",
      location: "Google Meet",
    });

    expect(url).toContain("details=Meeting+link%3A+https%3A%2F%2Fmeet.google.com%2Fabc-xyz");
    expect(url).toContain("location=Google+Meet");
  });

  it("returns fallback URL when invalid date format causes an error", () => {
    const url = getGoogleCalendarUrl({
      title: "Invalid Event",
      // @ts-expect-error test invalid date
      startTime: { invalid: true },
      // @ts-expect-error test invalid date
      endTime: { invalid: true },
    });

    expect(url).toBe("https://calendar.google.com");
  });
});
