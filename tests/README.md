# Regression tests

Run `npm test` or `npm run check` from the repo with Node 22. The check command adds JavaScript syntax validation. No dependencies, API keys or live services are needed.

## Scope

The restoration and performance suite currently has 97 passing cases:

- 12 CSV/count/badge cases: CSV quoting/BOM/newlines/aliases, real upload event, invalid-input preservation, all three sample files, taxonomy rules, distinct union/overlap/score, ledger unknown counts, Matt's exact 233-to-232 exception, deterministic/idempotent milestones, and stale badge records.
- 35 storage/sync/session cases: corrupt cache, local clearing, offline and cloud saves, guarded RPC contract, durable failed uploads, refresh/reload/race protection, confirmed retries and smaller-file replacement, legacy recovery cache, stable pagination, empty-cloud handling, separate badge save, magic-link redirect, token refresh/rotation, cross-tab storage and timeouts.
- 2 public-build cases: every staged source byte is preserved, internal files are absent, and cleanup refuses arbitrary output paths.
- 2 stored-XSS cases through actual remote row conversion, synchronization and member-card rendering.
- 4 assistant browser cases: signed-in bearer contract, text/photo compatibility, one identity retry and quota fallback without replay.
- 18 assistant backend cases covering invalid identities, nonmembers, Auth/quota outages, actual size limits, image containers and alternate representations, successful text/photo controls, model/response compatibility, sanitized upstream failures and deadlines. All providers are stubbed.
- 19 performance regressions: per-render cache correctness/cleanup, bounded date cache, map resize coalescing, viewport and popup preservation, responsive/member/empty-map changes, plugin fallback, unchanged sync DOM/storage/write stability, same-sized metadata updates, concurrent badge sync and photo request reuse/recovery.
- 5 ledger paging regressions: complete ordered coverage with at most 100 mounted rows, search beyond the first page, unknown-count aggregation, page reset/clamping/empty boundaries, and no unrelated panel, storage or cloud mutations. The UI counts ledger entries separately from raw observations.

`helpers/app-harness.cjs` executes the **entire unmodified `app.js`**, including startup and event handlers, inside Node's VM. It provides an in-memory DOM, localStorage, timers and fetch responder. Tests drive the actual upload/clear handlers or invoke actual application functions. A separate context isolates every test. Sample observations are synthetic. All network calls are intercepted; nothing leaves the process.

The DOM substitute does not parse HTML, render CSS, simulate Leaflet or play audio. VM access to top-level lexical state is intentionally a temporary seam so tests can land before modularization. Avoid patching/replacing production functions in tests. When pure modules are extracted, migrate their tests to imports and retain integration coverage for the bootstrap.

The map performance tests add isolated Leaflet/RAF substitutes within their file to count actual app marker/layer/fit calls and control resize events. These preserve production function execution but do not establish real Leaflet paint/frame-rate results. Performance timings in the handoff use real recovered observations privately and no outgoing requests; no private fixtures are committed.

`response()` supplies realistic content-range totals for array results; pagination fixtures can override them. A network-call budget prevents a mistaken mock from creating an endless paginated read. Test timers are manually advanced; elapsed wall-clock session comparisons still use the current test clock.

## Interpreting green tests

The previous unsynced-upload overwrite characterization has been replaced by tests of the corrected durable-queue behavior. One remaining test named `KNOWN LIMITATION` documents old milestone records remaining stored when the list shrinks; fix policy/provenance separately rather than deleting records incidentally.

The Node suite does not establish live database RLS/atomicity, Netlify bundle execution, real browser layout, audio, external-provider availability or email delivery. Separately, `database/tests/restoration.sql` passed live role isolation, stale/empty rejection and normal replacement rolled back with data digest/counts unchanged. `database/tests/assistant-quota.sql` passed admission and rate-limit checks with fixture ledger rows rolled back. Do not run these against a different project without reviewing their assumptions. No assistant call was sent to OpenAI. The build test recreates only the repository's generated `dist` directory.

## Manual acceptance before a future release

Use isolated accounts/data and an identified preview deployment. Check narrow mobile and desktop layouts, sample imports, map filtering/popups, keyboard controls, and audio stop/start. Verify magic-link sign-in, expired-session refresh, datasets above 1,000 rows, failure/retry behavior, and two-browser synchronization. Confirm an anonymous user cannot read shared tables. Test assistant auth/rate limits only once the proposed change exists. Do not upload sample files or clear/replace real team data to perform these checks.
