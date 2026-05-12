import { describe, it, expect } from "vitest";
import { appReducer, initialState } from "../context/appReducer";

describe("appReducer", () => {
  it("should handle SET_ENTRIES", () => {
    const entries = [{ id: "1", type: "in" as const, timestamp: 1000, date: "2024-01-15" }];
    const state = appReducer(initialState, { type: "SET_ENTRIES", payload: entries });
    expect(state.entries).toEqual(entries);
  });

  it("should handle ADD_ENTRY", () => {
    const entry = { id: "1", type: "in" as const, timestamp: 1000, date: "2024-01-15" };
    const state = appReducer(initialState, { type: "ADD_ENTRY", payload: entry });
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]).toEqual(entry);
  });

  it("should handle DELETE_ENTRY", () => {
    const stateWithEntry = appReducer(initialState, {
      type: "SET_ENTRIES",
      payload: [{ id: "1", type: "in" as const, timestamp: 1000, date: "2024-01-15" }],
    });
    const state = appReducer(stateWithEntry, { type: "DELETE_ENTRY", payload: "1" });
    expect(state.entries).toHaveLength(0);
  });

  it("should handle SET_AUTH", () => {
    const state = appReducer(initialState, { type: "SET_AUTH", payload: true });
    expect(state.session.isAuthenticated).toBe(true);
  });

  it("should handle CLEAR_ALL_DATA", () => {
    const stateWithData = appReducer(initialState, {
      type: "SET_ENTRIES",
      payload: [{ id: "1", type: "in" as const, timestamp: 1000, date: "2024-01-15" }],
    });
    const state = appReducer(stateWithData, { type: "CLEAR_ALL_DATA" });
    expect(state.entries).toHaveLength(0);
    expect(state.session.isAuthenticated).toBe(false);
  });

  it("should handle SHOW_TOAST and HIDE_TOAST", () => {
    const state = appReducer(initialState, { type: "SHOW_TOAST", payload: { message: "test", type: "success" } });
    expect(state.ui.toast).toBeDefined();
    expect(state.ui.toast!.visible).toBe(true);
    const hidden = appReducer(state, { type: "HIDE_TOAST" });
    expect(hidden.ui.toast).toBeNull();
  });
});
