const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// inlineRem: 16 makes Tailwind spacing/radius match the web prototype
// (NativeWind's default rem is 14, which shrinks every `p-4`, `rounded-xl`...).
module.exports = withNativeWind(config, {
  input: "./src/app/globals.css",
  inlineRem: 16,
});
