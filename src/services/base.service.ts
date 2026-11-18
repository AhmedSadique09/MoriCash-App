import { create, isAxiosError, type AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

/**
 * Backend base URL, including the version prefix. Set EXPO_PUBLIC_API_URL in
 * `.env`; on a real phone use your computer's LAN IP, the Android emulator
 * uses 10.0.2.2 (`localhost` only works on the iOS simulator and on web).
 */
const Config = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3100/api/v1";

const TOKEN_KEY = "moricash.accessToken";
const REQUEST_TIMEOUT_MS = 15_000;

/** Read on every request, so it lives in memory; SecureStore keeps it across restarts. */
let token = "";
let unauthorizedHandler: (() => void) | null = null;
// Several calls can fail together; only the first may trigger the handler.
let isHandlingUnauthorized = false;

// One shared client, so interceptors are registered once (not per service instance).
const api = create({ baseURL: Config, timeout: REQUEST_TIMEOUT_MS });

api.interceptors.request.use((config) => {
  if (token && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

/** Backend codes that mean the saved login itself is bad (missing, garbled or expired). */
const LOGIN_REJECTED_CODES: ReadonlySet<string> = new Set(["UNAUTHORIZED", "TOKEN_EXPIRED"]);

function isLoginRejected(responseBody: unknown): boolean {
  const code = (responseBody as { error?: { code?: unknown } } | null | undefined)?.error?.code;
  return typeof code === "string" && LOGIN_REJECTED_CODES.has(code);
}

api.interceptors.response.use(undefined, async (error: unknown) => {
  // Only a 401 on a call that used the saved login counts: a 401 caused by a
  // token passed in the call's own headers (e.g. the signup token) must not
  // log the user out. A 401 with another code (e.g. PIN_TOKEN_INVALID, the
  // 2 minute PIN approval ran out) is a normal error for the screen to show.
  // 403 is not "logged out" here: it is a business rule such as
  // COUNTRY_NOT_SUPPORTED.
  if (isAxiosError(error) && error.response?.status === 401 && isLoginRejected(error.response.data)) {
    const sentToken = error.config?.headers?.get("Authorization");
    if (token && sentToken === `Bearer ${token}` && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      try {
        await HttpService.clearToken();
      } finally {
        unauthorizedHandler?.();
      }
    }
  }
  throw error;
});

/**
 * Base class for every API service: `class AuthService extends HttpService`.
 * The helpers return the response body; the backend's shape is
 * `{ success, data, error }`, and failures throw the axios error
 * (`error.response.data.error.code` / `.message`).
 */
export class HttpService {
  private controller = new AbortController();

  /** Saves the access token (memory + SecureStore) after sign up or log in. */
  static async setToken(newToken: string): Promise<void> {
    isHandlingUnauthorized = false;
    token = newToken;
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    }
  }

  static getToken(): string {
    return token;
  }

  /** Restores the saved token. Call once when the app starts. */
  static async loadToken(): Promise<string> {
    if (await SecureStore.isAvailableAsync()) {
      token = (await SecureStore.getItemAsync(TOKEN_KEY)) ?? "";
    }
    return token;
  }

  /** Log out: forgets the saved token. */
  static async clearToken(): Promise<void> {
    isHandlingUnauthorized = false;
    token = "";
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }

  /** What to do when the saved token is rejected (the web version redirected to login here). */
  static onUnauthorized(handler: (() => void) | null): void {
    unauthorizedHandler = handler;
  }

  /**
   * Fetch data from server
   * @param url Endpoint path, e.g. "auth/me"
   * @param params Query params
   * @param options Extra axios config, e.g. `{ headers: { Authorization: "Bearer <signupToken>" } }`
   */
  protected get = async <T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    options: AxiosRequestConfig = {},
  ): Promise<T> => {
    const res = await api.get<T>(url, { ...options, params, signal: this.controller.signal });
    return res.data;
  };

  /**
   * Write data over server
   * @param url Endpoint path
   * @param body Data to send
   * @param options Extra axios config, e.g. `{ headers: { Authorization: "Bearer <signupToken>" } }`
   */
  protected post = async <T = unknown>(
    url: string,
    body?: unknown,
    options: AxiosRequestConfig = {},
  ): Promise<T> => {
    // A POST without a body goes out as application/x-www-form-urlencoded, which
    // the backend refuses with 415 (resend OTP, submit KYC): send an empty JSON object.
    const res = await api.post<T>(url, body ?? {}, { ...options, signal: this.controller.signal });
    return res.data;
  };

  /**
   * Update data on server
   * @param url Endpoint path
   * @param body Data to send
   * @param options Extra axios config
   */
  protected put = async <T = unknown>(
    url: string,
    body?: unknown,
    options: AxiosRequestConfig = {},
  ): Promise<T> => {
    const res = await api.put<T>(url, body, { ...options, signal: this.controller.signal });
    return res.data;
  };

  /**
   * Delete data from server
   * @param url Endpoint path
   * @param params Query params
   * @param data Request body, if the endpoint needs one
   */
  protected delete = async <T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    data?: unknown,
  ): Promise<T> => {
    const res = await api.delete<T>(url, { params, data, signal: this.controller.signal });
    return res.data;
  };

  /** Cancels this service's requests that are still running; later calls start clean. */
  cancel = (): void => {
    this.controller.abort();
    this.controller = new AbortController();
  };
}
