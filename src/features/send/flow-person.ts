import type { SendFlow, SendRecipient } from "@/stores/send-store";

import { PEOPLE, type Person } from "./people";

const SERVER_PERSON_KEY = "server";

/** A server recipient ("Haruki M.") in the shape the send screens already draw. */
export function personFromRecipient(recipient: SendRecipient): Person {
  const [first = "", ...rest] = recipient.name.split(" ");
  return {
    key: SERVER_PERSON_KEY,
    first,
    last: rest.join(" "),
    cc: recipient.cc,
    num: recipient.num,
    since: "",
  };
}

/** Who the current send flow pays: the real account, else the demo contact. */
export function flowPerson(flow: Pick<SendFlow, "to" | "recipient">): Person | undefined {
  if (flow.recipient) return personFromRecipient(flow.recipient);
  return flow.to ? PEOPLE[flow.to] : undefined;
}
