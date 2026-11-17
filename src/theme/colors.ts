import colorTokens from "./colors.json";

/**
 * Single source of truth for the dark palette. `tailwind.config.js` reads the
 * same JSON, so `className="bg-surface"` and `colors.surface` always agree.
 * Use `colors[...]` only where a raw value is required (SVG, gradients).
 */
export const colors = colorTokens;

export type ColorToken = keyof typeof colors;
