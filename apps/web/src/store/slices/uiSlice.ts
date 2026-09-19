import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  theme: "dark" | "light";
  sidebarOpen: boolean;
  unreadNotificationsCount: number;
}

const initialState: UiState = {
  theme: "dark",
  sidebarOpen: true,
  unreadNotificationsCount: 0,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
    setTheme: (state, action: PayloadAction<"dark" | "light">) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setUnreadNotificationsCount: (state, action: PayloadAction<number>) => {
      state.unreadNotificationsCount = action.payload;
    },
    incrementUnreadNotifications: (state) => {
      state.unreadNotificationsCount += 1;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setUnreadNotificationsCount,
  incrementUnreadNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
