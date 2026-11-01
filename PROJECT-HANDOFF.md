# RoS Birding Site handoff

## Current restoration: 2026-11-01

Canonical repository remains `C:\Users\12177\Documents\Codex\2026-05-29\what-can-i-do-here-on\work\rain-or-shine-live`. Live URL: https://rosbirding.netlify.app/ . The configured Supabase project is now **ACTIVE_HEALTHY** and contains the existing lists; no source CSV had to be re-created and no sample data was published.

| Member | Saved observations | Species shown by app | Latest saved sighting |
| --- | ---: | ---: | --- |
| Matt | 522 | 232 (233 canonical; existing display exception retained) | 2026-05-24 |
| Alex | 3,311 | 268 | 2026-07-14 |
| Jeff | 332 | 213 | 2026-06-06 |

Recovered totals: 4,165 observations, 335 team species, 156 species shared by all three, six import records, 16 stored badges. The last uploaded lists were saved in July; Jeff's Hawaii upload is still to come. These counts were checked both with database queries and by loading the real recovered data through the application's isolated sync/render harness, with all network calls intercepted.

### Data protection applied live

- Protected server snapshot: `ros_private.recovery_snapshots`, pre-restoration snapshot ID `428ca116-3598-42c6-805e-5f653bdfabd9`; it contains all observations/imports/badges/roster. No browser role can access that schema/table.
- Independent private backup: `C:\Users\12177\Documents\RoS Private Recovery\2026-11-01\pre-restoration.json`; SHA-256 `5d22ea8230cff353cec4b13749c8cde45445e516d8f800e34050579f4f7f5759`. It is outside Git and the publish tree, and its directory ACL is restricted to the current Windows account.
- Migration `ros_recovery_guard_20261101` applied: revoked anonymous/member TRUNCATE and browser roster-write capabilities; installed a roster-checked, revision-checked atomic import RPC with private before-replacement snapshots.
- Migration `ros_assistant_quota_20261101` applied: private atomic assistant admission ledger, rolling six calls/minute, 60/user/day, 180/team/day; no new environment variables. No request contents/photos are stored in the ledger.
- `database/tests/restoration.sql` passed for all three roster identities, nonmember denial, stale/empty import rejection, and normal guarded replacement. The normal replacement test was unconditionally rolled back; records/imports/snapshots were verified unchanged.
- `database/tests/assistant-quota.sql` passed for normal admission, minute/user-day/team-day limits and nonmember/private-ledger denial. Fixture charges were rolled back. No OpenAI request was made in these SQL tests.

### Restoration release status

The prepared frontend retains pending imports across reloads, refreshes other teammates' rows safely, reviews saved uploads explicitly, blocks stale-cloud replacement, confirms smaller incoming lists, preserves displaced legacy caches, fixes the REST magic-link redirect, and escapes remote member names before rendering HTML. The claymation artwork/layout remains intact.

The owner approved reusing the existing Netlify OpenAI configuration. Paired assistant authentication, quota admission, bounded payloads, an 8-second admission deadline plus 20-second provider deadline, and sanitized/no-store errors are implemented under provider-stub tests. The browser sends its refreshed bearer and retries only a pre-provider 401 once. The source default model and text/photo request/reply shape remain intact. **73 regression tests and 18 syntax checks pass.** This includes the exact stored-XSS trigger failing before the member-name escaping fix and passing after, plus successful text/photo controls. No live paid-provider request has been made.

**Source recovery saved:** commit `23651512542ec7e64bb91f515d8721ba311aa3d4` is pushed to `main` and `codex/ros-restoration-20261101`. This includes the earlier uncommitted maintenance documentation/tooling, the new restoration tests and the paired runtime fixes. The original `45a85fc` remains in history.

**Published and verified:** Netlify site ID `674fc0f5-be24-4964-8e5d-3a3235a5e698`, production deployment `6ae75a229276a2e2b5c66952`, state `ready`, commit `2e35782f0a741caf47a04e11ef19ccd9aed3a2eb`, published `2026-11-01T15:26:36.095Z`. Git-connected production branch is `main` in the canonical GitHub repository. Publication was triggered by the verified main-branch push; the owner subsequently completed Netlify CLI authorization. No secret value was printed or changed.

