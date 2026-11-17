import { useRouter, type ImperativeRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/field";
import { KeyboardAvoid } from "@/components/ui/keyboard-avoid";
import { ListGroup, RadioRow } from "@/components/ui/list";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { ObBar } from "@/components/ui/top-bar";
import type { ApiError } from "@/interfaces/auth.interface";
import { resetTo } from "@/lib/navigation";
import {
  applyPhoneEdit,
  COUNTRY_CODES,
  formatPhone,
  isValidMobile,
  normalizeNational,
  phoneError,
  type CountryCode,
} from "@/lib/phone";
import { checkDob, type DobCheck } from "@/lib/validation";
import { authService, getApiError } from "@/services/auth.service";
import { useOnboardingStore, type SignupForm } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";
import type { IDetails } from "@/validation/details.schema";

import { CountryCodeSelect } from "./country-code-select";
import { DobSheet } from "./dob-sheet";

type CountryChoice = Exclude<SignupForm["country"], "">;

const COUNTRY_OPTIONS: readonly { value: CountryChoice; label: string }[] = [
  { value: "JP", label: "Japan" },
  { value: "PH", label: "Philippines" },
  { value: "XX", label: "Somewhere else" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DOB_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const DOB_FULL_LENGTH = 10;
const DOB_FORMAT_ERROR = "Check the date. Use DD/MM/YYYY.";
const DOB_AGE_ERROR = "You need to be 18 or older to use MoriCash.";

/** `14/03/1991` becomes `14 March 1991`. */
function dobLabel(value: string): string {
  const match = DOB_PATTERN.exec(value);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  if (!match || !month) return "";
  return `${Number(match[1])} ${month} ${match[3]}`;
}

function dobErrorMessage(status: DobCheck, isTouched: boolean, length: number): string {
  if (status === "young") return DOB_AGE_ERROR;
  const isWorthFlagging = isTouched || length === DOB_FULL_LENGTH;
  return status === "invalid" && isWorthFlagging ? DOB_FORMAT_ERROR : "";
}

/** Until the user picks one, the country code follows the country they live in. */
function resolveCountryCode(form: SignupForm): CountryCode {
  if (form.phoneCc !== "") return form.phoneCc;
  return form.country === "PH" ? "+63" : "+81";
}

type Touched = { dob: boolean; phone: boolean };

function deriveDetails(form: SignupForm, touched: Touched) {
  const cc = resolveCountryCode(form);
  const digits = normalizeNational(form.phone);
  const dobStatus = checkDob(form.dob);
  const isPhoneOk = form.country === "XX" || isValidMobile(cc, digits);

  return {
    cc,
    digits,
    dobError: dobErrorMessage(dobStatus, touched.dob, form.dob.length),
    phoneMessage: phoneError(cc, digits, touched.phone),
    isValid:
      form.first.trim() !== "" &&
      form.last.trim() !== "" &&
      dobStatus === "ok" &&
      form.country !== "" &&
      isPhoneOk,
  };
}

const SESSION_EXPIRED_MESSAGE = "Your signup expired. Start again.";
const OFFLINE_MESSAGE = "Can't reach MoriCash. Check your connection and try again.";
const UNAUTHORIZED_STATUS = 401;

/** Errors the server attached to a field; "" means none. */
type ApiFieldErrors = { dateOfBirth: string; phone: string };
const NO_API_ERRORS: ApiFieldErrors = { dateOfBirth: "", phone: "" };

type FieldIssue = { field: string; message: string };

/** The backend lost the signup (token expired, or the step is out of order). */
function isSignupExpired(error: ApiError): boolean {
  return (
    error.status === UNAUTHORIZED_STATUS ||
    error.code === "SIGNUP_STEP_INVALID" ||
    error.code === "SIGNUP_SESSION_EXPIRED"
  );
}

function expireSignup(router: ImperativeRouter): void {
  toast(SESSION_EXPIRED_MESSAGE);
  authService.clearSignup();
  resetTo(router, "/signup");
}

/** Reads `details: [{ field, message }]` safely; anything else is ignored. */
function readIssues(details: unknown): FieldIssue[] {
  if (!Array.isArray(details)) return [];
  const items: unknown[] = details;
  return items.flatMap((item) => {
    const { field, message } = (item ?? {}) as { field?: unknown; message?: unknown };
    if (typeof message !== "string" || message === "") return [];
    return [{ field: typeof field === "string" ? field : "", message }];
  });
}

const isPhoneField = (field: string): boolean => field === "phone" || field.startsWith("phone.");

/** Date of birth and phone issues land on their field; the rest (names, country) go to a toast. */
function mapValidationIssues(error: ApiError): {
  fieldErrors: ApiFieldErrors;
  toastMessage: string;
} {
  const issues = readIssues(error.details);
  const dateOfBirth = issues.find((issue) => issue.field === "dateOfBirth")?.message ?? "";
  const phone = issues.find((issue) => isPhoneField(issue.field))?.message ?? "";
  const other = issues.find(
    (issue) => issue.field !== "dateOfBirth" && !isPhoneField(issue.field),
  )?.message;
  const hasFieldError = dateOfBirth !== "" || phone !== "";
  return {
    fieldErrors: { dateOfBirth, phone },
    toastMessage: other ?? (hasFieldError ? "" : error.message),
  };
}

function reportDetailsError(
  error: unknown,
  router: ImperativeRouter,
  setApiErrors: (errors: ApiFieldErrors) => void,
): void {
  const apiError = getApiError(error);
  if (!apiError) {
    // No answer from the server. Without a signup token there is nothing to retry.
    if (authService.hasSignupInProgress()) toast(OFFLINE_MESSAGE);
    else expireSignup(router);
    return;
  }
  if (apiError.code === "COUNTRY_NOT_SUPPORTED") {
    router.push("/blocked");
    return;
  }
  if (isSignupExpired(apiError)) {
    expireSignup(router);
    return;
  }
  if (apiError.code === "PHONE_ALREADY_REGISTERED") {
    setApiErrors({ dateOfBirth: "", phone: apiError.message });
    return;
  }
  if (apiError.code === "VALIDATION_ERROR") {
    const { fieldErrors, toastMessage } = mapValidationIssues(apiError);
    setApiErrors(fieldErrors);
    if (toastMessage !== "") toast(toastMessage);
    return;
  }
  toast(apiError.message);
}

/** The values `IDetails` expects. The phone is sent as national digits; "Somewhere else" sends none. */
function buildDetails(
  form: SignupForm,
  country: CountryChoice,
  cc: CountryCode,
  digits: string,
): IDetails {
  return {
    firstName: form.first.trim(),
    lastName: form.last.trim(),
    dateOfBirth: form.dob,
    country,
    phoneCountryCode: cc,
    phone: country === "XX" ? undefined : digits,
  };
}

function useDetailsSubmit() {
  const router = useRouter();
  const commitDetails = useOnboardingStore((state) => state.commitDetails);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<ApiFieldErrors>(NO_API_ERRORS);

  const clearApiError = (field: keyof ApiFieldErrors) =>
    setApiErrors((prev) => (prev[field] === "" ? prev : { ...prev, [field]: "" }));

  const submit = async (form: SignupForm, cc: CountryCode, digits: string) => {
    const { country } = form;
    if (isSubmitting || country === "") return;
    setIsSubmitting(true);
    setApiErrors(NO_API_ERRORS);
    try {
      await authService.submitDetails(buildDetails(form, country, cc, digits));
    } catch (error: unknown) {
      reportDetailsError(error, router, setApiErrors);
      return;
    } finally {
      setIsSubmitting(false);
    }
    if (country === "XX") {
      router.push("/blocked");
      return;
    }
    commitDetails();
    router.push("/pin-create");
  };

  return { isSubmitting, apiErrors, clearApiError, submit };
}

function useDetailsForm() {
  const form = useOnboardingStore((state) => state.form);
  const patchForm = useOnboardingStore((state) => state.patchForm);
  const [isDobOpen, setIsDobOpen] = useState(false);
  const [touched, setTouched] = useState<Touched>({ dob: false, phone: false });
  const derived = deriveDetails(form, touched);
  const api = useDetailsSubmit();

  const openDob = () => {
    Keyboard.dismiss();
    setIsDobOpen(true);
  };

  const finishDob = (value: string) => {
    patchForm({ dob: value });
    setTouched((prev) => ({ ...prev, dob: true }));
    setIsDobOpen(false);
    api.clearApiError("dateOfBirth");
  };

  const changePhone = (text: string) => {
    const digits = applyPhoneEdit(derived.cc, derived.digits, text);
    patchForm({ phone: formatPhone(derived.cc, digits) });
    api.clearApiError("phone");
  };

  const changeCode = (phoneCc: CountryCode) => {
    patchForm({ phoneCc });
    api.clearApiError("phone");
  };

  const touchPhone = () => setTouched((prev) => ({ ...prev, phone: true }));

  return {
    form,
    patchForm,
    ...derived,
    dobError: api.apiErrors.dateOfBirth || derived.dobError,
    phoneMessage: api.apiErrors.phone || derived.phoneMessage,
    isSubmitting: api.isSubmitting,
    isDobOpen,
    closeDob: () => setIsDobOpen(false),
    openDob,
    finishDob,
    changePhone,
    changeCode,
    touchPhone,
    submit: () => api.submit(form, derived.cc, derived.digits),
  };
}

type NameFieldsProps = {
  first: string;
  last: string;
  onPatch: (patch: Partial<SignupForm>) => void;
};

function NameFields({ first, last, onPatch }: NameFieldsProps) {
  // Field reserves a 24px helper/error line; the names never show one.
  return (
    <View className="flex-row gap-[10px]">
      <Field
        className="-mb-[24px] min-w-0 flex-1"
        label="First name"
        value={first}
        onChangeText={(text) => onPatch({ first: text })}
        onBlur={() => onPatch({ first: first.trim() })}
        autoComplete="name-given"
        autoCapitalize="words"
      />
      <Field
        className="-mb-[24px] min-w-0 flex-1"
        label="Last name"
        value={last}
        onChangeText={(text) => onPatch({ last: text })}
        onBlur={() => onPatch({ last: last.trim() })}
        autoComplete="name-family"
        autoCapitalize="words"
      />
    </View>
  );
}

type CountryChoicesProps = {
  selected: SignupForm["country"];
  onSelect: (value: CountryChoice) => void;
};

function CountryChoices({ selected, onSelect }: CountryChoicesProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Where do you live?"
      className="mt-[6px]"
    >
      <Text className="mb-2 font-text-medium text-[13px] text-ink-2">
        Where do you live?
      </Text>
      <ListGroup>
        {COUNTRY_OPTIONS.map((option, index) => (
          <RadioRow
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            onPress={() => onSelect(option.value)}
            isLast={index === COUNTRY_OPTIONS.length - 1}
          />
        ))}
      </ListGroup>
    </View>
  );
}

type PhoneFieldProps = {
  cc: CountryCode;
  digits: string;
  error: string;
  onChangeText: (text: string) => void;
  onChangeCode: (code: CountryCode) => void;
  onBlur: () => void;
};

function PhoneField({
  cc,
  digits,
  error,
  onChangeText,
  onChangeCode,
  onBlur,
}: PhoneFieldProps) {
  return (
    <Field
      label="Mobile number"
      value={formatPhone(cc, digits)}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder={COUNTRY_CODES[cc].example}
      keyboardType="number-pad"
      autoComplete="tel-national"
      left={<CountryCodeSelect value={cc} onChange={onChangeCode} />}
      helper="Friends send you money with this number."
      error={error}
    />
  );
}

export function DetailsScreen() {
  const d = useDetailsForm();

  return (
    <Screen>
      <KeyboardAvoid>
        <ObBar step={4} total={5} />
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pt-1 pb-7"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text
            accessibilityRole="header"
            className="mb-2 mt-[10px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
          >
            Tell us about you
          </Text>
          <Text className="leading-[22px] text-ink-2">
            Use your name exactly as it appears on your ID.
          </Text>

          <NameFields first={d.form.first} last={d.form.last} onPatch={d.patchForm} />
          <SelectField
            label="Date of birth"
            valueText={dobLabel(d.form.dob)}
            placeholder="Select your date of birth"
            icon="calendar"
            onPress={d.openDob}
            error={d.dobError}
          />
          <CountryChoices
            selected={d.form.country}
            onSelect={(country) => d.patchForm({ country })}
          />
          <PhoneField
            cc={d.cc}
            digits={d.digits}
            error={d.phoneMessage}
            onChangeText={d.changePhone}
            onChangeCode={d.changeCode}
            onBlur={d.touchPhone}
          />
        </ScrollView>
        <Footer>
          <Button
            label="Continue"
            onPress={() => {
              void d.submit();
            }}
            disabled={!d.isValid}
            isLoading={d.isSubmitting}
          />
        </Footer>
      </KeyboardAvoid>

      <DobSheet
        visible={d.isDobOpen}
        value={d.form.dob}
        onCancel={d.closeDob}
        onDone={d.finishDob}
      />
    </Screen>
  );
}
