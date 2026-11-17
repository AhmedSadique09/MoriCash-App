import type { Href, ImperativeRouter } from "expo-router";

/**
 * Leaves the current flow for good: drops every screen under the current one,
 * then swaps the remaining entry for `href`. A plain `replace` only swaps the
 * top entry, so back / swipe-back would land on a stale onboarding screen.
 * (`ImperativeRouter` is what `useRouter()` returns in this expo-router version.)
 */
export function resetTo(router: ImperativeRouter, href: Href): void {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
