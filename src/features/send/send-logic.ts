import type { IconName } from "@/components/ui/icon-paths";
import { COUNTRY_CODES, type CountryCode } from "@/lib/phone";
import type { SendRecipient } from "@/stores/send-store";

import { PEOPLE, findPersonKey } from "./people";

export const SEND_LIMIT = 1000;
export const MIN_SEND = 1;

/** Pause between verification checks, one check per beat. */
export const VERIFY_STEP_MS = 600;
/** Pause between the "reviewing" checks on the tracking screen. */
export const REVIEW_STEP_MS = 850;
/** How long the money takes to "move" on the tracking screen. */
export const TRANSFER_MS = 2200;

/** Money still allowed today under the daily limit (never negative). */
export function sendLeft(sentToday: number): number {
  return Math.max(0, roundCents(SEND_LIMIT - sentToday));
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function money(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "" when the amount can be sent, otherwise the message to show under the amount. */
export function sendError(
  amount: number,
  balance: number,
  sentToday: number,
): string {
  if (amount > balance) {
    return `That's more than your balance of ${money(balance)} USDT.`;
  }
  const left = sendLeft(sentToday);
  if (amount > left) return `You can send ${money(left)} more USDT today.`;
  if (amount > 0 && amount < MIN_SEND) return "The minimum is 1.00 USDT.";
  return "";
}

export type Look = "idle" | "verifying" | "found" | "none" | "self" | "restricted";

export type VerifyOutcome = {
  look: "found" | "none" | "self" | "restricted";
  to: string | null;
  /** Index of the check that fails; -1 means every check passes. */
  failAt: number;
  why: string;
  /** The real account when the server found one. */
  recipient?: SendRecipient;
  /** The server's own words for the failure, shown instead of the stock copy. */
  message?: string;
};

export function phoneChecks(cc: CountryCode): string[] {
  return [
    `Valid ${COUNTRY_CODES[cc].name} mobile number`,
    "Registered on MoriCash",
    "Identity verified",
    "Can receive money",
  ];
}

export const QR_CHECKS: readonly string[] = [
  "Genuine MoriCash code",
  "Code is still valid",
  "Account found",
  "Identity verified",
];

/** Which check fails (if any) for a typed phone number, and what it says. */
export function phoneOutcome(
  self: { cc: CountryCode; num: string } | null,
  cc: CountryCode,
  num: string,
): VerifyOutcome {
  if (self && self.cc === cc && self.num === num) {
    return { look: "self", to: null, failAt: 1, why: "This is your own number" };
  }
  const key = findPersonKey(cc, num);
  if (!key) {
    return {
      look: "none",
      to: null,
      failAt: 1,
      why: "No MoriCash account uses this number",
    };
  }
  if (PEOPLE[key]?.restricted) {
    return {
      look: "restricted",
      to: key,
      failAt: 3,
      why: "This account is limited right now",
    };
  }
  return { look: "found", to: key, failAt: -1, why: "" };
}

export type QrKey = "yuki" | "maria" | "expired" | "self" | "bad";

export type QrOutcome = {
  key: QrKey;
  to: string | null;
  failAt: number;
  why: string;
  icon: IconName | null;
  title: string;
  sub: string;
};

const QR_OUTCOMES: Readonly<Record<QrKey, QrOutcome>> = {
  yuki: { key: "yuki", to: "yuki", failAt: -1, why: "", icon: null, title: "", sub: "" },
  maria: { key: "maria", to: "maria", failAt: -1, why: "", icon: null, title: "", sub: "" },
  expired: {
    key: "expired",
    to: null,
    failAt: 1,
    why: "This code has expired",
    icon: "clock",
    title: "This code has expired",
    sub: "Ask them to open Receive in MoriCash and show you the code again.",
  },
  self: {
    key: "self",
    to: null,
    failAt: 2,
    why: "This is your own code",
    icon: "user",
    title: "That's your own code",
    sub: "Scan the other person's code to pay them.",
  },
  bad: {
    key: "bad",
    to: null,
    failAt: 0,
    why: "Not a MoriCash code",
    icon: "alert",
    title: "This isn't a MoriCash code",
    sub: "Only codes from the MoriCash app can be verified here.",
  },
};

export function qrOutcome(key: QrKey): QrOutcome {
  return QR_OUTCOMES[key];
}

export const TRACK_STAGES: readonly { title: string; desc: string }[] = [
  { title: "Submitted", desc: "You confirmed with your PIN" },
  { title: "Reviewing", desc: "Checking balance, daily limit and security" },
  { title: "Transferring", desc: "Moving the money to the recipient" },
  { title: "Transferred", desc: "Delivered to the recipient" },
];

const ISO_TIME = /^\d{4}-\d{2}-\d{2}T/;
const CLOCK_PART_LENGTH = 2;

/** "09:41:22" for a server timeline time (ISO 8601); anything else is shown as it is. */
export function timelineLabel(time: string): string {
  if (!ISO_TIME.test(time)) return time;
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return time;
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(CLOCK_PART_LENGTH, "0"))
    .join(":");
}

export const REVIEW_ITEMS: readonly { icon: IconName; label: string }[] = [
  { icon: "wallet", label: "Balance available" },
  { icon: "gauge", label: "Within your daily limit" },
  { icon: "shield", label: "Security screening" },
];
