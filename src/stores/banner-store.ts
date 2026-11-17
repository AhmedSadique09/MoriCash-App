import { create } from "zustand";

export type BannerPayload = {
  personKey: string;
  title: string;
  subtitle: string;
};

type BannerState = {
  /** Increments on every banner so a repeat re-triggers the slide and timer. */
  id: number;
  /** Kept after hiding so the slide-out still shows the last content. */
  banner: BannerPayload | null;
  isVisible: boolean;
  show: (payload: BannerPayload) => void;
  hide: () => void;
};

export const useBannerStore = create<BannerState>((set) => ({
  id: 0,
  banner: null,
  isVisible: false,
  show: (payload) =>
    set((state) => ({ banner: payload, id: state.id + 1, isVisible: true })),
  hide: () => set({ isVisible: false }),
}));

/** Show the in-app "notification" banner from anywhere (mounted via BannerHost). */
export function showBanner(payload: BannerPayload): void {
  useBannerStore.getState().show(payload);
}
