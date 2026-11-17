import { create } from "zustand";

import { INCOMING_PAYMENTS, PEOPLE, personName } from "@/features/send/people";
import { formatDateLabel, nowHm } from "@/lib/format";

export type TxType = "deposit" | "sent" | "received";

export type Tx = {
  id: string;
  type: TxType;
  title: string;
  sub?: string;
  asset: "USDT";
  /** Signed: negative when money leaves the wallet. */
  amount: number;
  status: "Completed";
  whoKey?: string;
  note?: string;
  via?: "phone" | "qr";
  ref: string;
  /** "Today · 09:41" | "Yesterday · 18:20" */
  whenLabel: string;
  dateLabel: string;
  method?: string;
  fee?: string;
  timeline?: { title: string; time: string }[];
  highlightedAt?: number;
};

export type TxFilter = "all" | "sent" | "received";

type Incoming = { personKey: string; amount: number; note: string };

type State = {
  balanceUsdt: number;
  sentToday: number;
  isHidden: boolean;
  hasUnread: boolean;
  txs: Tx[];
  filter: TxFilter;
  incomingIndex: number;
};

type SentInput = {
  whoKey: string;
  amount: number;
  note: string;
  via: "phone" | "qr";
  ref: string;
  timeline: { title: string; time: string }[];
};

type Actions = {
  toggleHidden: () => void;
  setFilter: (f: TxFilter) => void;
  markRead: () => void;
  /** Deducts the balance, adds to sentToday, prepends a "sent" tx and returns it. */
  recordSent: (a: SentInput) => Tx;
  /** Adds to the balance, flags unread, prepends a highlighted "received" tx and returns it. */
  receiveFrom: (personKey: string, amount: number, note: string) => Tx;
  /** Next demo incoming payment, cycling through INCOMING_PAYMENTS. */
  nextIncoming: () => Incoming;
  reset: () => void;
};

/** How long a freshly received row stays highlighted. */
export const HIGHLIGHT_MS = 10000;

const START_BALANCE_USDT = 500;
const REF_BASE = 5100;

const SEED_DEPOSIT: Tx = {
  id: "t0",
  type: "deposit",
  title: "Added USDT",
  sub: "Bank transfer",
  asset: "USDT",
  amount: 500,
  status: "Completed",
  ref: "MC-DEP-1187",
  whenLabel: "Yesterday · 18:20",
  dateLabel: "15 Nov 2026 · 18:20",
  method: "Bank transfer",
  fee: "Free",
};

const INITIAL_STATE: State = {
  balanceUsdt: START_BALANCE_USDT,
  sentToday: 0,
  isHidden: false,
  hasUnread: false,
  txs: [SEED_DEPOSIT],
  filter: "all",
  incomingIndex: 0,
};

const roundCents = (n: number): number => Math.round(n * 100) / 100;

/** Ids are t0 (seed), t1, t2... Transactions are only ever prepended, so the length is the next id. */
const nextId = (txs: readonly Tx[]): string => `t${txs.length}`;

const personLabel = (key: string): string => {
  const person = PEOPLE[key];
  return person ? personName(person) : "Unknown";
};

export const useWalletStore = create<State & Actions>((set, get) => ({
  ...INITIAL_STATE,

  toggleHidden: () => set((s) => ({ isHidden: !s.isHidden })),

  setFilter: (filter) => set({ filter }),

  markRead: () => set({ hasUnread: false }),

  recordSent: ({ whoKey, amount, note, via, ref, timeline }) => {
    const { txs } = get();
    const tx: Tx = {
      id: nextId(txs),
      type: "sent",
      title: `Sent to ${personLabel(whoKey)}`,
      asset: "USDT",
      amount: -amount,
      status: "Completed",
      whoKey,
      note: note.trim(),
      via,
      ref,
      whenLabel: `Today · ${nowHm()}`,
      dateLabel: formatDateLabel(),
      timeline,
    };
    set((s) => ({
      balanceUsdt: roundCents(s.balanceUsdt - amount),
      sentToday: roundCents(s.sentToday + amount),
      txs: [tx, ...s.txs],
    }));
    return tx;
  },

  receiveFrom: (personKey, amount, note) => {
    const { txs } = get();
    const tx: Tx = {
      id: nextId(txs),
      type: "received",
      title: `Received from ${personLabel(personKey)}`,
      asset: "USDT",
      amount,
      status: "Completed",
      whoKey: personKey,
      note,
      via: "phone",
      ref: `MC-P2P-${REF_BASE + txs.length}`,
      whenLabel: `Today · ${nowHm()}`,
      dateLabel: formatDateLabel(),
      highlightedAt: Date.now(),
    };
    set((s) => ({
      balanceUsdt: roundCents(s.balanceUsdt + amount),
      hasUnread: true,
      txs: [tx, ...s.txs],
    }));
    return tx;
  },

  nextIncoming: () => {
    const { incomingIndex } = get();
    const payment = INCOMING_PAYMENTS[incomingIndex % INCOMING_PAYMENTS.length];
    set({ incomingIndex: incomingIndex + 1 });
    return payment;
  },

  reset: () => set({ ...INITIAL_STATE }),
}));
