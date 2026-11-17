import * as yup from "yup";

import { isWeakPin } from "@/lib/validation";

import { PIN_LENGTH } from "./common";

const PIN_PATTERN = new RegExp(`^\\d{${PIN_LENGTH}}$`);

/**
 * Sign up step 5 (and the PIN the app asks for when sending). The app is
 * stricter than the backend: repeated and consecutive digits are refused too.
 */
export const pinSchema = yup.object({
  pin: yup
    .string()
    .required(`Create a ${PIN_LENGTH}-digit PIN`)
    .matches(PIN_PATTERN, {
      message: `Your PIN must be ${PIN_LENGTH} digits.`,
      excludeEmptyString: true,
    })
    .test(
      "not-weak",
      "That PIN is easy to guess. Avoid repeated or consecutive digits.",
      (value) => !value || !PIN_PATTERN.test(value) || !isWeakPin(value),
    ),
  confirmPin: yup
    .string()
    .required("Enter your PIN again")
    .oneOf([yup.ref("pin")], "Those PINs don't match. Try again."),
});

export type IPin = yup.InferType<typeof pinSchema>;
