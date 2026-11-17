import * as yup from "yup";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./common";

/**
 * The same three rules the password screen lists (8+ characters, a number, a
 * capital letter). Messages match the checklist labels, so one wording is used
 * everywhere. Validate with `abortEarly: false` to get every broken rule.
 */
export function passwordField() {
  return yup
    .string()
    .required("Password is required")
    .min(PASSWORD_MIN_LENGTH, `At least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
    .matches(/\d/, { message: "At least one number", excludeEmptyString: true })
    .matches(/[A-Z]/, { message: "At least one capital letter", excludeEmptyString: true });
}

/** Sign up step 3. */
export const passwordSchema = yup.object({
  password: passwordField(),
});

export type IPassword = yup.InferType<typeof passwordSchema>;
