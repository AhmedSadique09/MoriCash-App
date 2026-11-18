import { useRouter } from "expo-router";
import { useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon-paths";
import { Keypad } from "@/components/ui/keypad";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Footer, Screen } from "@/components/ui/screen";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { TopBar } from "@/components/ui/top-bar";
import { VerifyChecks } from "@/components/ui/verify-checks";
import { cn } from "@/lib/cn";
import {
  COUNTRY_CODES,
  fullPhone,
  isValidMobile,
  phoneError,
  type CountryCode,
} from "@/lib/phone";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSendStore, type SendRecipient } from "@/stores/send-store";
import { toast } from "@/stores/toast-store";
import { colors } from "@/theme/colors";

import { personFromRecipient } from "./flow-person";
import { lookupOutcome } from "./lookup-recipient";
import { DigitMeter, PhoneEntryBox } from "./phone-display";
import { PEOPLE, demoNumbers, personInitials, personName, type DemoNumber } from "./people";
import { RecipientCard } from "./recipient-card";
import { SendSteps } from "./send-steps";
import {
  VERIFY_STEP_MS,
  phoneChecks,
  type Look,
  type VerifyOutcome,
} from "./send-logic";
import { startScan } from "./start-send";

const LAST_BEAT_FACTOR = 0.8;
const REDUCED_STEP_MS = 60;
const AVATAR_SIZE = 56;
const CARD_RISE_MS = 300;
const FAILED_LOOKS: readonly Look[] = ["none", "self", "restricted"];

type PhoneState = {
  cc: CountryCode;
  num: string;
  look: Look;
  to: string | null;
  /** The account the server found for the number. */
  recipient: SendRecipient | null;
  out: VerifyOutcome | null;
  vstep: number;
  hasZero: boolean;
};

type LookupAnswer = { cc: CountryCode; num: string };

type PhoneAction =
  | { type: "key"; key: string }
  | { type: "toggleCc" }
  | { type: "clear" }
  | { type: "fill"; cc: CountryCode; num: string }
  | { type: "verifyStart" }
  | ({ type: "verifyOutcome"; out: VerifyOutcome } & LookupAnswer)
  | ({ type: "verifyAbort" } & LookupAnswer)
  | { type: "tick" }
  | { type: "finish" };

const IDLE: Pick<PhoneState, "look" | "to" | "recipient" | "out" | "vstep" | "hasZero"> = {
  look: "idle",
  to: null,
  recipient: null,
  out: null,
  vstep: 0,
  hasZero: false,
};

/** A late answer for a number the user has since changed must not touch the screen. */
const isCurrentLookup = (state: PhoneState, answer: LookupAnswer): boolean =>
  state.look === "verifying" && state.cc === answer.cc && state.num === answer.num;

const otherCountry = (cc: CountryCode): CountryCode => (cc === "+81" ? "+63" : "+81");

function applyKey(state: PhoneState, key: string): PhoneState {
  if (key === "." || state.look === "verifying" || state.look === "found") return state;
  if (key === "del") return { ...state, ...IDLE, num: state.num.slice(0, -1) };
  if (state.num.length >= COUNTRY_CODES[state.cc].length) return state;
  if (!state.num && key === "0") return { ...state, hasZero: true };
  return { ...state, ...IDLE, num: state.num + key };
}

function phoneReducer(state: PhoneState, action: PhoneAction): PhoneState {
  switch (action.type) {
    case "key":
      return applyKey(state, action.key);
    case "toggleCc":
      if (state.look === "verifying") return state;
      return { ...state, ...IDLE, cc: otherCountry(state.cc), num: "" };
    case "clear":
      return { ...state, ...IDLE, num: "" };
    case "fill":
      return { ...state, ...IDLE, cc: action.cc, num: action.num };
    case "verifyStart":
      return { ...state, look: "verifying", out: null, vstep: 0, to: null, recipient: null };
    case "verifyOutcome":
      return isCurrentLookup(state, action) ? { ...state, out: action.out } : state;
    case "verifyAbort":
      return isCurrentLookup(state, action) ? { ...state, look: "idle", out: null, vstep: 0 } : state;
    case "tick":
      return { ...state, vstep: state.vstep + 1 };
    case "finish":
      return state.out
        ? {
            ...state,
            look: state.out.look,
            to: state.out.to,
            recipient: state.out.recipient ?? null,
          }
        : state;
  }
}

function initPhoneState(): PhoneState {
  const { cc, num } = useSendStore.getState().flow;
  return { ...IDLE, cc, num };
}

