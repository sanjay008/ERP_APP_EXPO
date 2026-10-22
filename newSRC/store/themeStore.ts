import { create } from "zustand";
import { getData, storeData } from "../utils/storeData";
import { Keys } from "../utils/Keys";

export type AppThemeMode = "light" | "dark";

type ThemeStore = {
  mode: AppThemeMode;
  hydrated: boolean;
  setMode: (mode: AppThemeMode) => void;
  hydrate: () => Promise<void>;
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: "light",
  hydrated: false,

  setMode: (mode) => {
    set({ mode });
    void storeData(Keys.APP_THEME, mode);
  },

  hydrate: async () => {
    if (get().hydrated) return;
    const saved = await getData(Keys.APP_THEME);
    set({
      mode: saved === "dark" ? "dark" : "light",
      hydrated: true,
    });
  },
}));
