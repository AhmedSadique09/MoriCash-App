const DEFAULT_DECIMALS = 2;
const GROUP_SIZE_RE = /\B(?=(\d{3})+(?!\d))/g;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const pad2 = (n: number): string => String(n).padStart(2, "0");

const groupThousands = (digits: string): string => digits.replace(GROUP_SIZE_RE, ",");

/** en-US grouping with a fixed number of decimals (default 2). Avoids Intl so output is identical on every JS engine. */
export function fmt(n: number, decimals: number = DEFAULT_DECIMALS): string {
  const safe = Number.isFinite(n) ? n : 0;
  const [whole = "0", fraction] = Math.abs(safe).toFixed(decimals).split(".");
  const sign = safe < 0 && Number(`${whole}.${fraction ?? "0"}`) !== 0 ? "-" : "";
  return `${sign}${groupThousands(whole)}${fraction === undefined ? "" : `.${fraction}`}`;
}

/** Live amount display for the keypad: "" -> "0", "1234.5" -> "1,234.5", "12." -> "12." */
export function fmtInput(raw: string): string {
  if (!raw) return "0";
  const [whole = "", fraction] = raw.split(".");
  const trimmed = whole.replace(/^0+(?=\d)/, "");
  const grouped = groupThousands(trimmed === "" ? "0" : trimmed);
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** "09:41" */
export function nowHm(d: Date = new Date()): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "09:41:07" */
export function clockHms(d: Date = new Date()): string {
  return `${nowHm(d)}:${pad2(d.getSeconds())}`;
}

/** "17 Nov 2026 · 09:41" */
export function formatDateLabel(d: Date = new Date()): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${nowHm(d)}`;
}

type LocalCurrency = { code: string; symbol: string; rate: number };

export const LOCAL_CURRENCY: Record<"JP" | "PH", LocalCurrency> = {
  JP: { code: "JPY", symbol: "¥", rate: 150 },
  PH: { code: "PHP", symbol: "₱", rate: 58 },
};

/** USD amount shown in the recipient's currency, no decimals: "¥75,000" */
export function localAmount(country: "JP" | "PH", usd: number): string {
  const { symbol, rate } = LOCAL_CURRENCY[country];
  return `${symbol}${fmt(usd * rate, 0)}`;
}
