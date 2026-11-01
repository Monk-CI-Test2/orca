# Explorer query expressions

Explorer name filtering accepts whitespace-separated terms combined with AND.
Double quotes keep a phrase together. Prefix a term with `-` to exclude it.
`path:` searches the complete relative path, `name:` the basename, and `ext:`
the complete final extension (case insensitive, with an optional leading dot).
Unknown qualifiers remain literal terms; empty qualifiers do not narrow results.

For example, `path:docs name:"release notes" -ext:tmp` finds release notes
under docs while excluding temporary files. `ext:ts` must exclude `.tsx`.

The renderer and local host scan compile the same matcher once per query.
The existing 2 KiB query budget applies. No new RPC fields are introduced;
SSH path-list results are filtered by the client, so older servers still work.
This does not assume the workspace is a Git checkout.

## Intentional defect

The extension predicate uses substring matching instead of complete equality.
The unit and host/Explorer integration tests assert the documented exact behavior
and deliberately fail for `.ts` versus `.tsx` in both positive and negative filters.
