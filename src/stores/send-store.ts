import { create } from "zustand";

import { PEOPLE } from "@/features/send/people";
import type { CountryCode } from "@/lib/phone";

import { useOnboardingStore } from "./onboarding-store";
import type { Tx } from "./wallet-store";

/** A recipient the server found for a number; `name` is "Haruki M.". */
export type SendRecipient = { name: string; cc: CountryCode; num: string };

export type SendFlow = {
  to: string | null;
  /** The real account behind the number (null for a demo contact). */
  recipient: SendRecipient | null;
  cc: CountryCode;
  num: string;
  via: "phone" | "qr";
  amount: string;
  note: string;
  shouldFail: boolean;
  ref: string;
  /** Made once per send flow and reused when the same transfer is retried. */
  idempotencyKey: string;
  /** The sent transaction, once the server accepted the transfer. */
  sent: Tx | null;
  /** The server's reason when it refused the transfer (shown on the tracking screen). */
  failure: string | null;
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
const KEY_RANDOM_LENGTH = 12;
const RADIX_36 = 36;

function makeRef(counter: number): string {
  return `MC-P2P-${REF_BASE + counter}`;
}

/** 8..64 characters, unique per user: time + random, e.g. "mc-lq3x9k2a-4f8d2k1m9p0z". */
export function makeIdempotencyKey(): string {
  const random = Math.random()
    .toString(RADIX_36)
    .slice(2, 2 + KEY_RANDOM_LENGTH)
    .padEnd(KEY_RANDOM_LENGTH, "0");
  return `mc-${Date.now().toString(RADIX_36)}-${random}`;
}

function newFlow(patch: Partial<SendFlow>, counter: number): SendFlow {
  return {
    to: null,
    recipient: null,
    cc: DEFAULT_CC,
    num: "",
    via: "phone",
    amount: "",
    note: "",
    shouldFail: false,
    ref: makeRef(counter),
    idempotencyKey: makeIdempotencyKey(),
    sent: null,
    failure: null,
    ...patch,
  };
}

export const useSendStore = create<State & Actions>((set, get) => ({
  flow: newFlow({}, 0),
  refCounter: 0,

  beginSend: (opts = {}) => {
    const counter = get().refCounter;
    const person = opts.to ? PEOPLE[opts.to] : undefined;
    const userCc = useOnboardingStore.getState().user?.cc;
    set({
      refCounter: counter + 1,
      flow: newFlow(
        {
          to: person ? opts.to ?? null : null,
          cc: person?.cc ?? opts.cc ?? userCc ?? DEFAULT_CC,
          num: person?.num ?? opts.num ?? "",
          via: opts.via ?? "phone",
        },
        counter,
      ),
    });
  },

  patchFlow: (patch) => set((state) => ({ flow: { ...state.flow, ...patch } })),
}));
