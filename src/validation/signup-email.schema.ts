import * as yup from "yup";

import { ALLOWED_EMAIL_DOMAINS, emailField } from "./common";

const TERMS_MESSAGE =
  "You need to accept the Terms of Service and Privacy Policy.";

/**
 * Sign up step 1: email + terms. Stricter than log in: only the providers the
 * backend accepts (Gmail, Yahoo, Outlook), and the address is lower-cased.
 */
export const signupEmailSchema = yup.object({
  email: emailField()
    .lowercase()
    .test("allowed-domain", "Use a Gmail, Yahoo or Outlook address.", (value) => {
      if (!value) return true;
      return ALLOWED_EMAIL_DOMAINS.includes(value.slice(value.lastIndexOf("@") + 1));
    }),
  acceptTerms: yup
    .boolean()
    .required(TERMS_MESSAGE)
    .oneOf([true], TERMS_MESSAGE),
});

export type ISignupEmail = yup.InferType<typeof signupEmailSchema>;
