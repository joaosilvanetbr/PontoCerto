import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDuration,
  getClockStatus,
  getNextEntryType,
  calculateDayTotal,
  isDateWithinRange,
  getMonthDateRange,
} from "../lib/data";
import type { TimeEntry } from "../types";

const mockEntries: TimeEntry[] = [
  { id: "1", type: "in", timestamp: new Date(2024, 0, 15, 8, 0).getTime(), date: "2024-01-15" },
  { id: "2", type: "lunch-out", timestamp: new Date(2024, 0, 15, 12, 0).getTime(), date: "2024-01-15" },
  { id: "3", type: "lunch-in", timestamp: new Date(2024, 0, 15, 13, 0).getTime(), date: "2024-01-15" },
  { id: "4", type: "out", timestamp: new Date(2024, 0, 15, 17, 0).getTime(), date: "2024-01-15" },
];

describe("formatTime", () => {
  it("should format timestamp to HH:MM", () => {
    const d = new Date(2024, 0, 15, 8, 5).getTime();
    expect(formatTime(d)).toBe("08:05");
  });
});

describe("formatDuration", () => {
  it("should format minutes", () => {
    expect(formatDuration(0)).toBe("0min");
    expect(formatDuration(30)).toBe("30min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h 30min");
  });
});

describe("getClockStatus", () => {
  it("should return off when no entries", () => {
    expect(getClockStatus([], "2024-01-15")).toBe("off");
  });

  it("should return working when last entry is in", () => {
    expect(getClockStatus([mockEntries[0]], "2024-01-15")).toBe("working");
  });

  it("should return off when complete day", () => {
    expect(getClockStatus(mockEntries, "2024-01-15")).toBe("off");
  });
});

describe("getNextEntryType", () => {
  it("should return in when empty", () => {
    expect(getNextEntryType([], "2024-01-15")).toBe("in");
  });

  it("should return null when complete", () => {
    expect(getNextEntryType(mockEntries, "2024-01-15")).toBeNull();
  });
});

describe("calculateDayTotal", () => {
  it("should calculate total worked minutes", () => {
    const total = calculateDayTotal(mockEntries, "2024-01-15");
    expect(total).toBe(480);
  });

  it("should calculate direct journey (in -> out)", () => {
    const entries: TimeEntry[] = [
      { id: "1", type: "in", timestamp: new Date(2024, 0, 15, 8, 0).getTime(), date: "2024-01-15" },
      { id: "2", type: "out", timestamp: new Date(2024, 0, 15, 17, 0).getTime(), date: "2024-01-15" },
    ];
    expect(calculateDayTotal(entries, "2024-01-15")).toBe(540);
  });

  it("should not add invalid totals for incomplete journeys in past dates", () => {
    const entries: TimeEntry[] = [
      { id: "1", type: "in", timestamp: new Date(2024, 0, 15, 8, 0).getTime(), date: "2024-01-15" },
      { id: "2", type: "lunch-out", timestamp: new Date(2024, 0, 15, 12, 0).getTime(), date: "2024-01-15" },
    ];
    expect(calculateDayTotal(entries, "2024-01-15")).toBe(240);
  });

  it("should handle out-of-order input by sorting before calculation", () => {
    const entries: TimeEntry[] = [
      { id: "2", type: "out", timestamp: new Date(2024, 0, 15, 17, 0).getTime(), date: "2024-01-15" },
      { id: "1", type: "in", timestamp: new Date(2024, 0, 15, 8, 0).getTime(), date: "2024-01-15" },
    ];
    expect(calculateDayTotal(entries, "2024-01-15")).toBe(540);
  });
});

describe("date range helpers", () => {
  it("should include boundary dates in range checks", () => {
    expect(isDateWithinRange("2024-02-01", "2024-02-01", "2024-02-29")).toBe(true);
    expect(isDateWithinRange("2024-02-29", "2024-02-01", "2024-02-29")).toBe(true);
  });

  it("should return false outside date range", () => {
    expect(isDateWithinRange("2024-03-01", "2024-02-01", "2024-02-29")).toBe(false);
  });

  it("should return month start/end range", () => {
    const range = getMonthDateRange(new Date(2024, 1, 5));
    expect(range.start).toBe("2024-02-01");
    expect(range.end).toBe("2024-02-29");
  });
});
