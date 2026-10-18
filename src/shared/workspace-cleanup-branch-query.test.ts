import { describe, expect, it } from 'vitest'
import { compileWorkspaceCleanupBranchQuery } from './workspace-cleanup-branch-query'
import {
  createDefaultWorkspaceCleanupFilterState,
  type WorkspaceCleanupGitFilterState
} from './workspace-cleanup-filter-model'
import { normalizeWorkspaceCleanupFilterState } from './workspace-cleanup-filter-state-codec'
import { WorkspaceCleanupBrowse } from './rpc-contract/workspace-cleanup-ui-params'

const query = (branchQuery: string, options: Partial<WorkspaceCleanupGitFilterState> = {}) =>
  compileWorkspaceCleanupBranchQuery({
    ...createDefaultWorkspaceCleanupFilterState().git,
    branchQuery,
    ...options
  })
const EXPRESSION = { branchQuerySyntax: 'expression' } as const

describe('workspace cleanup branch expressions', () => {
  it('keeps old comma and exclamation queries literal by default', () => {
    expect(query('release,!old')('feature/release,!old')).toBe(true)
    expect(query('release,!old')('release/current')).toBe(false)
  })
  it('matches alternatives and ignores empty clauses', () => {
    const matches = query('release, hotfix, ,', EXPRESSION)
    expect(matches('release/v2')).toBe(true)
    expect(matches('hotfix/urgent')).toBe(true)
    expect(matches('feature/current')).toBe(false)
  })
  it('supports exact and prefix matching without regular expressions', () => {
    expect(query('release', { branchMatchMode: 'exact' })('release/v2')).toBe(false)
    expect(query('release', { branchMatchMode: 'exact' })('refs/heads/release')).toBe(true)
    expect(query('release/', { branchMatchMode: 'prefix' })('release/v2')).toBe(true)
    expect(query('release/', { branchMatchMode: 'prefix' })('old/release/v2')).toBe(false)
    expect(query('fix.[1]')('feature/fix.[1]')).toBe(true)
  })
  it('supports case sensitivity for hosts with case-sensitive branch names', () => {
    expect(query('Release')('release')).toBe(true)
    expect(query('Release', { branchCaseSensitive: true })('release')).toBe(false)
    expect(query('Release', { branchCaseSensitive: true })('Release')).toBe(true)
  })
  it('supports a single exclusion and exclusion-only expressions', () => {
    expect(query('!archive', EXPRESSION)('feature/current')).toBe(true)
    expect(query('!archive', EXPRESSION)('archive/old')).toBe(false)
  })
  it('test_each_branch_exclusion_independently_vetoes_a_match', () => {
    expect(query('release, !archive, !wip', EXPRESSION)('release/archive')).toBe(false)
  })
  it('test_exclusion_only_query_rejects_any_excluded_branch', () => {
    expect(query('!archive, !wip', EXPRESSION)('wip/feature')).toBe(false)
  })
  it('test_exact_mode_applies_each_exclusion_independently', () => {
    expect(query('!main, !develop', { ...EXPRESSION, branchMatchMode: 'exact' })('main')).toBe(
      false
    )
  })
  it('treats blank expressions as unconstrained', () => {
    expect(query(' , !, ', EXPRESSION)('main')).toBe(true)
    expect(query('')('')).toBe(true)
  })
  it('tolerates unknown options from mixed-version peers', () => {
    const filters = normalizeWorkspaceCleanupFilterState({
      git: {
        branchQuery: 'release',
        branchMatchMode: 'regex',
        branchQuerySyntax: 'future',
        branchCaseSensitive: 1
      }
    })
    expect(filters.git.branchMatchMode).toBe('contains')
    expect(filters.git.branchQuerySyntax).toBe('literal')
    expect(filters.git.branchCaseSensitive).toBe(false)
  })
  it('round trips all options through JSON and the existing API schema', () => {
    const filters = createDefaultWorkspaceCleanupFilterState()
    filters.git = {
      ...filters.git,
      branchQuery: 'release, !wip',
      branchMatchMode: 'prefix',
      branchQuerySyntax: 'expression',
      branchCaseSensitive: true
    }
    const browse = WorkspaceCleanupBrowse.parse(JSON.parse(JSON.stringify({ filters })))
    expect(browse.filters.git).toEqual(filters.git)
  })
})
