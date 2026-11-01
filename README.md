# Rain or Shine Birding Team

A private shared birding dashboard for Jeff, Alex, and Matt. Import eBird-style CSV life lists, compare birds, map outings, collect milestone badges, and plan the next team adventure.

The identity is deliberately whimsical: claymation birders, rain-fresh landscapes, birds, Bigfoot/UFO details, and the motto **"Blessed are the whimsical, for they shall see birds."** Preserve it.

## Canonical repository

```text
C:\Users\12177\Documents\Codex\2026-05-29\what-can-i-do-here-on\work\rain-or-shine-live
```

Remote: [rmphilli/rain-or-shine-birding](https://github.com/rmphilli/rain-or-shine-birding). Main branch: `main`.

The similarly named empty folder under `Documents\ChatGPT` is not this checkout. The adjacent `flock-clubhouse` is an independent product; do not mix its React code, infrastructure, or deployment with this site.

Start with [PROJECT-HANDOFF.md](PROJECT-HANDOFF.md) for dated findings, [AGENTS.md](AGENTS.md) for change constraints, and [SETUP.md](SETUP.md) for cloud setup. The source repository is public; the intended privacy boundary is authenticated team data, not secret HTML or JavaScript.

## What works in the code

- Per-member CSV replacement imports and local browser persistence.
- Combined species list, sum of personal life-list counts, all-three overlap, target species, and searchable observation ledger.
- Leaflet expedition map, clustered and member-specific markers, map filtering, and estimated mileage from Morton, Illinois.
- First-bird and every-50-species badges, trophy cases, and birder profiles.
- Supabase magic links, shared data, pagination beyond 1,000 rows, token refresh, and periodic/focus refresh.
- Photo/text assistant through a Netlify function; honest local helper fallback.
- Recent eBird sightings near Morton and curated birding/Bigfoot/alien-and-psi event links.
- Optional synthesized rain and bird sounds; Bazaar browsing and local Watch/Want/Maybe/Pass choices.

Live site: [rosbirding.netlify.app](https://rosbirding.netlify.app/). On 2026-11-01 its configured Supabase project was verified **ACTIVE_HEALTHY**, with all three lists intact: 4,165 observations, six import records and 16 saved badges. See the handoff for the restoration results, the distinction between deployed and prepared fixes, and any remaining publication/access blockers.

## Architecture

| Area | Files / responsibility |
| --- | --- |
| Dashboard | `index.html`, `styles.css`, `app.js`: classic browser scripts, DOM rendering, data and session orchestration |
| Bazaar | `bazaar.html`, `bazaar.css`, `bazaar.js`, `bazaar-config.js`, `bazaar-catalog.js` |
| Data | Browser localStorage plus direct Supabase Auth/PostgREST requests; no browser Supabase SDK dependency |
| Database | `database/schema.sql`: imports, observations, milestone badges, team roster, RLS, replacement RPC |
| Backend | Four CommonJS handlers under `netlify/functions/` |
| Maps | Pinned Leaflet/markercluster CDN scripts; CARTO tiles with OpenStreetMap attribution |
| Public assets | `assets/`, `samples/`, root `team-birding-scene.jpg` |
| Tooling | Dependency-free Node scripts and `node:test`; no bundler or UI framework |

The restoration frontend persists each upload independently before network work, then reads the latest cloud state and calls `replace_member_observations_guarded` with the member's expected import revision. That database RPC validates membership/input, locks the member's import, rejects stale revisions, snapshots the old list privately, and atomically records/replaces that member's observations. Failed uploads remain in a durable local queue and overlay only the affected member; an explicit review is required for retry. Trophy rendering computes badges and launches a **separate** upsert; pending members' badges are not pushed. Publishing several members remains a sequence of transactions, not one team-wide transaction.

Browser storage keys include `rainOrShineBirdingData`, `rainOrShineMilestoneBadges`, `rainOrShinePendingImports`, `rainOrShineBirdingRecoveryData`, `rainOrShineSupabaseSession`, and `rainOrShineBazaarPreferences`. Pending uploads and displaced old browser caches are retained separately from the display cache. Session values are credentials. Do not put them in screenshots, logs, commits, or shared recovery files.

## Local run and checks

Use Node 22 (verified with 22.23.1) and npm. There are no package dependencies to install.

```powershell
Set-Location 'C:\Users\12177\Documents\Codex\2026-05-29\what-can-i-do-here-on\work\rain-or-shine-live'
npm run check
npm start
```

Open `http://127.0.0.1:4173`; stop with Ctrl+C. `npm start` builds and serves only `dist` on loopback. It does not serve Netlify functions, load environment files, or proxy cloud requests. Missing functions produce local/helper fallback messages. Leaflet and tile/photo services still require Internet access. For an isolated Bazaar preview, use `/bazaar.html?preview=1` on localhost only.

Use a separate browser profile and the checked-in `samples/sample-birder-*.csv`. Do not load sample CSVs while connected to the production database: an upload replaces a member's list. The three samples contain 12 observations, 7 team species, a life-list score of 12, and one species shared by all three.

| Command | Effect |
| --- | --- |
| `npm test` | Run isolated regression tests; publish tests recreate `dist` |
| `npm run check` | Syntax-check scripts and run all tests |
| `npm run build` | Recreate `dist` using an explicit list of public files; preserve source bytes |
| `npm start` | Build and start the loopback static preview |

Tests run the complete unmodified `app.js` in a Node VM with an in-memory DOM/storage and stubbed network. They never call production or use credentials. They do not verify layout, Leaflet, real Supabase transactions/RLS, live sign-in, provider responses, or Netlify deployment. See [tests/README.md](tests/README.md).

For a full function preview, use Netlify Dev only after linking a confirmed development site and verifying its environment and Auth redirect URLs. Netlify CLI is not a project dependency; consult its installed version's help. Do not accidentally inherit production credentials. Static preview is the safe default.

## Netlify deployment

Checked-in `netlify.toml` now specifies:

- Build command: `npm run build`.
- Publish directory: `dist`.
- Build Node version: `22`.
- Function source: `netlify/functions` (bundled separately from public files).
- Existing frame, content-type, and referrer headers remain intact.

The old generated `.netlify/netlify.toml` points at the repository root and is historical output, not the current source of truth. The new build avoids publishing documentation, tests, SQL, patches, `.env` files, and tooling. Never deploy the entire checkout or an old recovery ZIP. New public top-level files must be explicitly added to `scripts/build.cjs`; files under `assets/` and `samples/` are public, so never put private uploads there.

Before a deployment, identify the actual Netlify site ID, domain, linked repository, base directory, production branch, environment contexts, and last good deploy. Confirm the build configuration resolves to this repository and `dist`. Record a rollback deploy ID, run checks, and inspect a deploy preview. A push to a connected production branch may trigger a deployment; verify that relationship before pushing. This maintenance pass did not push or deploy.

The public publish directory and function bundles must come from the same revision. Validate `/`, `/bazaar.html`, assets, and all four function routes in preview, then verify two-browser shared-data behavior using dedicated test accounts/data. Do not test destructive imports against the real trio.

## Supabase dependencies

The app expects four public tables: `team_members`, `imports`, `observations`, and `user_milestone_badges`, plus the `replace_member_observations_guarded(text,text,jsonb,uuid)` RPC. Auth users sign in using email magic links with `create_user: false` and a REST `redirect_to` query pointing back to the site. New restoration SQL lives in `database/migrations`; read each migration's cutover conditions before applying it.

RLS protects the shared tables. The restoration migration also removes browser TRUNCATE and roster-write privileges and restricts private recovery snapshots. After frontend deployment, `20261101_upload_cutover.sql` removes direct observation/import writes and disables the old unguarded RPC. Roster members retain cooperative team access through the guarded entry point. The old broad Auth-to-roster seed has been removed from source. Provision only verified trio accounts. The live Auth settings still allowed signup on 2026-11-01; signups do not grant roster membership, but disabling signup in the dashboard remains recommended.

The source schema is a bootstrap/upgrade script, not migration history or a database backup. Do not rerun it blindly on production. Back up records and review grants, policy replacement, and roster seeding first. See [SETUP.md](SETUP.md).

## Functions and environment variables

| Endpoint | Dependency / behavior |
| --- | --- |
| `/.netlify/functions/config` | Returns only `SUPABASE_URL` and browser-safe `SUPABASE_ANON_KEY`; no-store |
| `/.netlify/functions/chatgpt` | POST message/photo to OpenAI Responses after verified Auth, roster membership and shared quota admission; returns `{reply}` or sanitized error; no-store |
| `/.netlify/functions/nearby-targets` | eBird recent hotspot sightings within 48 km of Morton, last 30 days; success cached 15 minutes |
| `/.netlify/functions/tour-scout` | Filters predefined events by expiry/topic, checks source reachability, returns up to seven/category; cached 30 minutes |

| Variable | Needed for | Exposure |
| --- | --- | --- |
| `SUPABASE_URL` | Shared data and sign-in | Public project URL, not `/rest/v1/` |
| `SUPABASE_ANON_KEY` | Shared data and sign-in | Browser-safe anon key; security relies on RLS |
| `OPENAI_API_KEY` | Live assistant | Secret; function environment only |
| `OPENAI_MODEL` | Optional assistant model | Existing default is `gpt-5.4-mini`; do not silently change it |
| `EBIRD_API_KEY` | Nearby sightings | Secret; function environment only |
| `NODE_VERSION` | Netlify build | Pinned to 22 in config |

Manage secrets through the existing Netlify site's environment settings with the appropriate function/context scope. Never paste secrets into client scripts or commit env files. There is no need for a browser service-role key. The owner selected reuse of the existing Netlify OpenAI configuration; no replacement key was created or rotated. Valid live provider access remains distinct from mocked-provider tests.

The restoration assistant requires a fresh bearer token. It validates the user with Supabase Auth and checks the verified user ID against the roster, then calls the atomic `consume_assistant_quota()` RPC. Limits are six calls/minute, 60/user/day and 180/team/day (UTC); failed admitted provider attempts count. Requests allow at most 4,000 text characters, one verified JPEG/PNG/WebP image up to 2 MiB, and 3 MiB total JSON. Auth admission has an 8-second deadline and provider work a 20-second deadline, with an 800-token output cap. Identity failures can refresh/retry once; quota/provider/timeouts are not replayed. The local helper remains available when the live service cannot answer. These guarantees apply to the restoration handler; check the deployment receipt before assuming an older deployed function has them.

## Recovery runbook

1. **Preserve evidence first.** Record `git status --short --branch`, HEAD, and deployed revision if known. Copy original CSVs, authorized database backups, and local `artifacts/` to a private location outside the publish directory. `.gitignore` does not back anything up. Avoid `git clean -fdx`, forced resets, and clearing browser storage.
2. **Recover source.** This canonical checkout is preferred. If lost, clone the remote into a new empty directory. `45a85fc358cf9393e0d2f2d14faa2f7d6a72202b` is the pre-maintenance source baseline, not proof of a working production deployment. Choose a verified revision and run checks; new uncommitted docs/tests are recoverable only after being committed or separately backed up.
3. **Recover data independently.** Git contains neither production observations nor localStorage. Preserve the original browser profile and original CSVs before sign-in or reload. The restoration code retains pending uploads and a displaced legacy recovery cache; old deployed versions lack that protection until updated. If exporting browser data, copy observation/badge/pending/recovery keys privately; never export the session key. Record the browser origin because storage is origin-specific. A verified private export of the 2026-11-01 database state is stored outside this checkout at `C:\Users\12177\Documents\RoS Private Recovery\2026-11-01\pre-restoration.json`; do not publish it.
4. **Verify services.** Confirm the actual Netlify deploy and configured Supabase project; check availability, Auth redirects, signup settings, table grants, roster and policies. The configured project was healthy on 2026-11-01. A UI rollback does not restore a database or service availability.
5. **Restore deliberately.** Compare cloud lists with backups before any import. "Publish this browser's data" replaces each included member's cloud list and can partially succeed across members. Restore one verified member at a time, then check from another browser. Schema alone cannot restore lost data.
6. **Roll back site code separately.** Use a previously verified Netlify deploy with matching function bundles. Retain current source changes on a branch or private backup. Keep database recovery separate and never apply destructive SQL as part of a frontend rollback.

## Development priorities

Finish publication and interactive sign-in acceptance for the restoration, then reconcile taxonomy/count exceptions and extract small modules under tests. [docs/MODULARIZATION.md](docs/MODULARIZATION.md) proposes the sequence; no runtime modularization has been performed.
