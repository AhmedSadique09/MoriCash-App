import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { DetailList } from "@/components/ui/detail-list";
import { Icon } from "@/components/ui/icon";
import { Screen, Footer } from "@/components/ui/screen";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { PlainBar } from "@/components/ui/top-bar";
import { announce } from "@/lib/announce";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { resetTo } from "@/lib/navigation";
import { fullPhone } from "@/lib/phone";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSendStore } from "@/stores/send-store";
import { useWalletStore } from "@/stores/wallet-store";

import { flowPerson } from "./flow-person";
import { PEOPLE, personInitials, personName, type Person } from "./people";
import { TRACK_STAGES } from "./send-logic";
import { TransferCard } from "./transfer-card";
import {
  parseAmount,
  useTransferPipeline,
  type TrackPhase,
} from "./use-transfer-pipeline";

const FALLBACK_RECIPIENT: Person = PEOPLE.yuki;
const FALLBACK_ME_INITIALS = "ME";
const FAILED_DESC = "Couldn't complete. Nothing was taken.";
const TRANSFERRING_INDEX = 2;
const RECEIVED_INDEX = 3;

type StageState = "done" | "now" | "fail" | "todo";

function stageState(
  index: number,
  phase: TrackPhase,
  stage: number,
  failedAt: number | null,
): StageState {
  if (phase === "bad" && failedAt !== null) {
    if (index === failedAt) return "fail";
    if (index > failedAt) return "todo";
  }
  if (index < stage || phase === "ok") return "done";
  return index === stage ? "now" : "todo";
}

function stageDesc(
  index: number,
  state: StageState,
  recipient: Person,
  amount: number,
): string {
  if (state === "fail") return FAILED_DESC;
  if (index === TRANSFERRING_INDEX) {
    return `To ${personName(recipient)} · ${fullPhone(recipient.cc, recipient.num)}`;
  }
  if (index === RECEIVED_INDEX) {
    return `${recipient.first} received ${fmt(amount)} USDT`;
  }
  return TRACK_STAGES[index]?.desc ?? "";
}

function StageBadge({ state }: { state: StageState }) {
  if (state === "done" || state === "fail") {
    return (
      <View
        className={cn(
          "h-[28px] w-[28px] items-center justify-center rounded-full",
          state === "done" ? "bg-pos" : "bg-neg",
        )}
      >
        <Icon
          name={state === "done" ? "check" : "x"}
          size={12}
          strokeWidth={3}
          color="#FFFFFF"
        />
      </View>
    );
  }
  return (
    <View
      className={cn(
        "h-[28px] w-[28px] items-center justify-center rounded-full border-[1.5px]",
        state === "now" ? "border-ink bg-surface" : "border-line bg-surface-2",
      )}
    >
      {state === "now" ? <Spinner size={16} /> : null}
    </View>
  );
}

type StageRowProps = {
  index: number;
  state: StageState;
  stamp: string;
  desc: string;
  isLast: boolean;
};

function StageRow({ index, state, stamp, desc, isLast }: StageRowProps) {
  const title = TRACK_STAGES[index]?.title ?? "";
  const isFail = state === "fail";

  return (
    <View className="relative flex-row gap-3 pb-4">
      {isLast ? null : (
        <View
          className={cn(
            "absolute bottom-[2px] left-[13px] top-[28px] w-[2px]",
            state === "done" ? "bg-pos" : "bg-line",
          )}
        />
      )}
      <StageBadge state={state} />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2 pt-1">
          <Text
            className={cn(
              "font-text-semibold text-[15px]",
              state === "todo" && "text-ink-3",
              isFail && "text-neg",
            )}
          >
            {title}
          </Text>
          <Text className="font-text-semibold text-[12px] text-ink-3">{stamp}</Text>
        </View>
        <Text
          className={cn("text-[12px] leading-[17px]", isFail ? "text-neg" : "text-ink-3")}
        >
          {desc}
        </Text>
      </View>
    </View>
  );
}

type LiveTimelineProps = {
  phase: TrackPhase;
  stage: number;
  failedAt: number | null;
  times: readonly string[];
  recipient: Person;
  amount: number;
};

function LiveTimeline({ phase, stage, failedAt, times, recipient, amount }: LiveTimelineProps) {
  return (
    <View
      accessibilityRole="list"
      className="mt-4 rounded-[20px] border border-line bg-surface px-4 pb-1 pt-4"
    >
      {TRACK_STAGES.map((item, index) => {
        const state = stageState(index, phase, stage, failedAt);
        return (
          <StageRow
            key={item.title}
            index={index}
            state={state}
            stamp={times[index] ?? ""}
            desc={stageDesc(index, state, recipient, amount)}
            isLast={index === TRACK_STAGES.length - 1}
          />
        );
      })}
    </View>
  );
}

type TrackFooterProps = {
  phase: TrackPhase;
  onReceipt: () => void;
  onRetry: () => void;
  onHome: () => void;
};

function TrackFooter({ phase, onReceipt, onRetry, onHome }: TrackFooterProps) {
  if (phase === "ok") {
    return (
      <Footer>
        <Button label="View receipt" onPress={onReceipt} />
        <Button label="Done" variant="sec" onPress={onHome} />
      </Footer>
    );
  }
  if (phase === "bad") {
    return (
      <Footer>
        <Button label="Try again" onPress={onRetry} />
        <Button label="Back to home" variant="sec" onPress={onHome} />
      </Footer>
    );
  }
  return (
    <Footer>
      <Button label="Please keep the app open" variant="sec" disabled />
    </Footer>
  );
}

export function SendTrackScreen() {
  const router = useRouter();
  const flow = useSendStore((s) => s.flow);
  const user = useOnboardingStore((s) => s.user);
  const balance = useWalletStore((s) => s.balanceUsdt);
  const { phase, sub, stage, failedAt, times } = useTransferPipeline();
  const recipient = flowPerson(flow) ?? FALLBACK_RECIPIENT;
  const amount = parseAmount(flow.amount);

  useEffect(() => {
    if (phase === "ok") announce("Sent");
    if (phase === "bad") announce("Transfer stopped. Nothing was taken from your balance.");
  }, [phase]);

  const handleReceipt = () => router.push("/send/receipt");
  const handleRetry = () => router.back();
  const handleHome = () => resetTo(router, "/home");

  return (
    <Screen>
      {/* Mid-transfer, swipe-back must not return into the PIN/review screens. */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      <PlainBar />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        <TransferCard
          phase={phase}
          sub={sub}
          meInitials={user ? personInitials(user) : FALLBACK_ME_INITIALS}
          recipient={recipient}
          amount={amount}
          failure={flow.failure}
        />
        <LiveTimeline
          phase={phase}
          stage={stage}
          failedAt={failedAt}
          times={times}
          recipient={recipient}
          amount={amount}
        />
        {phase === "ok" ? (
          <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 12 }}>
            <DetailList
              rows={[
                { label: "Your balance", value: `${fmt(balance)} USDT` },
                {
                  label: "Reference",
                  value: <Text className="font-mono-medium text-[14px]">{flow.ref}</Text>,
                },
              ]}
            />
          </Animated.View>
        ) : null}
      </ScrollView>
      <TrackFooter
        phase={phase}
        onReceipt={handleReceipt}
        onRetry={handleRetry}
        onHome={handleHome}
      />
      {phase === "ok" ? <Confetti /> : null}
    </Screen>
  );
}
