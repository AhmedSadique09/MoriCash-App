import { twMerge } from "tailwind-merge";

type ClassPart = string | false | null | undefined;

/**
 * Joins class names and resolves conflicts so the last one wins, e.g.
 * `cn("font-text text-ink", "font-display")` -> `"text-ink font-display"`.
 * NativeWind resolves conflicts by stylesheet order, not class order, so every
 * component that takes a `className` override must go through this.
 */
export function cn(...parts: ClassPart[]): string {
  return twMerge(parts.filter(Boolean).join(" "));
}
