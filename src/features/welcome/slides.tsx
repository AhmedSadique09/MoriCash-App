import type { ComponentType } from "react";

import { PhoneSlideArt, SecuritySlideArt, UsdtSlideArt } from "./slide-art";

export type Slide = {
  title: string;
  body: string;
  Art: ComponentType;
};

export const SLIDES: readonly Slide[] = [
  {
    title: "Hold dollars as USDT",
    body: "USDT is a digital dollar. 1 USDT is worth about US$1, and your balance shows the yen or peso value too.",
    Art: UsdtSlideArt,
  },
  {
    title: "Send to any phone number",
    body: "Type a mobile number or scan a QR code. We show who it belongs to before you send, and the money usually arrives in under a minute.",
    Art: PhoneSlideArt,
  },
  {
    title: "You approve every transfer",
    body: "We check who you are paying before any money moves, and nothing leaves your balance without your PIN.",
    Art: SecuritySlideArt,
  },
];
