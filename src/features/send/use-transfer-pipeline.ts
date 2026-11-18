import { useEffect, useReducer } from "react";
import { useReducedMotion } from "react-native-reanimated";

import { clockHms } from "@/lib/format";
import { useSendStore } from "@/stores/send-store";

import { REVIEW_ITEMS, REVIEW_STEP_MS, TRANSFER_MS } from "./send-logic";

/** rev = reviewing, tx = transferring, ok = sent, bad = stopped. */
export type TrackPhase = "rev" | "tx" | "ok" | "bad";

export type PipelineState = {
  /** Review checks passed so far (0..REVIEW_ITEMS.length). */
  sub: number;
  /** Live timeline index: 1 reviewing, 2 transferring, 3 transferred. */
  stage: number;
  failedAt: number | null;
  /** Clock stamp per timeline stage, filled in as each one completes. */
  times: readonly string[];
};

type PipelineAction =
  | { type: "reviewPassed" }
  | { type: "transferStarted"; at: string }
  | { type: "transferred"; at: string }
  | { type: "failed" };

const TRANSFER_STAGE = 2;
const DONE_STAGE = 3;
const AFTER_REVIEW_MS = 450;
const REDUCED_REVIEW_MS = 80;
const REDUCED_TRANSFER_MS = 120;

function initPipeline(): PipelineState {
  const now = clockHms();
  return { sub: 0, stage: 1, failedAt: null, times: [now, now] };
}

function withTime(times: readonly string[], index: number, at: string): string[] {
  const next = [...times];
  next[index] = at;
  return next;
}

function reducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case "reviewPassed":
      return { ...state, sub: state.sub + 1 };
    case "transferStarted":
      return {
        ...state,
        stage: TRANSFER_STAGE,
        times: withTime(state.times, TRANSFER_STAGE, action.at),
      };
    case "transferred":
      return {
        ...state,
        stage: DONE_STAGE,
        times: withTime(state.times, DONE_STAGE, action.at),
      };
    case "failed":
      return { ...state, failedAt: TRANSFER_STAGE };
  }
}

export function trackPhase(state: PipelineState): TrackPhase {
  if (state.failedAt !== null) return "bad";
  if (state.stage >= DONE_STAGE) return "ok";
  return state.stage === TRANSFER_STAGE ? "tx" : "rev";
}

export function parseAmount(raw: string): number {
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

export type TransferPipeline = PipelineState & { phase: TrackPhase };

/**
 * Drives the tracking screen: review checks, then the transfer, then success or
 * the failed state. The money already moved (or was refused) on the PIN screen;
 * this replays it as stages. It ends in failure when the server refused the
 * transfer (`flow.failure`) or the prototype's "make this fail" switch is on.
 */
export function useTransferPipeline(): TransferPipeline {
  const flow = useSendStore((s) => s.flow);
  const isReduced = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, undefined, initPipeline);
  const phase = trackPhase(state);
  const { sub } = state;

  useEffect(() => {
    if (phase === "ok" || phase === "bad") return;

    const handleReviewTick = () => {
      if (sub < REVIEW_ITEMS.length) dispatch({ type: "reviewPassed" });
      else dispatch({ type: "transferStarted", at: clockHms() });
    };

    const handleTransferTick = () => {
      if (flow.shouldFail || flow.failure !== null) {
        dispatch({ type: "failed" });
        return;
      }
      dispatch({ type: "transferred", at: clockHms() });
    };

    const reviewDelay = sub < REVIEW_ITEMS.length ? REVIEW_STEP_MS : AFTER_REVIEW_MS;
    const delay =
      phase === "rev"
        ? isReduced ? REDUCED_REVIEW_MS : reviewDelay
        : isReduced ? REDUCED_TRANSFER_MS : TRANSFER_MS;
    const timer = setTimeout(
      phase === "rev" ? handleReviewTick : handleTransferTick,
      delay,
    );
    return () => clearTimeout(timer);
  }, [phase, sub, flow, isReduced]);

  return { ...state, phase };
}
