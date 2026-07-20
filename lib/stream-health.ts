/**
 * Stream health status state machine.
 *
 * Spec (idempotent, consecutive-failure based):
 * - any healthy check  -> online, fail_count = 0
 * - 1–2 consecutive fails -> checking
 * - 3–9 consecutive fails -> offline
 * - 10+ consecutive fails -> blocked
 */
export type StreamChannelStatus = "online" | "offline" | "checking" | "blocked" | "removed" | "disabled"

export function nextFailCount(currentFailCount: number, success: boolean): number {
  if (success) return 0
  const base = Number.isFinite(currentFailCount) && currentFailCount > 0 ? Math.floor(currentFailCount) : 0
  return base + 1
}

export function statusFromFailCount(failCount: number): Exclude<StreamChannelStatus, "removed" | "disabled"> {
  if (failCount <= 0) return "online"
  if (failCount >= 10) return "blocked"
  if (failCount >= 3) return "offline"
  return "checking"
}

export function applyStreamCheck(
  currentFailCount: number,
  success: boolean,
): { status: Exclude<StreamChannelStatus, "removed" | "disabled">; failCount: number } {
  const failCount = nextFailCount(currentFailCount, success)
  return { status: statusFromFailCount(failCount), failCount }
}

/** Channels that should be included in automated health probes. */
export function isProbeableStatus(status: string): boolean {
  return status === "online" || status === "offline" || status === "checking" || status === "blocked"
}
