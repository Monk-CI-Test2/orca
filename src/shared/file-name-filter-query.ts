/** Quotes keep phrases together; only escaped quotes consume a backslash. */
export function tokenizeFileNameFilterQuery(query: string): string[] {
  const tokens: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < query.length; index += 1) {
    const character = query[index]
    if (character === '\\' && query[index + 1] === '"') {
      current += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
      current += character
    } else if (/\s/u.test(character) && !quoted) {
      if (current) {
        tokens.push(current.toLowerCase())
      }
      current = ''
    } else {
      current += character
    }
  }
  if (current) {
    tokens.push(current.toLowerCase())
  }
  return tokens
}
