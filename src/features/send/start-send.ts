import type { Href, ImperativeRouter } from "expo-router";

import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSendStore } from "@/stores/send-store";
import { toast } from "@/stores/toast-store";

const PENDING_MESSAGE =
  "We're still checking your ID. You can send money once it's done.";

// `send/index.tsx` is served at "/send", but Expo's generated route table names
// it "/send/index", so the real URL needs a cast to satisfy the typed router.
const SEND_RECIPIENT_HREF = "/send" as unknown as Href;

/**
 * Only verified users may send or scan. Returns true when the user was
 * redirected / told why and the caller must stop.
 */
function isBlockedByKyc(router: ImperativeRouter): boolean {
  const { tier } = useOnboardingStore.getState();
  if (tier === 1) return false;
  if (tier === "pending") {
    toast(PENDING_MESSAGE);
    return true;
  }
  router.push("/kyc/intro");
  return true;
}

export function startSend(
  router: ImperativeRouter,
  opts?: { to?: string; via?: "phone" | "qr" },
): void {
  if (isBlockedByKyc(router)) return;
  useSendStore.getState().beginSend(opts);
  router.push(opts?.to ? "/send/amount" : SEND_RECIPIENT_HREF);
}

export function startScan(router: ImperativeRouter): void {
  if (isBlockedByKyc(router)) return;
  router.push("/scan");
}
