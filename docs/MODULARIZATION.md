# Gradual modularization plan

Source audited: `app.js`, 2,921 lines at baseline `45a85fc358cf9393e0d2f2d14faa2f7d6a72202b`. Line ranges below are navigation aids for that revision; use function names after edits. This is a proposal, not a performed rewrite.

## Current responsibilities and coupling

| Baseline area | Main responsibilities | Coupling / risk |
| --- | --- | --- |
| 1-340 | Constants, member/taxonomy rules, curated events, mutable state, DOM references, upload handlers, startup | Initialization starts async configuration and renders immediately; extraction order matters |
| 342-465 | Dashboard Bazaar | Shared catalog plus duplicated preference/render/auth concepts with `bazaar.js` |
| 466-566 | CSV parsing and normalization | Mostly pure, but depends on aliases/member naming and date handling |
| 567-782 | Rendering orchestration, species grouping, scores, member metrics, trip/mileage estimates | Global observations; display override must not alter canonical identity |
| 783-977 | Nearby targets, photo loading, event cards and topic filtering | DOM, remote services, taxonomy and curated fallback intertwined |
| 978-1206 | Audio synthesis and adventure loading | Timer/context lifecycle and network fallback; preserve user-gesture start |
| 1207-1478 | Birder profiles and trophy case | Trophy rendering mutates/persists badges and starts cloud writes |
| 1479-1988 | Chat UI, Auth UI, publish, auto-sync, session refresh, assistant request/fallback | Shared in-flight promises, timers, localStorage and cross-tab behavior |
| 1989-2132 | Species milestones, identities, dates | Deterministic domain rules but writes global badge store |
| 2133-2278 | Species/target/ledger views and aggregation | UI and pure grouping logic mixed |
| 2279-2502 | Import save, badge sync, REST pagination/RPC, auth fetch, remote adapters | Network/storage/UI state all coupled |
| 2503-2851 | Map rendering, marker/cluster helpers, popups, aggregation | Leaflet global, CSS classes, map lifecycle and resize handling |
| 2852-end | Persistence, timeout wrapper, formatting and escaping | Browser globals and shared keys |

The critical side effect is `renderProfileTrophyCase()` calling `saveMilestoneBadgeStore()` and `syncMilestoneBadges()`. `performRemoteSync()` calls `render()`, so a read can also initiate badge writes. Moving render functions without preserving or deliberately changing this orchestration is risky. Import mutates the local collection before an RPC; a later cloud read can replace unsynced data. Resolve that with explicit pending-import semantics in its own behavioral change, not as part of code movement.

## Extraction sequence

1. **Keep the regression baseline.** Preserve the original classic-script page, DOM IDs, storage keys, network routes, and cloud payloads. Test sample imports and fixture failures first. Record any new bug separately from a refactor.
2. **Extract pure CSV and taxonomy functions.** Proposed `js/domain/csv.js` and `js/domain/species.js` accept explicit inputs and return values. Keep aliases, exclusions, member normalization, and the Matt display exception as named policies. Domain output must remain identical for existing fixtures. Do not change date parsing or IDs in this step.
3. **Extract counts, ledger, badges and travel calculations.** Proposed `js/domain/counts.js`, `badges.js`, `ledger.js`, `travel.js`. Badge calculation should eventually return a new store/result, with persistence handled by the caller; first retain the existing call order. Add tests for travel grouping before moving travel code.
4. **Introduce adapters around storage and network.** Proposed `js/adapters/browser-store.js`, `supabase.js`, `session.js`. Keep timeout cleanup, pagination, token rotation and one-retry behavior. Pass storage/fetch/clock dependencies explicitly. Do not mix this with replacing REST calls with an SDK or changing Auth flows.
5. **Create one sync coordinator.** Proposed `js/application/sync.js` owns pending writes, `remoteSyncPromise`, polling/focus rules, cache replacement and status messages. Introduce a minimal explicit state object rather than scattering copies of global state. Any changed conflict behavior gets a separate tested change and documented migration.
6. **Move UI by panel.** Proposed `js/ui/map.js`, `assistant.js`, `badges.js`, `tables.js`, `adventures.js`, `ambience.js`, then an `app.js` bootstrap. Preserve markup/classes, render order and map lifecycle. Consolidate Bazaar session handling only after its auth/preview flows have tests.

Start with separate classic scripts in a single explicit `window.RSB` namespace loaded before `app.js`. This keeps existing file/static behavior and avoids a simultaneous module-loader/bundler migration. Pure modules can use a small CommonJS export for direct Node testing, with browser attachment only when `window` exists. Do not convert the entire repo to `"type":"module"`: the Netlify handlers use CommonJS `exports.handler`.

As each module moves, add it to the public build list, change one consumer at a time, and retire the corresponding VM harness access only when direct module tests cover the same behavior. Keep end-to-end upload/sync event tests. The current harness is a temporary test seam, not a new production architecture.

## Acceptance and rollback per extraction

- Checks pass; fixture outputs, network call counts/payloads and storage keys stay stable.
- No new dependencies or schema/auth changes hidden inside the move.
- Public build includes every new script, and only intended public files.
- Desktop/mobile panel checks show unchanged layout and behavior. The Node DOM substitute cannot establish this.
- One bounded commit per extraction allows a code revert without a data migration. Preserve and compare generated public assets before approving deployment.

Do not start with framework adoption, a TypeScript conversion, replacing the map stack, or a full state-management library. Reconsider those only if concrete maintenance constraints justify them after the boundaries above are established.