Live `app.js` matches the tested source after newline normalization. Anonymous malformed-JSON assistant POST returns 401 before provider work, and `/database/schema.sql` plus `/PROJECT-HANDOFF.md` return 404. The live config points to the healthy original Supabase project. Production function scopes have the expected Supabase, OpenAI and eBird variable names populated (values suppressed). Nearby sightings returned 175 reports successfully; event scout returned one birding and two other permitted future listings. No live paid OpenAI request was made.

**Upload cutover applied:** migration `ros_upload_cutover_20261101` removed direct observation/import writes and authenticated access to the legacy unguarded RPC. The guarded replacement entry point remains available only to authenticated callers, with an explicit roster check. All three role/normal-replacement tests passed again after cutover. Final observation count is 4,165, imports remain six, and the complete observation digest matches the pre-restoration snapshot exactly.

The scoped security scan completed and retained three original source findings (anonymous assistant spend, broad roster bootstrap and stored member-name XSS), all fixed in the committed restoration source. Fresh fix reviewers found no surviving bypass/regression. The scan does not establish deployed behavior. An attempted connector-based independent-session quota test could not demonstrate actual lock contention, so concurrency remains source-verified by the transaction advisory lock plus sequential live quota tests, not a measured live contention result.

Browser control stopped because the tool could not determine the current browser URL confidently. No alternate automation was used to bypass that stop. Fresh interactive sign-in on the owner's device has been requested as the final user acceptance check. Real email delivery and desktop/mobile rendering remain distinct from the passing database-role and isolated-app tests until confirmed by the owner.

Auth metadata currently shows email enabled, anonymous sign-in disabled, and public signup enabled. The exact three-member roster is intact and nonmembers cannot read team records. Disabling public signup and enabling leaked-password protection remain dashboard configuration work; do not infer that they were changed by the SQL migrations. Private-table no-policy and authenticated-definer advisor notices are intentional boundaries reviewed in source and exercised with live role tests.

## September 29 historical handoff (superseded where noted above)

Inspected and maintained: **2026-09-29**. This document distinguishes current source, live metadata and proposals. No UI redesign, feature addition, runtime refactor, cloud mutation, push or deployment was performed in this pass.

## Canonical location and source state

```text
C:\Users\12177\Documents\Codex\2026-05-29\what-can-i-do-here-on\work\rain-or-shine-live
```

- Remote: `https://github.com/rmphilli/rain-or-shine-birding.git` (public).
- Branch/default branch: `main`.
- Baseline HEAD: `45a85fc358cf9393e0d2f2d14faa2f7d6a72202b`, matched remote `main` by read-only `git ls-remote`.
- Baseline tracked files were clean. Existing `.netlify/` and `artifacts/` were untracked and are now ignored, preserved on disk, and excluded from publishing. They include screenshots, patches and origin snapshots; they are not evidence of current live behavior.
- The empty `Documents\ChatGPT\RoS Birding Site` is not canonical. The adjacent Flock Clubhouse is a separate product and deployment.
- This pass leaves local documentation/tooling changes for review; no new commit was made. The baseline commit does not contain these additions.

## Product and architecture

This is the three-person Rain or Shine Birding Team dashboard, with claymation portraits, a cream/green palette, whimsical nature artwork, and the exact team motto. The implementation is static HTML/CSS and classic JavaScript. `app.js` coordinates data, UI, Auth, network and persistence; `bazaar.js` owns the separate Bazaar page. Leaflet/markercluster load from pinned CDN URLs. Browser requests go directly to Supabase Auth/PostgREST; four Netlify CommonJS functions provide configuration, ChatGPT, nearby eBird sightings, and curated event reachability checks.

Implemented features: CSV import/replacement, local cache, shared team records, magic links and refresh tokens, personal/team counts, overlap/target tables, observation search/aggregation, clustered expedition map, estimated trail miles, birder profiles, milestone trophies, photo/text assistant and fallback, nearby sightings, three adventure categories, ambient audio, and Bazaar preferences.

The observation replacement RPC atomically inserts an import record and replaces **one member's observations**. Badge upserts happen separately during rendering. Publishing multiple members runs successive RPCs. There is no team-wide import transaction or unsynced-write queue.

## Deployment and Supabase findings

