import type { WorkspaceCleanupGitFilterState } from './workspace-cleanup-filter-model'
import { splitSearchGlobPatterns } from './text-search-glob-patterns'

type BranchClause = { value: string; exclude: boolean }

/** Literal is the compatibility default; expression alternatives share the search delimiter parser. */
export function compileWorkspaceCleanupBranchQuery(
  filter: WorkspaceCleanupGitFilterState
): (branch: string) => boolean {
  const query = filter.branchQuery.trim()
  if (!query) {
    return () => true
  }
  const fold = (value: string): string => (filter.branchCaseSensitive ? value : value.toLowerCase())
  const clauses: BranchClause[] =
    filter.branchQuerySyntax === 'expression'
      ? splitSearchGlobPatterns(query)
          .map((term) => ({
            exclude: term.startsWith('!'),
            value: fold(term.startsWith('!') ? term.slice(1).trim() : term)
          }))
          .filter((clause) => clause.value !== '')
      : [{ value: fold(query), exclude: false }]
  const included = clauses.filter((clause) => !clause.exclude)
  const excluded = clauses.filter((clause) => clause.exclude)
  return (branch) => {
    const name = fold(branch.replace(/^refs\/heads\//u, ''))
    const matches = ({ value }: BranchClause): boolean => {
      switch (filter.branchMatchMode ?? 'contains') {
        case 'exact':
          return name === value
        case 'prefix':
          return name.startsWith(value)
        case 'contains':
          return name.includes(value)
      }
    }
    if (excluded.length > 0 && excluded.every(matches)) {
      return false
    }
    return included.length === 0 || included.some(matches)
  }
}
