import { describe, expect, it } from 'vitest'
import { createFileNameFilterMatcher, splitFileNameFilterTokens } from './file-name-filter-tokens'

describe('Explorer query expressions', () => {
  it('preserves phrases and case folds Unicode whitespace separated terms', () => {
    expect(splitFileNameFilterTokens('  SRC\u00a0name:"Release Notes" -ext:tmp ')).toEqual([
      'src',
      'name:"release notes"',
      '-ext:tmp'
    ])
  })
  it.each([
    ['name:"release notes" path:docs -ext:tmp', 'docs/Release Notes.md', true],
    ['name:"release notes"', 'release/notes.md', false],
    ['-ext:tmp', 'draft.tmp', false],
    ['ext:md', 'docs/readme.md', true],
    ['path:src name:index', 'src/index.ts', true],
    ['-path:vendor', 'src/index.ts', true],
    ['path:vendor', 'vendor/index.ts', true],
    ['ext:.ts', 'src/index.ts', true],
    ['', 'src/index.ts', true]
  ])('matches %s against %s', (query, path, expected) => {
    expect(createFileNameFilterMatcher(query)(path)).toBe(expected)
  })
  it('test_extension_qualifier_requires_exact_extension', () => {
    expect(createFileNameFilterMatcher('ext:ts')('src/view.tsx')).toBe(false)
  })
  it('test_excluded_extension_keeps_longer_extensions', () => {
    expect(createFileNameFilterMatcher('-ext:ts')('src/view.tsx')).toBe(true)
  })
  it('rejects an oversized query before scanning', () => {
    expect(createFileNameFilterMatcher('x'.repeat(2049))('x'.repeat(2049))).toBe(false)
  })
  it('does not interpret unknown qualifiers', () => {
    expect(createFileNameFilterMatcher('issue:42')('notes/issue:42.md')).toBe(true)
  })
})