| Item | Evidence / current limit |
| --- | --- |
| Git source | Local and remote `main` matched `45a85fc`; no push made |
| Netlify source configuration | Now `npm run build`, publish `dist`, Node 22, function source `netlify/functions` |
| Historical publish directory | Generated `.netlify/netlify.toml` points at the canonical repository root; this is historical local metadata |
| Historical function bundles | `.netlify/functions/manifest.json` lists all four handlers, runtime API v1 and `nodejs22.x`; not a current deployment receipt |
| Production site/domain/deploy ID | Not discovered. No `.netlify/state.json`; inspected GitHub homepage/status/deployment metadata yielded no production URL, and local Netlify config has no authenticated account |
| Runtime environment | Source expects five app variables listed in README; live values/presence were not inspected |
| Supabase metadata | Connected project `Rain or Shine Birding Team`, ref `wvzjpyrxjcclumeuetfo`, `us-west-2`, Postgres 17, status **INACTIVE** |
| Database configuration | Four RLS-enabled tables and an invoker replacement RPC exist in source. Actual deployed tables/policies, roster, redirects, signup setting and backups were not queried/verified |
| Project/deployment association | Matching Supabase project name is strong context, but Netlify's configured `SUPABASE_URL` was not available to confirm the association |

Do not report production as healthy based on local tests or old bundle files. Recovering the inactive service and establishing the deployment identity are operational work to do deliberately, not incidental changes to this maintenance pass.

## Known issues and boundaries

1. **Unsynced data can be lost from the browser cache.** `saveImport` persists locally on failure, but a later successful nonempty `performRemoteSync` replaces the whole cache. There is no durable pending queue or conflict check. Preserve CSVs/private backups before reconnecting. The suite reproduces this limitation.
2. **Assistant access is unprotected at the application layer.** The client sends no bearer token and the function checks neither identity nor membership. No app rate limiter, request-byte/image policy, output-token cap or upstream timeout is defined. Hosting-level restrictions were not verified. Recommendations below are not implemented fixes.
3. **Badge and observation saves are separate.** Rendering triggers an unawaited badge upsert; its failure does not roll back an import. Shrinking a list leaves old badge records in storage (hidden when not earned). Multi-member publish can partially succeed.
4. **Count exception needs provenance.** Matt displays 232 only when his canonical count is exactly 233. Source rows and canonical species count remain intact. Taxonomy aliases/exclusions are hand-maintained. Do not remove this exception without reconciling the source list.
5. **Schema bootstrap has broad roster seeding.** It inserts all existing Auth users into `team_members`, not an exact trio allowlist. RLS protects against nonmembers, but every member can update every teammate's data. Applying the schema is not a harmless read-only operation.
6. **Privacy is not a whole-site gate.** The source/site shell/catalog are public. The standalone Bazaar performs an access check, while dashboard catalog data is static. Sign-out leaves cached bird data on the device. Session tokens are stored in localStorage, increasing the consequence of any script injection.
7. **Content freshness is limited.** Bazaar prices are stamped July 28, 2026. `RSB_BAZAAR_USES_MOCK_DATA` remains true but the current UI uses the static sale catalog. Events are hard-coded; source checks regard responses below 500 as reachable, not semantic validation. Saved fallback events lack expiry filtering. Nearby UI copy says a teammate already has the bird, but code can include species new to all three.
8. **Input edge cases remain.** CSV parser accepts unmatched quotes and passes invalid dates through; cloud type validation may then reject an import. Species grouping may not unify records missing scientific names with those that contain them. These are follow-up decisions, not silently corrected here.
9. **Coverage has limits.** The small DOM substitute verifies data/event behavior, not rendering. Existing screenshots predate current source in places. Live Auth/RLS, browser, Netlify bundles and paid APIs were not exercised.

## Minimal assistant security recommendation (not implemented)

We can keep the current assistant route and response shape. The smallest coherent change is paired browser/server authentication, server-side quotas, and bounded requests. Source reviewed: `getAssistantReply` in `app.js`, `netlify/functions/chatgpt.js`, Bazaar's `verifyTeamAccess`, and `database/schema.sql`.

