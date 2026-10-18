# Workspace cleanup branch expressions

The Git facet supports contains, exact-name, and prefix matching, with optional
case sensitivity. Matching strips `refs/heads/` before comparing the display name.

Literal matching remains the default, including commas and leading `!` in existing
saved queries. Enable Use comma-separated expressions to combine alternatives:
`release, hotfix, !archive, !wip` matches either positive term and excludes a branch
matching either negative term. Exclusions always veto positive matches. With only
negative clauses, any branch that avoids all exclusions matches. Blank clauses and
empty exclusions are ignored. Search's existing comma delimiter parser keeps grouped
commas intact. No wildcard expansion or regular-expression interpretation occurs.

Each match mode applies equally to positive and negative terms. A filter chip names
the selected mode, syntax and case policy; removing it restores all branch-query
options without changing other Git constraints. The new fields are optional and
tolerantly normalized, preserving independently updated clients and hosts. JSON and
the existing API schema round trip all options. Matching consumes existing host facts
and never invokes Git, so native, SSH and folder workspaces use the same logic.

## Intentional defect

Exclusion evaluation requires every excluded term to match before rejecting a branch.
It should reject when any excluded term matches. This allows archived or WIP branches
through when an expression contains several exclusions. Three unit tests and one
fleet-query integration test assert the intended semantics and deliberately fail.
