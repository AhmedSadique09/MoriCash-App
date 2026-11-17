import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/lib/cn";

type CardProps = { children: ReactNode; className?: string };

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-[16px] border border-line bg-surface p-4",
        className,
      )}
    >
      {children}
    </View>
  );
}
