import * as yup from "yup";

import { isValidEmail } from "@/lib/validation";

/** Mirrors the backend's ALLOWED_EMAIL_DOMAINS (demo-backend `src/config/constants.ts`). */
export const ALLOWED_EMAIL_DOMAINS: readonly string[] = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
];

export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 50;
export const OTP_LENGTH = 6;
export const PIN_LENGTH = 6;

export const EMAIL_MESSAGE = "Enter a valid email, like name@example.com.";

/**
 * A well-formed email address on any domain (e.g. for log in). The value is
 * trimmed before the checks run; use `.lowercase()` on top where needed.
 */
export function emailField() {
  return yup
    .string()
    .trim()
    .required("Email is required")
    .max(EMAIL_MAX_LENGTH, `Email must be at most ${EMAIL_MAX_LENGTH} characters`)
    .test("valid-email", EMAIL_MESSAGE, (value) => !value || isValidEmail(value));
}
