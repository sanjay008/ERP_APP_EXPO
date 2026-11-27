import type { EventVerificationResult } from "./eventService";

/** In-memory handoff from Scanner → Confirm (expo-router drops large JSON params). */
let pendingVerification: EventVerificationResult | null = null;

export function setPendingEventVerification(result: EventVerificationResult | null) {
  pendingVerification = result;
}

export function consumePendingEventVerification(): EventVerificationResult | null {
  const next = pendingVerification;
  pendingVerification = null;
  return next;
}

export function peekPendingEventVerification(): EventVerificationResult | null {
  return pendingVerification;
}
