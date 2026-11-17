import { create } from "zustand";

export const LANGUAGES = ["EN", "日本語", "Filipino"] as const;
export type Language = (typeof LANGUAGES)[number];

type SettingsState = {
  lang: Language;
  /** Moves to the next language and returns it. */
  cycleLanguage: () => Language;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  lang: "EN",
  cycleLanguage: () => {
    const nextIndex = (LANGUAGES.indexOf(get().lang) + 1) % LANGUAGES.length;
    const next = LANGUAGES[nextIndex];
    set({ lang: next });
    return next;
  },
}));
