import * as yup from "yup";

import { COUNTRY_CODES, normalizeNational, phoneError, type CountryCode } from "@/lib/phone";
import { checkDob } from "@/lib/validation";

import { NAME_MAX_LENGTH } from "./common";

/** "XX" is the "Somewhere else" option (the backend calls it OTHER and answers 403). */
export const COUNTRY_VALUES = ["JP", "PH", "XX"] as const;
export const PHONE_COUNTRY_CODE_VALUES = Object.keys(COUNTRY_CODES) as CountryCode[];

const NAME_MESSAGE = "Use letters, spaces, hyphens or apostrophes only.";
/** Digits and symbols are refused; any script of letters is fine. */
const FORBIDDEN_NAME_CHARS = "0123456789!@#$%^&*()_+=[]{};:\"\\|,<>/?~`";

function nameField(label: string) {
  return yup
    .string()
    .trim()
    .required(`${label} is required`)
    .max(NAME_MAX_LENGTH, `${label} must be at most ${NAME_MAX_LENGTH} characters`)
    .test(
      "name-characters",
      NAME_MESSAGE,
      (value) => !value || ![...value].some((char) => FORBIDDEN_NAME_CHARS.includes(char)),
    );
}

/** Sign up step 4: personal details. `dateOfBirth` is the app's `DD/MM/YYYY` text. */
export const detailsSchema = yup.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  dateOfBirth: yup
    .string()
    .trim()
    .required("Select your date of birth")
    .test("valid-dob", function validDob(value) {
      if (!value) return true;
      const result = checkDob(value);
      if (result === "ok") return true;
      return this.createError({
        message:
          result === "young"
            ? "You need to be 18 or older to use MoriCash."
            : "Check the date. Use DD/MM/YYYY.",
      });
    }),
  country: yup
    .string()
    .required("Choose where you live")
    .oneOf(COUNTRY_VALUES, "Choose where you live"),
  phoneCountryCode: yup
    .string()
    .required("Choose a country code")
    .oneOf(PHONE_COUNTRY_CODE_VALUES, "Choose a country code"),
  // Not needed when the user lives somewhere we do not serve yet.
  phone: yup.string().when("country", {
    is: "XX",
    then: (schema) => schema.notRequired(),
    otherwise: (schema) =>
      schema
        .trim()
        .required("Enter your mobile number")
        .test("valid-mobile", function validMobile(value) {
          const countryCode = this.parent.phoneCountryCode as CountryCode | undefined;
          if (!value || !countryCode || !(countryCode in COUNTRY_CODES)) return true;
          const digits = normalizeNational(value, countryCode);
          if (digits.length === 0) {
            return this.createError({ message: "Enter your mobile number" });
          }
          const message = phoneError(countryCode, digits, true);
          return message === "" ? true : this.createError({ message });
        }),
  }),
});

export type IDetails = yup.InferType<typeof detailsSchema>;
