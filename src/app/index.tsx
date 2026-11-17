import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useReducedMotion } from "react-native-reanimated";

import { SplashView } from "@/features/splash/splash-view";

const SPLASH_MS = 2200;
const SPLASH_REDUCED_MS = 500;

export default function SplashRoute() {
  const router = useRouter();
  const isReduced = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(
      () => router.replace("/welcome"),
      isReduced ? SPLASH_REDUCED_MS : SPLASH_MS,
    );
    return () => clearTimeout(timer);
  }, [router, isReduced]);

  return (
    <>
      <StatusBar style="dark" />
      <SplashView />
    </>
  );
}
