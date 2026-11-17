import { create } from "zustand";

import { PEOPLE } from "@/features/send/people";
import type { CountryCode } from "@/lib/phone";

import { useOnboardingStore } from "./onboarding-store";

export type SendFlow = {
  to: string | null;
  cc: CountryCode;
  num: string;
  via: "phone" | "qr";
  amount: string;
  note: string;
  shouldFail: boolean;
  ref: string;
};

type BeginOptions = {
  to?: string;
  via?: "phone" | "qr";
  cc?: CountryCode;
  num?: string;
};

type State = { flow: SendFlow; refCounter: number };

type Actions = {
  beginSend(opts?: BeginOptions): void;
  patchFlow(patch: Partial<SendFlow>): void;
};

const DEFAULT_CC: CountryCode = "+81";
const REF_BASE = 5100;

function makeRef(counter: number): string {
  return `MC-P2P-${REF_BASE + counter}`;
}

const INITIAL_FLOW: SendFlow = {
  to: null,
  cc: DEFAULT_CC,
  num: "",
  via: "phone",
  amount: "",
  note: "",
  shouldFail: false,
  ref: makeRef(0),
};

export const useSendStore = create<State & Actions>((set, get) => ({
  flow: INITIAL_FLOW,
  refCounter: 0,

  beginSend: (opts = {}) => {
    const counter = get().refCounter;
    const person = opts.to ? PEOPLE[opts.to] : undefined;
    const userCc = useOnboardingStore.getState().user?.cc;
    set({
      refCounter: counter + 1,
      flow: {
        to: person ? opts.to ?? null : null,
        cc: person?.cc ?? opts.cc ?? userCc ?? DEFAULT_CC,
        num: person?.num ?? opts.num ?? "",
        via: opts.via ?? "phone",
        amount: "",
        note: "",
        shouldFail: false,
        ref: makeRef(counter),
      },
    });
  },

  patchFlow: (patch) => set((state) => ({ flow: { ...state.flow, ...patch } })),
}));
