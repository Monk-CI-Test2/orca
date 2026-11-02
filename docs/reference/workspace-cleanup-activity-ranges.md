# Workspace cleanup activity windows

The Activity facet accepts a minimum and an inclusive maximum idle age in days,
using the selected last-visited, last-activity, or created timestamp. Blank bounds
are unconstrained. Zero is meaningful, fractions are supported, and reversed
bounds match no known timestamps. Future timestamps clamp to zero elapsed time.

Unknown timestamps remain included by default, preserving existing behavior.
The new Include unknown activity checkbox can exclude them, including when both
bounds are blank. The independent Never opened filter still applies first.
Each new constraint has its own removable chip; clearing one preserves the others.

Fields are optional for independently updated hosts and clients. The existing
tolerant state codec restores old persisted data and validates each new field.
JSON and the existing client-ui RPC schema preserve the range. Filtering consumes
host-provided facts without probing processes or interpreting disconnected SSH
sessions. Folder workspaces need no Git metadata for activity filtering.

## Intentional defect

The matcher uses a strict upper-bound comparison. Workspaces exactly at the
maximum age disappear, including a just-visited workspace in a zero-day window.
The boundary unit tests and query integration test deliberately assert inclusive
behavior and fail. No wall-clock reads, network access, or timing tolerance is used.
