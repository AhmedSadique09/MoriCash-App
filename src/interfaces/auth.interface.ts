/** Face ID screen choice as the backend stores it: 1 = "Turn on Face ID", 0 = "Not now". */
export type FaceIdFlag = 0 | 1;

/** The screen the app should show next. Screens switch on this, never on messages. */
export type SignupNextStep =
  | "VERIFY_OTP"
  | "CREATE_PASSWORD"
  | "ENTER_DETAILS"
  | "CREATE_PIN"
  | "DONE";

/** The OTP step's timers, sent whenever a code is (re)sent. */
export interface OtpInfo {
  length: number;
  expiresInSeconds: number;
  /** Seconds until "Resend code" is allowed again (the 0:30 timer). */
  resendAvailableInSeconds: number;
}

/** Answer of screen 1 (email): opens the signup session. */
export interface StartSignupResult {
  signupToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  nextStep: SignupNextStep;
  expiresAt: string;
  otp: OtpInfo;
}

/** Answer of the middle steps (OTP, password, details). */
export interface SignupStepResult {
  nextStep: SignupNextStep;
  expiresAt: string;
}

/** Answer of "Resend code". */
export interface ResendOtpResult {
  otp: OtpInfo;
  expiresAt: string;
}

/** Where the user is in the signup, for resuming after the app was closed. */
export interface SignupSession {
  email: string;
  progress: { completed: string[]; nextStep: SignupNextStep };
  details?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    country: string;
    phone?: { countryCode: string; number: string };
  };
  expiresAt: string;
}

/** Identity check state kept by the backend: "pending" while under review, "approved" once done. */
export type KycStatus = "none" | "pending" | "approved";

/** The signed-in user, as the backend returns it. */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: "JP" | "PH";
  phone: { countryCode: string; number: string; e164: string };
  faceId: FaceIdFlag;
  kycStatus: KycStatus;
  createdAt: string;
}

/** Answer of screen 5 (PIN): the account exists and the access token is ready. */
export interface SignupResult {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: UserProfile;
}

/** Answer of sign in: same shape as a finished signup. */
export type LoginResult = SignupResult;

/** Every backend success is `{ success: true, data, error: null }`. */
export interface ApiEnvelope<T> {
  success: true;
  data: T;
  error: null;
}

/** The raw `error` object inside a failed response; fields are unchecked until read. */
export interface ApiErrorBody {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

/** A failed call, cleaned up by `getApiError`. */
export interface ApiError {
  status: number;
  /** Stable code to switch on, e.g. OTP_INVALID, EMAIL_ALREADY_REGISTERED, SIGNUP_STEP_INVALID. */
  code: string;
  message: string;
  details?: unknown;
}
