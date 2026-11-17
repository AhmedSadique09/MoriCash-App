import { PEOPLE, personName } from "@/features/send/people";
import { fmt } from "@/lib/format";
import { showBanner } from "@/stores/banner-store";
import { useWalletStore } from "@/stores/wallet-store";

const FALLBACK_NAME = "Someone";

/** Demo only: someone sends you USDT. Credits the wallet and shows the notification banner. */
export function simulateIncoming(): void {
  const { nextIncoming, receiveFrom } = useWalletStore.getState();
  const { personKey, amount, note } = nextIncoming();
  receiveFrom(personKey, amount, note);

  const person = PEOPLE[personKey];
  showBanner({
    personKey,
    title: `${person ? personName(person) : FALLBACK_NAME} sent you ${fmt(amount)} USDT`,
    subtitle: note ? `“${note}”` : "Added to your balance",
  });
}
