type FileNameConstraint = {
  exclude: boolean
  field: 'path' | 'name' | 'ext'
  value: string
}

function constraintFromToken(token: string): FileNameConstraint {
  const exclude = token.startsWith('-') && token.length > 1
  const body = exclude ? token.slice(1) : token
  const qualifier = /^(path|name|ext):/u.exec(body)
  const field = qualifier?.[1] === 'name' ? 'name' : qualifier?.[1] === 'ext' ? 'ext' : 'path'
  const raw = qualifier ? body.slice(qualifier[0].length) : body
  const value = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
  return { exclude, field, value: value.toLowerCase() }
}

/** Compile once per scan; relative paths keep their execution host's separator semantics. */
export function compileFileNameFilterTokens(
  tokens: readonly string[]
): (relativePath: string) => boolean {
  const constraints = tokens
    .map(constraintFromToken)
    .filter((constraint) => constraint.value !== '')
  return (relativePath) => {
    const path = relativePath.toLowerCase()
    const name = path.slice(path.lastIndexOf('/') + 1)
    const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
    return constraints.every(({ exclude, field, value }) => {
      const matches =
        field === 'ext'
          ? extension.includes(value.replace(/^\./u, ''))
          : (field === 'name' ? name : path).includes(value)
      return exclude ? !matches : matches
    })
  }
}