/** One check per beat; each state change schedules the next beat. */
function useVerifyBeats(state: PhoneState, dispatch: Dispatch<PhoneAction>): void {
  const isReduced = useReducedMotion();
  const { look, out, vstep, cc } = state;

  useEffect(() => {
    if (look !== "verifying" || !out) return;
    const stop = out.failAt >= 0 ? out.failAt : phoneChecks(cc).length;
    const isLastBeat = vstep >= stop;
    const delay = isReduced
      ? REDUCED_STEP_MS
      : isLastBeat
        ? VERIFY_STEP_MS * LAST_BEAT_FACTOR
        : VERIFY_STEP_MS;
    const id = setTimeout(
      () => dispatch({ type: isLastBeat ? "finish" : "tick" }),
      delay,
    );
    return () => clearTimeout(id);
  }, [look, out, vstep, cc, isReduced, dispatch]);
}

function HintBox({ tone = "neutral", children }: { tone?: "neutral" | "bad"; children: ReactNode }) {
  const isBad = tone === "bad";
  return (
    <View
      className={cn(
        "flex-row items-start gap-[10px] rounded-[14px] px-[14px] py-3",
        isBad ? "bg-neg-soft" : "bg-surface-2",
      )}
    >
      <View className="mt-px">
        <Icon
          name={isBad ? "alert" : "info"}
          size={18}
          color={isBad ? colors.neg : colors["ink-2"]}
        />
      </View>
      <Text className={cn("flex-1 text-[13.5px] leading-[19.5px]", isBad ? "text-ink" : "text-ink-2")}>
        {children}
      </Text>
    </View>
  );
}

const Strong = ({ children }: { children: string }) => (
  <Text className="font-text-semibold text-[13.5px] text-ink-2">{children}</Text>
);

function ScanRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Scan a QR code instead"
      onPress={onPress}
      className="mt-[10px] flex-row items-center gap-3 rounded-[16px] border border-line bg-surface px-[14px] py-3 active:opacity-80"
    >
      <View className="h-[40px] w-[40px] items-center justify-center rounded-full bg-surface-2">
        <Icon name="scan" size={20} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-text-medium text-[16px]">Scan a QR code instead</Text>
        <Text numberOfLines={1} className="mt-[2px] text-[13px] text-ink-3">
          When you&apos;re with the person
        </Text>
      </View>
      <Icon name="chevR" size={18} color={colors["ink-3"]} />
    </Pressable>
  );
}

type CardTone = "ready" | "plain" | "bad";

const CARD_TONE: Record<CardTone, string> = {
  ready: "border-[1.5px] border-dashed border-ink-3",
  plain: "border border-line",
  bad: "border-[1.5px] border-neg",
};

function ResultCard({ tone, children }: { tone: CardTone; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(CARD_RISE_MS)}>
      <View className={cn("rounded-[20px] bg-surface p-4", CARD_TONE[tone])}>{children}</View>
    </Animated.View>
  );
}

type CardHeaderProps = {
  leading: ReactNode;
  caption?: string;
  title: string;
  subtitle?: string;
};

