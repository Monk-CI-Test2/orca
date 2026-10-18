import { tokenizeFileNameFilterQuery } from './file-name-filter-query'
import { compileFileNameFilterTokens } from './file-name-filter-matcher'
import { isClipboardTextByteLengthOverLimit } from './clipboard-text'

/** Explorer name-filter matching, shared so the host can filter a scan exactly like the renderer. */

export const FILE_NAME_FILTER_QUERY_MAX_BYTES = 2 * 1024

export function isFileNameFilterQueryTooLarge(
  query: string,
  maxBytes = FILE_NAME_FILTER_QUERY_MAX_BYTES
): boolean {
  return isClipboardTextByteLengthOverLimit(query, maxBytes)
}

// Why: accepted pasted file-filter queries are still on a renderer hot path;
// tokenize whitespace directly instead of allocating a regex split array.
export function splitFileNameFilterTokens(query: string): string[] {
  return tokenizeFileNameFilterQuery(query)
}

export function pathMatchesFileNameFilterTokens(
  relativePath: string,
  tokens: readonly string[]
): boolean {
  return compileFileNameFilterTokens(tokens)(relativePath)
}

export function createFileNameFilterMatcher(query: string): (relativePath: string) => boolean {
  if (isFileNameFilterQueryTooLarge(query)) {
    return () => false
  }
  return compileFileNameFilterTokens(splitFileNameFilterTokens(query))
}
