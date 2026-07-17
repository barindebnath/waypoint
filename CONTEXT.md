# Waypoint

A personal status tracker that acts as external memory for a developer's own units of work — where each piece of work stands in a fixed milestone flow, plus a weekly timesheet attestation. It stores references to external cards, never their contents.

## Language

### Work

**Ticket Row**:
One unit of work, shown as a single left-to-right progress bar through its pipeline's milestones.
_Avoid_: ticket, issue, task (overloaded), card (reserved for external cards)

**Origin**:
Where a ticket row came from — `Support` or `Product`. Determines the row's pipeline.
_Avoid_: type

**Sub-type**:
The `Bug` / `Task` label carried by a Support row, used for filtering and analytics.

**Pipeline**:
The fixed, ordered sequence of milestones a ticket row moves through. Three exist: Support (full), Support-light, and Feature.

**Support-light**:
The pipeline for support work resolved directly (e.g. a DB query) with no branch/PR/deploy — Triage & Setup → Resolution → Close-out. Default for Support rows with sub-type Task; overridable at creation.

**Promotion**:
Converting a recurring light Task into an L2 self-serve support endpoint. Modeled as a **new row** on the full support pipeline; the light row stays as the record of the interim work.
_Avoid_: pipeline switch, upgrade

**Milestone**:
A checkpoint within a pipeline. Complete when all its sub-tasks are checked; completion auto-advances the bar.
_Avoid_: stage, phase, primary task

**Sub-task**:
A mandatory checklist item within a milestone.
_Avoid_: subtask item, checklist entry

**External card reference**:
A pointer (e.g. `ZT-4821`, `PES-1032`, `panipuri#4821`) to a card or PR living in an external tool. Waypoint stores the reference only, never the card's contents. A row can carry any number of them.
_Avoid_: integration

**Identity card**:
The one mandatory, per-user-unique card ref that names a row — the ZT card for Support rows, the OFF/PES card for Product rows. Rows have no title.
_Avoid_: primary ref, title

**Secondary pill**:
Any additional card/PR ref on a row (the dupe PES/OFF card, PRs, a pivot back-reference). Optional; may repeat across rows.

**Link template**:
A per-user URL pattern (Jira base URL, GitHub org) that turns a bare reference into a clickable link. Optional; an explicit URL on a ref overrides it.

**Support card**:
The `ZT-xxx` card raised by support. A Support row links it alongside the cloned project card.

**Project card**:
The team's own Jira card (`PES-xxx` / `OFF-xxx`) where the work is tracked externally.

### Lifecycle

**Regression**:
The bar moving backwards — triggered by unchecking a milestone, which clears all sub-tasks and completion of that milestone and every milestone after it. The target milestone is the user's choice; a rejected fix typically regresses to Development.

**Loose end**:
An unchecked sub-task on a row whose final milestone is complete. A row with loose ends stays visible even when completed rows are hidden.

**Pivot**:
A Support row turning out to be a feature: the support row is closed out and a fresh Feature row starts, sharing an external ref for traceability. A row never changes pipeline or origin after creation.

**Last-touch**:
The history model: each entry keeps `created_at` and only its most recent `updated_at` — no full audit trail.

### Timesheet

**Timesheet Row**:
A weekly self-attestation that time and cards were logged in Tempo. It records that logging happened, not the time itself.

**Submit marker**:
The weekly submit record, unlocked only once all five weekdays are checked; rendered between Friday and the following Monday.
