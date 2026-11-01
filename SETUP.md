# Rain or Shine Birding Team Setup

## Restoration status (2026-11-01)

The existing configured project is healthy and still contains all 4,165 observations for Matt, Alex and Jeff. Do not reinitialize it. See the latest section of `PROJECT-HANDOFF.md` for verified recovery counts, private backups, applied migration names, live versus prepared changes and the publication receipt.

Restoration frontend uploads use `replace_member_observations_guarded` with the expected member import ID. Failed uploads persist in `rainOrShinePendingImports`; refresh merges the cloud collection with those pending rows rather than overwriting them. `Review saved uploads` shows old/new row counts before an explicit retry. A fresh file with fewer rows than the current cloud list requires confirmation. Jeff should normally upload a complete updated eBird export including Hawaii, rather than a Hawaii-only list that replaces his earlier history.

`database/migrations/20261101_recovery_guard.sql` and `20261101_assistant_quota.sql` were applied to the existing project. Apply `20261101_upload_cutover.sql` only after the matching guarded frontend is published and checked. It revokes direct observation/import writes and the old RPC; the new definer RPC explicitly authenticates membership and preserves an old-list snapshot before each replacement. These migration files contain no private uploads or credentials.

The old schema's broad Auth-user roster seed has been removed from source. Provision only verified members. Database policies do not depend on public signup being disabled, but disabling it remains recommended and was not changed through SQL.

## Earlier setup notes (historical caveats below)

## 1. Supabase

For this existing site, first identify and inspect the existing Supabase project. Do not create a replacement project merely because connectivity fails. See `PROJECT-HANDOFF.md` for the last observed service state and `README.md` for recovery steps.

For a new isolated setup, review and apply `database/schema.sql`. On an existing database, back up data and inspect current users, policies, grants, and the replacement function before applying it. Although the script uses repeatable table/index definitions, it drops/recreates policies and inserts **all existing Auth users** into the roster. It is not a read-only check, migration history, or backup. Verify the intended three users explicitly.

Then in Authentication settings:

- Enable email magic links.
- Add your Netlify URL to allowed redirect URLs.
- Invite or create only the three intended team accounts. Confirm their Auth user IDs, then ensure the roster contains exactly those approved users. If users were created after the schema was applied, provision their roster entries deliberately; a magic-link account alone does not grant team-data access.
- Keep public sign-ups disabled for a private three-person app. The app requests magic links only for existing Supabase users.

## 2. Netlify environment variables

In Netlify, add these variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` optional, defaults to `gpt-5.4-mini`
- `EBIRD_API_KEY` for recent nearby target sightings

Store secrets only in the confirmed Netlify site's function environment, with deliberate production/preview scopes. Never expose a Supabase service-role key. Run checks and review a preview before deploying environment or source changes. This maintenance pass did not change cloud configuration or deploy.

The checked-in Netlify config now builds with `npm run build`, publishes `dist`, and bundles `netlify/functions` separately. Do not publish the repository root or use the old generated `.netlify/netlify.toml` as current configuration. See `README.md` for local commands and deployment verification.

Use the project URL for `SUPABASE_URL`, such as:

`https://your-project-ref.supabase.co`

Do not use the longer `/rest/v1/` URL there. The app now trims that if it happens, but the clean project URL is best.

## 3. What this version does

- Works locally with browser storage if Supabase is not configured.
- Uses Supabase shared data after sign-in.
- Saves an import record and replaces one member's observations atomically through `replace_member_observations`. If that RPC fails, its database changes roll back together.
- Computes/persists badges separately during rendering and sends a separate cloud upsert. Badge failures do not roll back observation saves. Publishing several members is a sequence of independent transactions and may partially succeed.
- Loads every page of shared observations, including teams with more than 1,000 eBird rows.
- Refreshes expired sign-ins automatically and reloads shared data when a teammate returns to the page.
- Adds a refresh button to reload the shared Supabase data immediately.
- Adds a publish button to move this browser's locally saved uploads into Supabase after sign-in.
- Shows three curated event lists for birding, Bigfoot, and extraterrestrial or psi events subject to topic filters. The server filters expiry and checks link reachability; it does not discover new events or verify page contents. Offline fallback links can be stale.
- Uses the eBird API to find recent hotspot sightings within about 30 miles of Morton. The UI can include birds missing from all three lists as well as birds already seen by a teammate.
- Estimates the team's combined trail mileage from dated, mapped observations while grouping nearby stops into trips.
- Uses a Netlify function for ChatGPT, keeping the OpenAI key out of browser code. The current function does not enforce application-level authentication or rate limits; see the handoff for the paired client/server remediation proposal.

The `Clear this device` button clears the local bird collection, not the shared database or stored sign-in. Shared data can load again while signed in. Sign-out removes the session but currently leaves cached bird data; use a private device/profile. Failed uploads are saved locally, but there is no pending-write queue: a later nonempty cloud refresh can overwrite that local copy. Keep the original CSVs and private backups.

## 4. First shared-data migration

Before sign-in/reload, preserve original CSVs and the local observation/badge cache privately; never copy the session token into a recovery document. Compare the saved lists with current cloud data. Only if the browser has the intended authoritative lists, sign in and select `Publish this browser's data`, reading its replacement confirmation. It replaces each included member's cloud list and is not an additive merge or an all-team transaction. Sign in from another browser and select `Refresh shared data` to verify. Ordinary uploads attempt a cloud save while signed in; failures remain local subject to the overwrite risk above.

## 5. Current privacy model

The checked-in RLS permits any user listed in `team_members` to read or write shared birding records. It does not enforce exactly three members or per-member edit ownership. Anonymous users have no table access under this schema. Keep public signups disabled, audit the roster, and verify the deployed policies rather than assuming they match this file. The site shell/source/static catalog are public; the assistant currently has a separate access-control gap.
