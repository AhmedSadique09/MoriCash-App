import type { CountryCode } from "@/lib/phone";

export type Person = {
  key: string;
  first: string;
  last: string;
  cc: CountryCode;
  num: string;
  since: string;
  restricted?: boolean;
};

/** MoriCash account directory. Server-side in the real app; never shown as a list. */
export const PEOPLE: Readonly<Record<string, Person>> = {
  yuki: { key: "yuki", first: "Yuki", last: "Tanaka", cc: "+81", num: "9024681357", since: "2024" },
  maria: { key: "maria", first: "Maria", last: "Santos", cc: "+63", num: "9175550123", since: "2025" },
  kenji: { key: "kenji", first: "Kenji", last: "Watanabe", cc: "+81", num: "8031415926", since: "2025" },
  sora: {
    key: "sora",
    first: "Sora",
    last: "Ito",
    cc: "+81",
    num: "9055550000",
    since: "2025",
    restricted: true,
  },
};

type NameParts = { first: string; last?: string };

/** "Yuki Tanaka" */
export function personName(p: NameParts): string {
  return `${p.first} ${p.last ?? ""}`.trim();
}

/** "YT" (first letter of first and last name) */
export function personInitials(p: NameParts): string {
  const first = (p.first[0] ?? "?").toUpperCase();
  const last = (p.last?.[0] ?? "").toUpperCase();
  return `${first}${last}`;
}

export function findPersonKey(cc: CountryCode, num: string): string | null {
  const match = Object.values(PEOPLE).find((p) => p.cc === cc && p.num === num);
  return match ? match.key : null;
}

export type DemoNumber = {
  cc: CountryCode;
  num: string;
  label: string;
  tone: "pos" | "neg" | "neu";
};

const UNREGISTERED_NUMBER = "8000000000";

/** Numbers the reviewer can tap to try each verification outcome. */
export function demoNumbers(self: { cc: CountryCode; num: string } | null): DemoNumber[] {
  const { yuki, maria, sora } = PEOPLE;
  const base: DemoNumber[] = [
    { cc: yuki.cc, num: yuki.num, label: "Registered · Japan", tone: "pos" },
    { cc: maria.cc, num: maria.num, label: "Registered · Philippines", tone: "pos" },
    { cc: "+81", num: UNREGISTERED_NUMBER, label: "Not registered", tone: "neg" },
    { cc: sora.cc, num: sora.num, label: "Can't receive money", tone: "neg" },
  ];
  return self ? [...base, { cc: self.cc, num: self.num, label: "Your own number", tone: "neu" }] : base;
}

/** Demo "someone sends you USDT" cycle, in order. */
export const INCOMING_PAYMENTS: readonly { personKey: string; amount: number; note: string }[] = [
  { personKey: "kenji", amount: 20, note: "Lunch, thanks!" },
  { personKey: "maria", amount: 35, note: "Concert ticket" },
  { personKey: "yuki", amount: 12.5, note: "" },
];
