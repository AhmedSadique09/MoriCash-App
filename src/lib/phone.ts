export type CountryCode = "+81" | "+63";

type CountryInfo = {
  iso: "JP" | "PH";
  name: string;
  length: 10;
  example: string;
  hint: string;
};

type PhoneRule = {
  /** Digit group sizes used when formatting as you type. */
  groups: readonly number[];
  separator: string;
  /** Valid leading digits of a mobile number. */
  prefix: RegExp;
  /** How many digits are needed before the prefix can be judged. */
  prefixLength: number;
  error: string;
};

const MOBILE_LENGTH = 10;

export const COUNTRY_CODES: Record<CountryCode, CountryInfo> = {
  "+81": {
    iso: "JP",
    name: "Japan",
    length: MOBILE_LENGTH,
    example: "90-1234-5678",
    hint: "Japanese mobile numbers start with 70, 80 or 90.",
  },
  "+63": {
    iso: "PH",
    name: "Philippines",
    length: MOBILE_LENGTH,
    example: "917 123 4567",
    hint: "Philippine mobile numbers start with 9.",
  },
};

const PHONE_RULES: Record<CountryCode, PhoneRule> = {
  "+81": {
    groups: [2, 4, 4],
    separator: "-",
    prefix: /^[789]0/,
    prefixLength: 2,
    error: "Japanese mobile numbers have 10 digits after +81 and start with 70, 80 or 90.",
  },
  "+63": {
    groups: [3, 3, 4],
    separator: " ",
    prefix: /^9/,
    prefixLength: 1,
    error: "Philippine mobile numbers have 10 digits and start with 9.",
  },
};

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

const DIAL_PREFIX: Record<CountryCode, string> = { "+81": "81", "+63": "63" };

/** Drops a leading "81"/"63" (only the selected country's when `cc` is given). */
function stripDialPrefix(digits: string, cc?: CountryCode): string {
  const prefixes = cc ? [DIAL_PREFIX[cc]] : Object.values(DIAL_PREFIX);
  const prefix = prefixes.find((candidate) => digits.startsWith(candidate));
  return prefix ? digits.slice(prefix.length) : digits;
}

const stripTrunkZero = (digits: string): string => digits.replace(/^0/, "");

/**
 * Keeps digits only, caps at 10 digits and drops one leading 0 (trunk prefix).
 * A paste like "+81 90-1234-5678" is longer than 10 digits, so its country
 * prefix is removed first (the selected `cc`'s, otherwise either one).
 */
export function normalizeNational(raw: string, cc?: CountryCode): string {
  const digits = digitsOnly(raw);
  const national = digits.length > MOBILE_LENGTH ? stripDialPrefix(digits, cc) : digits;
  return stripTrunkZero(national).slice(0, MOBILE_LENGTH);
}

/** Groups national digits the local way: JP `90-1234-5678`, PH `917 123 4567`. */
export function formatPhone(cc: CountryCode, digits: string): string {
  const { groups, separator } = PHONE_RULES[cc];
  const starts = groups.map((_, i) => groups.slice(0, i).reduce((sum, size) => sum + size, 0));
  return groups
    .map((size, i) => digits.slice(starts[i], starts[i] + size))
    .filter((part) => part.length > 0)
    .join(separator);
}

type TextDiff = { head: string; removed: string; inserted: string };

/** What changed between two strings, assuming one contiguous edit. */
function diffText(prev: string, next: string): TextDiff {
  const shared = Math.min(prev.length, next.length);
  let start = 0;
  while (start < shared && prev[start] === next[start]) start += 1;
  let end = 0;
  while (end < shared - start && prev[prev.length - 1 - end] === next[next.length - 1 - end]) {
    end += 1;
  }
  return {
    head: prev.slice(0, start),
    removed: prev.slice(start, prev.length - end),
    inserted: next.slice(start, next.length - end),
  };
}

/**
 * New national digits after the user edits the formatted field, which shows
 * `formatPhone(cc, prevDigits)` and reports `nextText`. The digits are the
 * source of truth, so deleting a separator ("90-|1234" + backspace) removes the
 * digit before it instead of being undone by the re-format.
 */
export function applyPhoneEdit(cc: CountryCode, prevDigits: string, nextText: string): string {
  const { head, removed, inserted } = diffText(formatPhone(cc, prevDigits), nextText);
  const insertedDigits = digitsOnly(inserted);

  if (inserted === "" && removed !== "" && digitsOnly(removed) === "") {
    const digitIndex = digitsOnly(head).length - 1;
    if (digitIndex < 0) return prevDigits;
    return prevDigits.slice(0, digitIndex) + prevDigits.slice(digitIndex + 1);
  }

  const isPaste = insertedDigits.length > 1;
  if (isPaste) return normalizeNational(nextText, cc);

  // A single keystroke: no prefix stripping, and a full field ignores new digits.
  const isFull = prevDigits.length >= MOBILE_LENGTH;
  if (insertedDigits.length === 1 && isFull && digitsOnly(removed) === "") return prevDigits;
  return stripTrunkZero(digitsOnly(nextText)).slice(0, MOBILE_LENGTH);
}

/** `"+81 90-1234-5678"`. */
export function fullPhone(cc: CountryCode, digits: string): string {
  return `${cc} ${formatPhone(cc, digits)}`;
}

export function isValidMobile(cc: CountryCode, digits: string): boolean {
  return (
    digits.length === MOBILE_LENGTH && /^\d+$/.test(digits) && PHONE_RULES[cc].prefix.test(digits)
  );
}

/**
 * Inline error for the mobile field, or "" when there is nothing to show yet.
 * The message appears once the field is touched, the number is full length, or
 * the leading digits are already wrong.
 */
export function phoneError(cc: CountryCode, digits: string, isTouched: boolean): string {
  if (digits.length === 0 || isValidMobile(cc, digits)) return "";

  const rule = PHONE_RULES[cc];
  const isFullLength = digits.length >= MOBILE_LENGTH;
  const hasWrongPrefix = digits.length >= rule.prefixLength && !rule.prefix.test(digits);
  return isTouched || isFullLength || hasWrongPrefix ? rule.error : "";
}
