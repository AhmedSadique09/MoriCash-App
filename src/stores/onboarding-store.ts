import { create } from "zustand";

import { normalizeNational, type CountryCode } from "@/lib/phone";

export type Country = "JP" | "PH";
export type Tier = 0 | "pending" | 1;

export type SignupForm = {
  email: string;
  terms: boolean;
  pw: string;
  first: string;
  last: string;
  dob: string;
  country: Country | "XX" | "";
  phoneCc: CountryCode | "";
  phone: string;
  consent: boolean;
  loginEmail: string;
  loginPassword: string;
};

export type User = {
  first: string;
  last: string;
  name: string;
  email: string;
  country: Country;
  dob: string;
  cc: CountryCode;
  num: string;
};

export type SelfieState = "ready" | "scanning" | "done";
export type KycState = {
  doc: string;
  shots: { front: boolean; back: boolean };
  selfie: SelfieState;
};
export type DocOption = { id: string; name: string; hint: string };

export const COUNTRY_NAMES: Record<Country, string> = {
  JP: "Japan",
  PH: "Philippines",
};

export const DOCS: Record<Country, DocOption[]> = {
  JP: [
    { id: "passport", name: "Passport", hint: "Photo page only" },
    { id: "residence", name: "Residence card", hint: "在留カード · front and back" },
    { id: "licence", name: "Driver's licence", hint: "Front and back" },
    { id: "mynumber", name: "My Number card", hint: "Front and back" },
  ],
  PH: [
    { id: "passport", name: "Passport", hint: "Photo page only" },
    { id: "philsys", name: "PhilSys national ID", hint: "Front and back" },
    { id: "licence", name: "Driver's licence", hint: "Front and back" },
    { id: "umid", name: "UMID card", hint: "Front and back" },
  ],
};

const OTP_RESEND_MS = 30_000;
const KYC_REVIEW_MS = 7_000;
const PASSPORT_DOC_ID = "passport";

const DEMO_USER = {
  first: "Haruki",
  last: "Morita",
  name: "Haruki Morita",
  country: "JP",
  dob: "14/03/1991",
  cc: "+81",
  num: "9011112222",
} as const satisfies Omit<User, "email">;

/** Resolves the chosen document; an unknown id falls back to the first option. */
export function docInfo(
  country: Country,
  docId: string,
): { id: string; name: string; hasTwoSides: boolean } {
  const options = DOCS[country];
  const doc = options.find((option) => option.id === docId) ?? options[0];
  return { id: doc.id, name: doc.name, hasTwoSides: doc.id !== PASSPORT_DOC_ID };
}

type State = {
  form: SignupForm;
  user: User | null;
  tier: Tier;
  newPin: string;
  faceId: boolean;
  kyc: KycState;
  resendAt: number;
};

type Actions = {
  patchForm: (patch: Partial<SignupForm>) => void;
  resetOnboarding: () => void;
  startOtp: () => void;
  commitDetails: () => User;
  setNewPin: (pin: string) => void;
  setFaceId: (on: boolean) => void;
  resetKyc: () => void;
  setKycDoc: (id: string) => void;
  setShot: (side: "front" | "back", taken: boolean) => void;
  setSelfie: (selfie: SelfieState) => void;
  submitKyc: () => void;
  loginDemo: (email: string) => User;
};

function createInitialForm(): SignupForm {
  return {
    email: "",
    terms: false,
    pw: "",
    first: "",
    last: "",
    dob: "",
    country: "",
    phoneCc: "",
    phone: "",
    consent: false,
    loginEmail: "",
    loginPassword: "",
  };
}

function createInitialKyc(): KycState {
  return { doc: "", shots: { front: false, back: false }, selfie: "ready" };
}

function createInitialState(): State {
  return {
    form: createInitialForm(),
    user: null,
    tier: 0,
    newPin: "",
    faceId: false,
    kyc: createInitialKyc(),
    resendAt: 0,
  };
}

/** Handle for the simulated review; kept outside the store so it is never serialised or re-rendered. */
let kycReviewTimer: ReturnType<typeof setTimeout> | null = null;

function clearKycReviewTimer(): void {
  if (kycReviewTimer !== null) {
    clearTimeout(kycReviewTimer);
    kycReviewTimer = null;
  }
}

function isSupportedCountry(country: SignupForm["country"]): country is Country {
  return country === "JP" || country === "PH";
}

export const useOnboardingStore = create<State & Actions>((set, get) => ({
  ...createInitialState(),

  patchForm: (patch) => set((state) => ({ form: { ...state.form, ...patch } })),

  resetOnboarding: () => {
    clearKycReviewTimer();
    set(createInitialState());
  },

  startOtp: () => set({ resendAt: Date.now() + OTP_RESEND_MS }),

  commitDetails: () => {
    const { form } = get();
    if (!isSupportedCountry(form.country)) {
      throw new Error("commitDetails needs a supported country (JP or PH).");
    }
    const first = form.first.trim();
    const last = form.last.trim();
    const user: User = {
      first,
      last,
      name: [first, last].filter(Boolean).join(" "),
      email: form.email,
      country: form.country,
      dob: form.dob,
      cc: form.phoneCc || (form.country === "PH" ? "+63" : "+81"),
      num: normalizeNational(form.phone),
    };
    set({ user });
    return user;
  },

  setNewPin: (pin) => set({ newPin: pin }),

  setFaceId: (on) => set({ faceId: on }),

  // Starting verification also clears the consent tick, as the prototype does.
  // A review still in flight is dropped too, so its timer cannot fire later.
  resetKyc: () => {
    clearKycReviewTimer();
    set((state) => ({
      kyc: createInitialKyc(),
      form: { ...state.form, consent: false },
      // Without the timer a "pending" tier would never resolve.
      tier: state.tier === "pending" ? 0 : state.tier,
    }));
  },

  setKycDoc: (id) =>
    set((state) => {
      if (state.kyc.doc === id) return state;
      // Photos of a different document are not reusable.
      return { kyc: { ...state.kyc, doc: id, shots: createInitialKyc().shots } };
    }),

  setShot: (side, taken) =>
    set((state) => ({
      kyc: { ...state.kyc, shots: { ...state.kyc.shots, [side]: taken } },
    })),

  setSelfie: (selfie) => set((state) => ({ kyc: { ...state.kyc, selfie } })),

  submitKyc: () => {
    // An approved user must not be demoted back to "pending".
    if (get().tier === 1) return;
    clearKycReviewTimer();
    set({ tier: "pending" });
    kycReviewTimer = setTimeout(() => {
      kycReviewTimer = null;
      set({ tier: 1 });
    }, KYC_REVIEW_MS);
  },

  // Like the prototype, an account created in this session is kept as is.
  loginDemo: (email) => {
    const existing = get().user;
    if (existing !== null) return existing;
    const user: User = { ...DEMO_USER, email };
    set({ user, tier: 1 });
    return user;
  },
}));
