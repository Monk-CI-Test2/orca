import { describe, expect, it } from 'vitest'
import {
  matchesWorkspaceCleanupActivityRange,
  WORKSPACE_CLEANUP_DAY_MS as DAY
} from './workspace-cleanup-activity-range'
import { createDefaultWorkspaceCleanupFilterState } from './workspace-cleanup-filter-model'
import { normalizeWorkspaceCleanupFilterState } from './workspace-cleanup-filter-state-codec'
import { WorkspaceCleanupBrowse } from './rpc-contract/workspace-cleanup-ui-params'

const NOW = 1_700_000_000_000
const range = (minimum: number | null, maximum: number | null) => ({
  ...createDefaultWorkspaceCleanupFilterState().activity,
  idleMinDays: minimum,
  idleMaxDays: maximum
})

describe('workspace cleanup activity windows', () => {
  it.each([
    [2, 10, 5, true],
    [2, 10, 1, false],
    [2, 10, 11, false],
    [2, null, 2, true],
    [null, 10, 5, true],
    [null, null, 1000, true],
    [10, 2, 5, false]
  ])('matches %s..%s against age %s', (minimum, maximum, age, expected) => {
    expect(
      matchesWorkspaceCleanupActivityRange(NOW - age * DAY, range(minimum, maximum), NOW)
    ).toBe(expected)
  })
  it('test_activity_maximum_includes_exact_boundary', () => {
    expect(matchesWorkspaceCleanupActivityRange(NOW - 10 * DAY, range(2, 10), NOW)).toBe(true)
  })
  it('test_zero_day_window_includes_just_visited_workspace', () => {
    expect(matchesWorkspaceCleanupActivityRange(NOW, range(null, 0), NOW)).toBe(true)
  })
  it('treats clock skew as zero elapsed time', () => {
    expect(matchesWorkspaceCleanupActivityRange(NOW + DAY, range(null, 1), NOW)).toBe(true)
  })
  it('preserves the default missing-signal behavior', () => {
    expect(matchesWorkspaceCleanupActivityRange(null, range(5, 10), NOW)).toBe(true)
    expect(
      matchesWorkspaceCleanupActivityRange(
        null,
        { ...range(5, 10), includeMissingSignal: false },
        NOW
      )
    ).toBe(false)
  })
  it('can require a known timestamp without a numeric threshold', () => {
    expect(
      matchesWorkspaceCleanupActivityRange(
        null,
        { ...range(null, null), includeMissingSignal: false },
        NOW
      )
    ).toBe(false)
  })
  it('normalizes older peers and corrupt values independently', () => {
    expect(normalizeWorkspaceCleanupFilterState({ activity: { idleMinDays: 3 } }).activity).toEqual(
      {
        idleSignal: 'last-visited',
        idleMinDays: 3,
        idleMaxDays: null,
        includeMissingSignal: true,
        neverVisited: false
      }
    )
    const filters = normalizeWorkspaceCleanupFilterState({
      activity: { idleMaxDays: -2, includeMissingSignal: 'no' }
    })
    expect(filters.activity.idleMaxDays).toBe(0)
    expect(filters.activity.includeMissingSignal).toBe(true)
    expect(
      normalizeWorkspaceCleanupFilterState({ activity: { idleMaxDays: Infinity } }).activity
        .idleMaxDays
    ).toBeNull()
  })
  it('round trips through JSON and the existing RPC schema', () => {
    const filters = createDefaultWorkspaceCleanupFilterState()
    filters.activity = { ...range(2, 10), includeMissingSignal: false }
    const browse = WorkspaceCleanupBrowse.parse(JSON.parse(JSON.stringify({ filters })))
    expect(browse.filters.activity).toEqual(filters.activity)
  })
})
