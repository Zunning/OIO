# OIO V3.0 Foundation Design

## Context

OIO currently works as a local static web app at the repository root:

```text
index.html
styles.css
app.js
```

The current V2 app stores all user data in `localStorage` under `oio.v1`.
It already supports the core learning loop:

```text
source expression intent
-> rewritten English text
-> highlighted chunk
-> cloze card
-> context review
-> review history
```

The V3 split roadmap says V3.0 should happen before V3.1. V3.0 is the
technical foundation and data migration release. V3.1 will add AI API and
Review V3 after the storage and project structure are safer.

## Decision

Build the V3.0 rewrite in a separate folder named `oio-v3/`.

The existing root-level static V2 app stays intact and usable while the new
React/TypeScript app is built. V3.0 must not require deleting, moving, or
rewriting the current `index.html`, `styles.css`, or `app.js`.

## Goals

- Create a maintainable React + TypeScript + Vite app in `oio-v3/`.
- Move persistent data from `localStorage` to IndexedDB using Dexie.
- Preserve the existing V2 learning workflow and user-visible behavior.
- Add explicit backup, export, import, and restore paths.
- Add focused tests for data migration, repositories, import/export, and review scheduling.
- Keep V3.0 stable enough that V3.1 can add AI API and Review V3 without piling more logic into the old `app.js`.

## Non-Goals

V3.0 will not add:

- AI API calls.
- Review V3 stages.
- TTS, listening practice, recording, or pronunciation comparison.
- Input method mode.
- Cloud sync, user accounts, or a backend.
- IELTS-specific behavior.
- A major visual redesign.

## Architecture

### Folder Layout

```text
oio-v3/
  package.json
  index.html
  src/
    app/
    components/
    db/
    features/
    repositories/
    services/
    styles/
    test/
```

The exact file names can evolve during implementation, but the boundaries
should stay clear:

- `db/` owns Dexie schema and IndexedDB setup.
- `repositories/` expose data operations to the UI.
- `services/` own migration, backup, import/export, scheduling, and parsing logic.
- `features/` group UI and behavior by product area.
- `components/` holds shared UI pieces.

### Data Model

V3.0 stores these entities in IndexedDB:

- `texts`
- `sourceIntents`
- `chunks`
- `cards`
- `images`
- `reviews`
- `settings`
- `backups`
- `migrationState`

The schema should preserve the existing V2 fields where possible so old data
can migrate without lossy transformations. New fields may be added only when
they support storage reliability, backup/restore, or compatibility.

### Migration

On first V3.0 launch:

1. Read `localStorage["oio.v1"]`.
2. Validate that it is parseable JSON.
3. Create a pre-migration backup record containing the raw V2 payload.
4. Normalize missing optional arrays and legacy card fields.
5. Write entities to IndexedDB.
6. Record migration completion so the same payload is not imported twice.

If migration fails, V3.0 must preserve the old `localStorage` data and show a
recoverable error. The user should still be able to export the raw V2 payload.

### Backup And Restore

V3.0 provides:

- Full JSON export of all V3 data.
- Full JSON import into V3.
- Automatic backup before import.
- Automatic backup before V2-to-V3 migration.
- Restore from an existing backup record.

Import should replace the current V3 dataset only after the incoming JSON is
validated enough to avoid obvious corruption.

### UI Scope

V3.0 should recreate the existing core screens:

- Home.
- Prompt workflow.
- Text library.
- Text detail.
- Source Intent selection.
- Chunk creation.
- Cloze card creation.
- Cards list.
- Review.
- Daily review history.
- Text export.
- Data backup/import/restore.

The design can reuse the current visual language and CSS decisions. V3.0
should prioritize equivalent workflows over visual reinvention.

### Review Behavior

V3.0 keeps the existing Review V2 behavior:

- Due cards.
- Important-first sorting.
- Session size setting.
- Again / Good / Easy ratings.
- `masteryCount`, `easyStreak`, graduation, and review history.
- Context display that does not reveal the answer before checking.

Review V3 stage progression is intentionally deferred to V3.1.

## Testing

Use Vitest for focused automated tests.

Required test areas:

- V2 localStorage payload migration into V3 entity shapes.
- Migration idempotency.
- Backup creation before migration and before import.
- JSON export/import round trip.
- Review scheduling and graduation behavior.
- Safe handling of malformed import or migration data.

UI end-to-end coverage can stay light in V3.0, but the data layer and services
must be covered because they are the main reason for this release.

## Acceptance Criteria

- The existing V2 app still works from the repository root.
- The new V3 app runs from `oio-v3/`.
- Old V2 data can be migrated into IndexedDB.
- Refreshing the V3 page does not lose data.
- A complete V3 backup can be exported as JSON.
- A complete V3 backup can be imported and restored.
- Existing V2 core workflows are available in V3.
- Tests cover migration, backup/import/export, and review scheduling.
- V3.0 does not include AI API or Review V3 stage behavior.

## Implementation Notes

Because this is a rewrite into a separate folder, implementation should proceed
in narrow vertical slices:

1. Scaffold Vite/React/TypeScript/Vitest/Dexie.
2. Create typed models, Dexie schema, and repositories.
3. Add V2 migration and backup/export/import services with tests.
4. Port the core UI screens incrementally.
5. Wire review behavior and verify scheduling logic.
6. Run automated tests and a local browser smoke test.

The old V2 app should remain the fallback until V3.0 satisfies the acceptance
criteria.
