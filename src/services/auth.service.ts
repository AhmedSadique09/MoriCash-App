import { isAxiosError } from "axios";

import type {
  ApiEnvelope,
  ApiError,
  ApiErrorBody,
  FaceIdFlag,
  KycStatus,
  LoginResult,
  ResendOtpResult,
  SignupResult,
  SignupSession,
  SignupStepResult,
  StartSignupResult,
  UserProfile,
} from "@/interfaces/auth.interface";
import type { PinVerifyResult } from "@/interfaces/transfer.interface";
import type { IDetails } from "@/validation/details.schema";

import { HttpService } from "./base.service";

/**
 * Reads the backend's `{ error: { code, message, details } }` out of a failed call.
 * Returns `undefined` when the server never answered (offline, timeout).
 */
export function getApiError(error: unknown): ApiError | undefined {
  if (!isAxiosError(error) || !error.response) return undefined;
  const body = (error.response.data as { error?: ApiErrorBody } | undefined)?.error;
  return {
    status: error.response.status,
    code: typeof body?.code === "string" ? body.code : "HTTP_ERROR",
    message: typeof body?.message === "string" ? body.message : "Something went wrong.",
    details: body?.details,
  };
}

/** The app keeps dates as DD/MM/YYYY; the backend wants YYYY-MM-DD. */
function toIsoDate(dateOfBirth: string): string {
  const [day, month, year] = dateOfBirth.split("/");
  return `${year}-${month}-${day}`;
}

/**
 * Sign up and account calls. The signup is a server-tracked session with one
 * call per screen: email, OTP, password, details, PIN. `startSignup` returns a
 * signup token which this service keeps and sends on the later steps; the
 * final `createPin` swaps it for the access token and saves that.
 * Failures throw the axios error; read its code with `getApiError(error)`.
 */
export class AuthService extends HttpService {
  private signupToken = "";

  /** True between `startSignup` and `createPin`. */
  hasSignupInProgress(): boolean {
    return this.signupToken !== "";
  }

  /** Forgets a half-finished signup (for example when the user leaves it). */
  clearSignup(): void {
    this.signupToken = "";
  }

  /** Screen 1: email + terms. Sends the OTP and opens the signup session. */
  async startSignup(email: string, acceptTerms: true): Promise<StartSignupResult> {
    const body = await this.post<ApiEnvelope<StartSignupResult>>("auth/signup/email", {
      email,
      acceptTerms,
    });
    this.signupToken = body.data.signupToken;
    return body.data;
  }

  /** Screen 2: check the 6-digit code. */
  async verifyOtp(code: string): Promise<SignupStepResult> {
    const body = await this.post<ApiEnvelope<SignupStepResult>>(
      "auth/signup/otp/verify",
      { code },
      this.signupAuth(),
    );
    return body.data;
  }

  /** Screen 2: "Resend code" (the backend enforces the cooldown). */
  async resendOtp(): Promise<ResendOtpResult> {
    const body = await this.post<ApiEnvelope<ResendOtpResult>>(
      "auth/signup/otp/resend",
      undefined,
      this.signupAuth(),
    );
    return body.data;
  }

  /** Screen 3: password. */
  async createPassword(password: string): Promise<SignupStepResult> {
    const body = await this.post<ApiEnvelope<SignupStepResult>>(
      "auth/signup/password",
      { password },
      this.signupAuth(),
    );
    return body.data;
  }

  /**
   * Screen 4: personal details, taken straight from the validated form
   * (`IDetails`). "Somewhere else" (`XX`) is sent as `OTHER`, which the
   * backend answers with 403 COUNTRY_NOT_SUPPORTED (the "blocked" screen).
   */
  async submitDetails(values: IDetails): Promise<SignupStepResult> {
    const isSupportedCountry = values.country !== "XX";
    const body = await this.post<ApiEnvelope<SignupStepResult>>(
      "auth/signup/details",
      {
        firstName: values.firstName,
        lastName: values.lastName,
        dateOfBirth: toIsoDate(values.dateOfBirth),
        country: isSupportedCountry ? values.country : "OTHER",
        ...(isSupportedCountry && values.phone
          ? { phone: { countryCode: values.phoneCountryCode, number: values.phone } }
          : {}),
      },
      this.signupAuth(),
    );
    return body.data;
  }

  /**
   * Screen 5: PIN. This creates the account, so on success the access token is
   * saved (`HttpService.setToken`) and the signup token is dropped.
   */
  async createPin(pin: string, confirmPin: string): Promise<SignupResult> {
    const body = await this.post<ApiEnvelope<SignupResult>>(
      "auth/signup/pin",
      { pin, confirmPin },
      this.signupAuth(),
    );
    await HttpService.setToken(body.data.accessToken);
    this.signupToken = "";
    return body.data;
  }

  /**
   * Sign in with email + password. On success the access token is saved
   * (`HttpService.setToken`) and any half-finished signup is dropped.
   * A wrong email or password throws 401 INVALID_CREDENTIALS.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const body = await this.post<ApiEnvelope<LoginResult>>("auth/login", {
      email,
      password,
    });
    await HttpService.setToken(body.data.accessToken);
    this.clearSignup();
    return body.data;
  }

  /** Where the user is in the signup (resume after the app was closed). */
  async getSignupSession(): Promise<SignupSession> {
    const body = await this.get<ApiEnvelope<SignupSession>>(
      "auth/signup/session",
      undefined,
      this.signupAuth(),
    );
    return body.data;
  }

  /** Face ID screen after the PIN: 1 = "Turn on Face ID", 0 = "Not now". Needs the access token. */
  async setBiometrics(faceId: FaceIdFlag): Promise<{ faceId: FaceIdFlag }> {
    const body = await this.put<ApiEnvelope<{ faceId: FaceIdFlag }>>(
      "auth/me/biometrics",
      { faceId },
    );
    return body.data;
  }

  /**
   * KYC review screen: "Submit for review". The demo backend marks the user
   * `approved` at once and never demotes. Needs the access token.
   */
  async submitKyc(): Promise<{ kycStatus: KycStatus }> {
    const body = await this.post<ApiEnvelope<{ kycStatus: KycStatus }>>("kyc/submit");
    return body.data;
  }

  /**
   * Send money: checks the 6-digit PIN and returns the short-lived `pinToken`
   * that `POST transfers` asks for. Needs the access token.
   * Wrong PIN: 422 PIN_INVALID (`details.attemptsLeft`); too many: 429 PIN_LOCKED
   * (`details.retryAfterSeconds`).
   */
  async verifyPin(pin: string): Promise<PinVerifyResult> {
    const body = await this.post<ApiEnvelope<PinVerifyResult>>("auth/pin/verify", { pin });
    return body.data;
  }

  /** The signed-in user. */
  async getMe(): Promise<UserProfile> {
    const body = await this.get<ApiEnvelope<{ user: UserProfile }>>("auth/me");
    return body.data.user;
  }

  /** Log out: forgets the saved access token. */
  logout(): Promise<void> {
    return HttpService.clearToken();
  }

  /** Auth header for the signup steps (the signup token, not the access token). */
  private signupAuth(): { headers: { Authorization: string } } {
    if (!this.signupToken) {
      throw new Error("No signup in progress. Start with the email step.");
    }
    return { headers: { Authorization: `Bearer ${this.signupToken}` } };
  }
}

/** Shared instance, so the signup token survives across screens. */
export const authService = new AuthService();
