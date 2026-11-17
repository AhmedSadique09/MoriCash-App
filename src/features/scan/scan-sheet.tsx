import { View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PersonCard } from "@/components/ui/person-card";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VerifyChecks } from "@/components/ui/verify-checks";
import { QR_CHECKS, type QrOutcome } from "@/features/send/send-logic";
import { colors } from "@/theme/colors";

export type ScanLook = "idle" | "verifying" | "found" | "bad";

const BADGE_SIZE = 56;
const SPINNER_SIZE = 14;
const FAIL_ICON_SIZE = 28;

type ScanSheetProps = {
  res: QrOutcome | null;
  look: ScanLook;
  vstep: number;
  onEnterAmount: () => void;
  onScanAgain: () => void;
};

function VerifyingBody({ res, vstep }: { res: QrOutcome; vstep: number }) {
  return (
    <>
      <View className="flex-row items-center gap-[14px]">
        <View
          className="items-center justify-center rounded-full bg-surface-2"
          style={{ width: BADGE_SIZE, height: BADGE_SIZE }}
        >
          <Spinner size={SPINNER_SIZE} />
        </View>
        <View>
          <Text className="text-[12px] leading-[17px] text-ink-3">
            Verifying
          </Text>
          <Text
            accessibilityRole="header"
            className="font-display text-[20px] tracking-[-0.3px]"
          >
            MoriCash code
          </Text>
        </View>
      </View>
      <VerifyChecks
        items={QR_CHECKS}
        step={vstep}
        failAt={res.failAt}
        why={res.why}
      />
    </>
  );
}

type FoundBodyProps = {
  res: QrOutcome;
  onEnterAmount: () => void;
  onScanAgain: () => void;
};

function FoundBody({ res, onEnterAmount, onScanAgain }: FoundBodyProps) {
  return (
    <>
      {res.to ? <PersonCard personKey={res.to} /> : null}
      <Button
        label="Enter amount"
        onPress={onEnterAmount}
        className="mt-4"
      />
      <Button
        label="Scan a different code"
        variant="ghost"
        onPress={onScanAgain}
        className="mt-[6px]"
      />
    </>
  );
}

type FailedBodyProps = {
  res: QrOutcome;
  onScanAgain: () => void;
};

function FailedBody({ res, onScanAgain }: FailedBodyProps) {
  return (
    <>
      <View
        className="mb-[14px] mt-1 items-center justify-center self-center rounded-full bg-neg-soft"
        style={{ width: 64, height: 64 }}
      >
        <Icon
          name={res.icon ?? "alert"}
          size={FAIL_ICON_SIZE}
          strokeWidth={2}
          color={colors.neg}
        />
      </View>
      <Text
        accessibilityRole="header"
        className="text-center font-display text-[19px]"
      >
        {res.title}
      </Text>
      <Text className="mx-auto mt-[6px] max-w-[300px] text-center text-[15px] leading-[22px] text-ink-2">
        {res.sub}
      </Text>
      <VerifyChecks
        items={QR_CHECKS}
        step={res.failAt}
        failAt={res.failAt}
        why={res.why}
      />
      <Button label="Scan again" onPress={onScanAgain} className="mt-4" />
    </>
  );
}

/** Result sheet: verifying checks, the found person, or why the code was rejected. */
export function ScanSheet({
  res,
  look,
  vstep,
  onEnterAmount,
  onScanAgain,
}: ScanSheetProps) {
  const isVerifying = look === "verifying";

  return (
    <BottomSheet
      visible={res !== null}
      // Verification cannot be dismissed mid-way; the other states reset the scanner.
      onClose={isVerifying ? () => undefined : onScanAgain}
    >
      {res === null ? null : isVerifying ? (
        <VerifyingBody res={res} vstep={vstep} />
      ) : look === "found" ? (
        <FoundBody
          res={res}
          onEnterAmount={onEnterAmount}
          onScanAgain={onScanAgain}
        />
      ) : look === "bad" ? (
        <FailedBody res={res} onScanAgain={onScanAgain} />
      ) : null}
    </BottomSheet>
  );
}
