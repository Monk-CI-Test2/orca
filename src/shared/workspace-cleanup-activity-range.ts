import type { WorkspaceCleanupActivityFilter } from './workspace-cleanup-filter-model'

export const WORKSPACE_CLEANUP_DAY_MS = 24 * 60 * 60 * 1000

/** Timestamps are host facts; missing contact never supplies an activity timestamp. */
export function matchesWorkspaceCleanupActivityRange(
  signalAt: number | null,
  filter: WorkspaceCleanupActivityFilter,
  now: number
): boolean {
  const maximum = filter.idleMaxDays ?? null
  if (filter.idleMinDays === null && maximum === null) {
    return filter.includeMissingSignal !== false || signalAt !== null
  }
  if (signalAt === null) {
    return filter.includeMissingSignal !== false
  }
  const elapsed = Math.max(0, now - signalAt)
  if (filter.idleMinDays !== null && elapsed < filter.idleMinDays * WORKSPACE_CLEANUP_DAY_MS) {
    return false
  }
  return maximum === null || elapsed < maximum * WORKSPACE_CLEANUP_DAY_MS
}
