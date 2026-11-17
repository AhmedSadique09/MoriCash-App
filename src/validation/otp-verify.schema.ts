import * as yup from "yup";

import { OTP_LENGTH } from "./common";

const OTP_MESSAGE = `Enter the ${OTP_LENGTH}-digit code.`;
const OTP_PATTERN = new RegExp(`^\\d{${OTP_LENGTH}}$`);

/** Sign up step 2: the one-time code from the email. */
export const otpVerifySchema = yup.object({
  code: yup
    .string()
    .trim()
    .required(OTP_MESSAGE)
    .matches(OTP_PATTERN, { message: OTP_MESSAGE, excludeEmptyString: true }),
});

export type IOtpVerify = yup.InferType<typeof otpVerifySchema>;
