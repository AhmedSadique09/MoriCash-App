import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Appearance, Platform } from "react-native";

import { ToastHost } from "@/components/ui/toast";
import { colors } from "@/theme/colors";
import { fontAssets } from "@/theme/fonts";

import "./globals.css";

// The design is dark-only for now; keep system UI (keyboard, alerts) in step.
// `setColorScheme` does not exist on react-native-web, so skip it there.
if (Platform.OS !== "web") {
  Appearance.setColorScheme("dark");
}

// Hold the native splash until the fonts are ready so text never flashes.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const isReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {/* Swipe-back must not return into the onboarding stack from these. */}
        <Stack.Screen name="home" options={{ gestureEnabled: false }} />
        <Stack.Screen name="kyc/pending" options={{ gestureEnabled: false }} />
        <Stack.Screen name="kyc/approved" options={{ gestureEnabled: false }} />
      </Stack>
      <ToastHost />
    </>
  );
}
