const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DOB_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MIN_DOB_YEAR = 1900;
const MIN_AGE = 18;
const PASSWORD_MIN_LENGTH = 8;
const FALLBACK_EMAIL = "you@example.com";
const EMAIL_MASK = "•••";

export type DobCheck = "incomplete" | "invalid" | "ok" | "young";

export function isValidEmail(s: string): boolean {
  return EMAIL_PATTERN.test(s);
}

/**
 * Validates a `DD/MM/YYYY` date of birth. `today` is injectable so the result
 * is deterministic; the year must fall between 1900 and `today`'s year.
 */
export function checkDob(s: string, today: Date = new Date()): DobCheck {
  const match = DOB_PATTERN.exec(s);
  if (!match) return "incomplete";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < MIN_DOB_YEAR || year > today.getFullYear()) return "invalid";

  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate) return "invalid";

  const hasHadBirthday =
    today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day);
  const age = today.getFullYear() - year - (hasHadBirthday ? 0 : 1);
  return age >= MIN_AGE ? "ok" : "young";
}

export function passwordRules(pw: string): { len: boolean; num: boolean; up: boolean } {
  return {
    len: pw.length >= PASSWORD_MIN_LENGTH,
    num: /\d/.test(pw),
    up: /[A-Z]/.test(pw),
  };
}

export function isStrongPassword(pw: string): boolean {
  const rules = passwordRules(pw);
  return rules.len && rules.num && rules.up;
}

/** Weak = six identical digits, or a run taken from 0123456789 / 9876543210. */
export function isWeakPin(v: string): boolean {
  return /^(\d)\1{5}$/.test(v) || "0123456789".includes(v) || "9876543210".includes(v);
}

/** `haruki@example.com` becomes `h•••@example.com`. Plain text, not HTML-escaped. */
export function maskEmail(e: string): string {
  const source = e.indexOf("@") > 0 ? e : FALLBACK_EMAIL;
  const at = source.indexOf("@");
  return `${source.charAt(0)}${EMAIL_MASK}${source.slice(at)}`;
}
