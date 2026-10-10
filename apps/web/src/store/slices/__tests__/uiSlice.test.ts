import { describe, it, expect } from "vitest";
import uiReducer, {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setUnreadNotificationsCount,
  incrementUnreadNotifications,
} from "../uiSlice";

describe("uiSlice", () => {
  const initialUiState = {
    theme: "dark" as const,
    sidebarOpen: true,
    unreadNotificationsCount: 0,
  };

  it("should return the initial state by default", () => {
    const state = uiReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual(initialUiState);
  });

  describe("theme management", () => {
    it("toggles theme between dark and light", () => {
      let state = uiReducer(initialUiState, toggleTheme());
      expect(state.theme).toBe("light");

      state = uiReducer(state, toggleTheme());
      expect(state.theme).toBe("dark");
    });

    it("explicitly sets theme via setTheme action", () => {
      const state = uiReducer(initialUiState, setTheme("light"));
      expect(state.theme).toBe("light");

      const nextState = uiReducer(state, setTheme("dark"));
      expect(nextState.theme).toBe("dark");
    });
  });

  describe("sidebar management", () => {
    it("toggles sidebar visibility", () => {
      const closedState = uiReducer(initialUiState, toggleSidebar());
      expect(closedState.sidebarOpen).toBe(false);

      const openState = uiReducer(closedState, toggleSidebar());
      expect(openState.sidebarOpen).toBe(true);
    });

    it("explicitly sets sidebar state via setSidebarOpen", () => {
      const state = uiReducer(initialUiState, setSidebarOpen(false));
      expect(state.sidebarOpen).toBe(false);

      const nextState = uiReducer(state, setSidebarOpen(true));
      expect(nextState.sidebarOpen).toBe(true);
    });
  });

  describe("notifications counter", () => {
    it("updates unread notifications count via setUnreadNotificationsCount", () => {
      const state = uiReducer(initialUiState, setUnreadNotificationsCount(5));
      expect(state.unreadNotificationsCount).toBe(5);
    });

    it("increments unread notifications count by 1", () => {
      let state = uiReducer(initialUiState, incrementUnreadNotifications());
      expect(state.unreadNotificationsCount).toBe(1);

      state = uiReducer(state, incrementUnreadNotifications());
      expect(state.unreadNotificationsCount).toBe(2);
    });
  });
});
