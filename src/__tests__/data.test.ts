import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDuration,
  getClockStatus,
  getNextEntryType,
  calculateDayTotal,
  exportToCSV,
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
});
