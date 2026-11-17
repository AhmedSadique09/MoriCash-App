const colors = require("./src/theme/colors.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  // "media" (the default) makes NativeWind's web runtime throw "Cannot manually
  // set color scheme" from its head MutationObserver when the stylesheet is
  // injected late (dev server). The app is dark-only and uses no `dark:`
  // variants, so "class" is safe and avoids the crash.
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      // React Native loads one font file per weight, so each weight is its own
      // family name. Use `font-text-semibold`, not `font-text font-semibold`.
      fontFamily: {
        display: ["BricolageGrotesque_600SemiBold"],
        "display-medium": ["BricolageGrotesque_500Medium"],
        text: ["InstrumentSans_400Regular"],
        "text-medium": ["InstrumentSans_500Medium"],
        "text-semibold": ["InstrumentSans_600SemiBold"],
        "text-bold": ["InstrumentSans_700Bold"],
        mono: ["IBMPlexMono_400Regular"],
        "mono-medium": ["IBMPlexMono_500Medium"],
        jp: ["NotoSansJP_700Bold"],
      },
    },
  },
  plugins: [],
};