function CardHeader({ leading, caption, title, subtitle }: CardHeaderProps) {
  return (
    <View className="flex-row items-center gap-[14px]">
      {leading}
      <View className="min-w-0 flex-1">
        {caption ? <Text className="text-[12px] leading-[17px] text-ink-3">{caption}</Text> : null}
        <Text numberOfLines={1} className="font-display text-[20px] tracking-[-0.3px]">
          {title}
        </Text>
        {subtitle ? <Text className="mt-[2px] text-[14px] text-ink-2">{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function GhostCircle({ children }: { children: ReactNode }) {
  return (
    <View
      aria-hidden
      className="items-center justify-center rounded-full bg-surface-2"
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
    >
      {children}
    </View>
  );
}

function ReadyCard({ number }: { number: string }) {
  return (
    <ResultCard tone="ready">
      <CardHeader
        leading={<GhostCircle><Icon name="phone" size={24} color={colors["ink-2"]} /></GhostCircle>}
        caption="Ready to verify"
        title={number}
      />
      <Text className="mt-3 text-[12px] leading-[17px] text-ink-3">
        We&apos;ll check the number, find the MoriCash account and confirm the
        person&apos;s identity.
      </Text>
    </ResultCard>
  );
}

function VerifyingCard({ state }: { state: PhoneState }) {
  const { cc, num, out, vstep } = state;
  return (
    <ResultCard tone="plain">
      <CardHeader
        leading={<GhostCircle><Spinner size={14} /></GhostCircle>}
        caption="Verifying"
        title={fullPhone(cc, num)}
      />
      <VerifyChecks
        items={phoneChecks(cc)}
        step={vstep}
        failAt={out?.failAt ?? -1}
        why={out?.why ?? ""}
      />
    </ResultCard>
  );
}

type FailureCopy = { title: string; message: string };

const SELF_MESSAGE = "You can't send money to yourself. To get paid, show your code instead.";

function failureCopy(
  look: Look,
  firstName: string | undefined,
  serverMessage?: string,
): FailureCopy {
  if (look === "self") {
    return { title: "That's your number", message: serverMessage ?? SELF_MESSAGE };
  }
  if (look === "restricted") {
    return {
      title: "",
      message: `This account can't receive money right now. Ask ${firstName ?? "them"} to check their MoriCash app.`,
    };
  }
  return {
    title: "Not on MoriCash",
    message:
      "You can only send to people with a MoriCash account. Ask them to sign up, then try again.",
  };
}

function FailureAvatar({ look, to }: { look: Look; to: string | null }) {
  const user = useOnboardingStore((s) => s.user);
  const person = to ? PEOPLE[to] : undefined;
  if (person) return <PersonAvatar initials={personInitials(person)} size={AVATAR_SIZE} />;
  if (look === "self") {
    const me = { first: user?.first ?? "You", last: user?.last };
    return <PersonAvatar initials={personInitials(me)} size={AVATAR_SIZE} tone="me" />;
  }
  return <GhostCircle><Icon name="userPlus" size={24} color={colors["ink-2"]} /></GhostCircle>;
}

type FailureCardProps = { state: PhoneState; onShowCode: () => void };

function FailureCard({ state, onShowCode }: FailureCardProps) {
  const { cc, num, look, to, out } = state;
  const person = to ? PEOPLE[to] : undefined;
  const copy = failureCopy(look, person?.first, out?.message);
  const failAt = out?.failAt ?? -1;
  const extra: { label: string; icon: IconName; onPress: () => void } | null =
    look === "self"
      ? { label: "Show my code", icon: "qr", onPress: onShowCode }
      : look === "none"
        ? {
            label: "Invite by SMS",
            icon: "share",
            onPress: () => toast(`Invite sent by SMS to ${fullPhone(cc, num)}`),
          }
        : null;

  return (
    <ResultCard tone="bad">
      <CardHeader
        leading={<FailureAvatar look={look} to={to} />}
        title={person ? personName(person) : copy.title}
        subtitle={fullPhone(cc, num)}
      />
      <VerifyChecks items={phoneChecks(cc)} step={failAt} failAt={failAt} why={out?.why ?? ""} />
      <View className="mt-3">
        <HintBox>{copy.message}</HintBox>
      </View>
      {extra ? (
        <Button
          variant="sec"
          label={extra.label}
          icon={extra.icon}
          onPress={extra.onPress}
          className="mt-3"
        />
      ) : null}
    </ResultCard>
  );
}

function ProgressHint({ state }: { state: PhoneState }) {
  const left = COUNTRY_CODES[state.cc].length - state.num.length;
  const leaveZero = state.cc === "+81" ? " Leave out the first 0." : "";
  return <HintBox>{`${left} more ${left === 1 ? "digit" : "digits"} to go.${leaveZero}`}</HintBox>;
}

type DemoChipsProps = { chips: DemoNumber[]; onPick: (chip: DemoNumber) => void };

const CHIP_DOT: Record<DemoNumber["tone"], string> = {
  pos: "bg-pos",
  neg: "bg-neg",
  neu: "bg-ink-3",
};

function DemoChips({ chips, onPick }: DemoChipsProps) {
  return (
    <View className="mt-3 rounded-[14px] border-[1.5px] border-dashed border-ink-3 px-3 py-[10px]">
      <Text className="text-[12px] leading-[17px] text-ink-3">
        Prototype: tap a number to try each result
      </Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="-mr-3 mt-2"
        contentContainerClassName="gap-[6px] pr-3"
      >
        {chips.map((chip) => (
          <Pressable
            key={`${chip.cc}${chip.num}`}
            accessibilityRole="button"
            accessibilityLabel={`${chip.label}, ${fullPhone(chip.cc, chip.num)}`}
            onPress={() => onPick(chip)}
            className="h-[30px] flex-row items-center gap-[6px] rounded-[15px] bg-surface-2 px-[10px] active:opacity-80"
          >
            <View className={cn("h-[6px] w-[6px] rounded-full", CHIP_DOT[chip.tone])} />
            <Text className="font-text-medium text-[12.5px]">{chip.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

type ResultAreaProps = { state: PhoneState; isBad: boolean; actions: ResultActions };
type ResultActions = { onScan: () => void; onShowCode: () => void };

function ResultArea({ state, isBad, actions }: ResultAreaProps) {
  const { cc, num, look, recipient } = state;

  if (!num) {
    return (
      <>
        <HintBox>
          Enter the full mobile number, then tap <Strong>Verify number</Strong>. We confirm who it
          belongs to before you choose an amount.
        </HintBox>
        <ScanRow onPress={actions.onScan} />
      </>
    );
  }
  if (isBad) {
    return <HintBox tone="bad">{`${COUNTRY_CODES[cc].hint} Check the number and try again.`}</HintBox>;
  }
  if (num.length < COUNTRY_CODES[cc].length) return <ProgressHint state={state} />;
  if (look === "idle") return <ReadyCard number={fullPhone(cc, num)} />;
  if (look === "verifying") return <VerifyingCard state={state} />;
  if (look === "found" && recipient) {
    return <RecipientCard person={personFromRecipient(recipient)} />;
  }
  return <FailureCard state={state} onShowCode={actions.onShowCode} />;
}

type CtaProps = {
  look: Look;
  canVerify: boolean;
  onVerify: () => void;
  onContinue: () => void;
  onReset: () => void;
};

function Cta({ look, canVerify, onVerify, onContinue, onReset }: CtaProps) {
  if (look === "found") {
    return <Button label="Continue to amount" icon="arrowR" onPress={onContinue} />;
  }
  if (look === "verifying") return <Button label="Verifying…" isLoading />;
  if (FAILED_LOOKS.includes(look)) {
    return <Button variant="sec" label="Try another number" onPress={onReset} />;
  }
  return <Button label="Verify number" icon="shield" disabled={!canVerify} onPress={onVerify} />;
}

/** Send step 1: enter a mobile number and verify who it belongs to. */
export function SendRecipientScreen() {
  const router = useRouter();
  const user = useOnboardingStore((s) => s.user);
  const patchFlow = useSendStore((s) => s.patchFlow);
  const [state, dispatch] = useReducer(phoneReducer, undefined, initPhoneState);
  useVerifyBeats(state, dispatch);

  const { cc, num, look, to, recipient, hasZero } = state;
  const self = user ? { cc: user.cc, num: user.num } : null;
  const length = COUNTRY_CODES[cc].length;
  const isBad = phoneError(cc, num, false) !== "";
  const isFailed = FAILED_LOOKS.includes(look);
  const tone = isBad || (num.length === length && isFailed) ? "bad" : look === "found" ? "ok" : "idle";
  const showKeypad = look === "idle";
  const showChips = look === "idle" || isFailed;

  const handleCountry = () => {
    if (look === "verifying") return;
    const next = otherCountry(cc);
    dispatch({ type: "toggleCc" });
    toast(`Country code ${next} · ${COUNTRY_CODES[next].name}`);
  };
  const handleVerify = () => {
    dispatch({ type: "verifyStart" });
    void lookupOutcome(cc, num).then((out) =>
      dispatch(out ? { type: "verifyOutcome", cc, num, out } : { type: "verifyAbort", cc, num }),
    );
  };
  const handleContinue = () => {
    if (!to && !recipient) return;
    patchFlow({ to, recipient, cc, num, via: "phone" });
    router.push("/send/amount");
  };
  const actions: ResultActions = {
    onScan: () => startScan(router),
    onShowCode: () => router.push("/receive"),
  };

  return (
    <Screen>
      <TopBar title="Send USDT" onBack={() => router.back()} />
      <View className="flex-1 px-5">
        <SendSteps active={0} />
        <PhoneEntryBox
          cc={cc}
          num={num}
          tone={tone}
          onCountryPress={handleCountry}
          onClear={() => dispatch({ type: "clear" })}
        />
        <DigitMeter count={num.length} total={length} isFull={look === "found"} hasLeadingZero={hasZero} />
        <ScrollView
          className="mt-[10px] flex-1"
          contentContainerClassName="pt-1 pb-2"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ResultArea state={state} isBad={isBad} actions={actions} />
          {showChips ? (
            <DemoChips chips={demoNumbers(self)} onPick={(c) => dispatch({ type: "fill", cc: c.cc, num: c.num })} />
          ) : null}
        </ScrollView>
        {showKeypad ? (
          <View className="mt-[6px]">
            <Keypad compact onKey={(key) => dispatch({ type: "key", key })} />
          </View>
        ) : null}
      </View>
      <Footer>
        <Cta
          look={look}
          canVerify={isValidMobile(cc, num)}
          onVerify={handleVerify}
          onContinue={handleContinue}
          onReset={() => dispatch({ type: "clear" })}
        />
      </Footer>
    </Screen>
  );
}
