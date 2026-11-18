import { create } from "zustand";

import {
  INCOMING_PAYMENTS,
  PEOPLE,
  personName,
  type Person,
} from "@/features/send/people";
import type {
  TransactionDto,
  TransactionStatus,
} from "@/interfaces/wallet.interface";
import { clockHms, formatDateLabel, nowHm } from "@/lib/format";
import { COUNTRY_CODES, type CountryCode } from "@/lib/phone";
import { getApiError } from "@/services/auth.service";
import { walletService } from "@/services/wallet.service";
import { toast } from "@/stores/toast-store";

export type TxType = "deposit" | "sent" | "received";

export type Tx = {
  id: string;
  type: TxType;
  title: string;
  sub?: string;
  asset: "USDT";
  /** Signed: negative when money leaves the wallet. */
  amount: number;
  status: TransactionStatus;
  /** Demo person (`PEOPLE` key). Real transactions carry `whoName` instead. */
  whoKey?: string;
  /** The other side as the backend names it: "Haruki M.". */
  whoName?: string;
  whoCountryCode?: string;
  whoNumber?: string;
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
  /** Loads the wallet and the first page of transactions from the backend and replaces the local copy. Never throws. */
  refresh: () => Promise<void>;
  /** Puts a transfer the backend confirmed on top of the list and sets balance and sentToday. */
  applyTransfer: (tx: Tx, balanceUsdt: number, sentTodayUsdt: number) => void;
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

const REF_BASE = 5100;
const FIRST_PAGE_SIZE = 20;
const HTTP_UNAUTHORIZED = 401;
const LOAD_ERROR_MESSAGE = "Can't load your wallet. Pull to retry.";

const INITIAL_STATE: State = {
  balanceUsdt: 0,
  sentToday: 0,
  isHidden: false,
  hasUnread: false,
  txs: [],
  filter: "all",
  incomingIndex: 0,
};

const roundCents = (n: number): number => Math.round(n * 100) / 100;

/** Local demo ids are t0, t1, t2... Backend rows keep their own ids. */
const nextId = (txs: readonly Tx[]): string => `t${txs.length}`;

const personLabel = (key: string): string => {
  const person = PEOPLE[key];
  return person ? personName(person) : "Unknown";
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** "Today · 09:41", "Yesterday · 18:20", or "15 Nov · 18:20" for older rows. */
function whenLabelOf(created: Date, now: Date): string {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (isSameDay(created, now)) return `Today · ${nowHm(created)}`;
  if (isSameDay(created, yesterday)) return `Yesterday · ${nowHm(created)}`;
  const [date = "", time = ""] = formatDateLabel(created).split(" · ");
  return `${date.split(" ").slice(0, 2).join(" ")} · ${time}`;
}

/** Second line of a list row for money moved between people: the note, else the direction. */
function rowSubtitle(dto: TransactionDto): string | undefined {
  if (dto.type === "deposit") return undefined;
  return dto.note || (dto.type === "sent" ? "Sent" : "Received");
}

/** Backend transaction -> what the screens render. */
export function mapTransaction(dto: TransactionDto): Tx {
  const created = new Date(dto.createdAt);
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    sub: dto.sub ?? rowSubtitle(dto),
    asset: dto.asset,
    amount: dto.amount,
    status: dto.status,
    whoName: dto.whoName,
    whoCountryCode: dto.whoCountryCode,
    whoNumber: dto.whoNumber,
    note: dto.note,
    via: dto.via,
    ref: dto.ref,
    whenLabel: whenLabelOf(created, new Date()),
    dateLabel: formatDateLabel(created),
    method: dto.method,
    fee: dto.fee,
    timeline: dto.timeline.length
      ? dto.timeline.map(({ title, time }) => ({
          title,
          time: clockHms(new Date(time)),
        }))
      : undefined,
  };
}

const isCountryCode = (value: string | undefined): value is CountryCode =>
  value !== undefined && Object.keys(COUNTRY_CODES).includes(value);

/** The other side of a transaction: a demo person, or the real one the backend named. */
export function txPerson(tx: Tx): Person | undefined {
  if (tx.whoKey) return PEOPLE[tx.whoKey];
  if (!tx.whoName) return undefined;
  const [first = "", ...rest] = tx.whoName.split(" ");
  return {
    key: tx.id,
    first,
    last: rest.join(" "),
    cc: isCountryCode(tx.whoCountryCode) ? tx.whoCountryCode : "+81",
    num: tx.whoNumber ?? "",
    since: "",
  };
}

async function fetchWalletSnapshot(): Promise<
  Pick<State, "balanceUsdt" | "sentToday" | "txs">
> {
  const [wallet, page] = await Promise.all([
    walletService.getWallet(),
    walletService.listTransactions({ filter: "all", limit: FIRST_PAGE_SIZE }),
  ]);
  return {
    balanceUsdt: wallet.balanceUsdt,
    sentToday: wallet.sentTodayUsdt,
    txs: page.items.map((item) => mapTransaction(item)),
  };
}

export const useWalletStore = create<State & Actions>((set, get) => ({
  ...INITIAL_STATE,

  toggleHidden: () => set((s) => ({ isHidden: !s.isHidden })),

  setFilter: (filter) => set({ filter }),

  markRead: () => set({ hasUnread: false }),

  refresh: async () => {
    try {
      set(await fetchWalletSnapshot());
    } catch (error) {
      // A 401 already logs the user out; no toast over the login screen.
      if (getApiError(error)?.status !== HTTP_UNAUTHORIZED) toast(LOAD_ERROR_MESSAGE);
    }
  },

  applyTransfer: (tx, balanceUsdt, sentTodayUsdt) =>
    set((s) => ({
      balanceUsdt,
      sentToday: sentTodayUsdt,
      txs: [tx, ...s.txs.filter((item) => item.id !== tx.id)],
    })),

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
