import { Text as RNText, type TextProps } from "react-native";

import { cn } from "@/lib/cn";

/**
 * App text. Defaults to the body font (Instrument Sans 15px, `ink`); any
 * `className` wins over the defaults, e.g. `className="font-display text-[27px]"`.
 */
export function Text({ className, ...rest }: TextProps) {
  return (
    <RNText
      className={cn("font-text text-[15px] text-ink", className)}
      {...rest}
    />
  );
}
