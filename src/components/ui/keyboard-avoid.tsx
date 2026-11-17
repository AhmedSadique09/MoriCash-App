import type { ReactNode } from "react";
import { KeyboardAvoidingView } from "react-native";

type KeyboardAvoidProps = { children: ReactNode };

/** Lifts the screen body (and its footer) above the software keyboard. */
export function KeyboardAvoid({ children }: KeyboardAvoidProps) {
  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      {children}
    </KeyboardAvoidingView>
  );
}
