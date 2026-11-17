import { create } from "zustand";

type ToastState = {
  message: string;
  /** Increments on every toast so the same message can re-trigger. */
  id: number;
  show: (message: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: "",
  id: 0,
  show: (message) => set((state) => ({ message, id: state.id + 1 })),
}));

/** Show a toast from anywhere, inside or outside React components. */
export function toast(message: string): void {
  useToastStore.getState().show(message);
}