- **Authenticate and authorize before OpenAI.** The browser first refreshes its session and sends `Authorization: Bearer <access token>`. The function validates it with the configured Supabase Auth service (`/auth/v1/user`), then checks `team_members.user_id` using the verified user's ID and the same bearer token. Do not trust client context, email, local JWT decoding, or user-editable metadata. Return 401 for missing/invalid identity, 403 for nonmembers, and 503 for unavailable auth/membership services; never fall through to a paid request. Keep credentials out of logs. This follows [Supabase's server-validated user guidance](https://supabase.com/docs/reference/javascript/auth-getuser).
- **Limit use across instances.** Prefer a narrowly scoped atomic Supabase quota RPC for the authenticated user (proposed starting thresholds: 6/minute and 60/day; tune with the trio). Bind the subject to `auth.uid()`, check roster membership, deny direct counter changes, and atomically check/increment both windows. If a narrowly privileged definer function is needed for private counters, lock its search path and revoke public execution; review that migration separately. Do not use a process-local Map as the real limiter. Fail closed on quota-service errors and return 429 with Retry-After on exhaustion. Fixed windows allow boundary bursts; a daily allowance bounds aggregate use but not a precise dollar amount.
- **Add edge throttling as defense in depth.** Netlify supports code-defined per-IP/domain limits; verify compatibility with this v1 CommonJS handler and enforcement of both configured and default function routes in a preview. Do not assume a rule applies because deployment succeeds. Its enforcement can lag, so it is not an exact spend cap. [Netlify rate-limit documentation](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/).
- **Bound and validate payloads.** Keep text up to 4,000 characters, allow one strictly decoded JPEG/PNG/WebP data image with verified signature, and reject arbitrary remote image URLs. Proposed limits: 2 MiB decoded image and 3 MiB total JSON bytes, checked before expensive parsing/provider work and below verified platform limits. Handle the event's base64 flag, malformed/null/nonobject payloads, MIME spoofing and empty content. Add a 20-second upstream abort and a proposed 800-token output cap while preserving the configured model. Limits need photo-quality testing before release. Return stable sanitized errors and `Cache-Control: no-store`; log only request ID, status, latency and usage metrics. [OpenAI input/output constraints guidance](https://developers.openai.com/api/docs/guides/safety-best-practices).
- **Preserve normal use.** Keep text-only and photo requests, `{reply}`, configured model, fallback explanations and a single refresh/retry for 401. Do not automatically retry timeouts/429s because a provider request may already have consumed budget. If the Supabase project is inactive, explain sign-in/service unavailability and retain local helper mode. Origin checks may supplement this boundary, but cannot replace authentication.

Acceptance must demonstrate zero provider calls for missing/forged/expired tokens, nonmembers, quota excess, malformed/oversize images and auth/quota outages; correct behavior across independent concurrent instances; normal text/photo success; and unchanged fallback. Use mocked provider tests first and an isolated preview next. Keep the endpoint disabled or protected during a security rollback rather than restoring anonymous paid access. This recommendation adds no new user-facing feature or separate gateway service.

## Recent decisions and history

- July 22: shared-team data work (`603e9e1`).
- July 28: map redesign (`17f9f7e`), Bazaar preview/mobile rail and sale catalog (`c7f96e1`, `e597920`, `4b1a722`).
- July 29: ambience/media/event filters (`95b49e5`) and vetted event refresh (`45a85fc`).
- September 29 maintenance: canonical location confirmed by owner; preserve static architecture, exact branding, cloud contracts and model default; add tests before refactoring; use a public-file-only build instead of publishing internal recovery files; document security remediation before implementing it.

## Verification from this pass

36 regression tests passed on Node 22.23.1. Syntax checks passed for 15 JavaScript files. Public build stages 25 files, compared byte-for-byte with source, and excludes internal files. An HTTP smoke check confirmed that the loopback preview serves both pages, hides internal files, rejects traversal and POST, and does not proxy cloud functions; its process was stopped afterward. This was not a rendered-browser check. Local documentation links and `git diff --check` passed. Existing application JS, HTML, CSS, SQL and function sources are unchanged. `SETUP.md` now describes the actual transaction/privacy boundaries. No external data writes or deployments occurred.

See [tests/README.md](tests/README.md) for tested cases and limits, and [docs/MODULARIZATION.md](docs/MODULARIZATION.md) for an incremental extraction plan. The plan begins with pure CSV/taxonomy functions, then domain calculations, storage/session adapters, sync orchestration and UI panels. No module extraction was performed.

## Top five next steps

1. Identify the real Netlify site/deploy and verify the inactive Supabase project's role, backup state and recovery options; record a live baseline before publishing.
2. Protect unsynced imports with durable pending-write/conflict handling, plus explicit recovery tests, before relying on automatic reconnect.
3. Implement and preview-test the paired assistant auth/quota/payload change above; it remains exposed in current source.
4. Reconcile Matt's taxonomy/count exception, stale badge records, and data-versus-display expectations against the original CSVs without deleting evidence.
5. Begin one pure-module extraction under tests, then add real mobile/desktop and two-browser acceptance coverage. Refresh deals/events separately with dated evidence.
