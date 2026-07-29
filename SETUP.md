# Rain or Shine Birding Team Setup

## 1. Supabase

Create a Supabase project, open the SQL editor, and run `database/schema.sql`.

The SQL is safe to run again when upgrading the app. It preserves bird data, refreshes the team access policies, adds the indexes used by the dashboard, and installs the atomic list-replacement function.

Then in Authentication settings:

- Enable email magic links.
- Add your Netlify URL to allowed redirect URLs.
- Invite or create the three team emails.
- Keep public sign-ups disabled for a private three-person app. The app requests magic links only for existing Supabase users.

## 2. Netlify environment variables

In Netlify, add these variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` optional, defaults to `gpt-5.4-mini`
- `EBIRD_API_KEY` for recent nearby target sightings

Redeploy after saving variables.

Use the project URL for `SUPABASE_URL`, such as:

`https://your-project-ref.supabase.co`

Do not use the longer `/rest/v1/` URL there. The app now trims that if it happens, but the clean project URL is best.

## 3. What this version does

- Works locally with browser storage if Supabase is not configured.
- Uses Supabase shared data after sign-in.
- Saves imported observations and milestone badges to Supabase in a transaction, so an interrupted upload cannot leave a member with a half-written list.
- Loads every page of shared observations, including teams with more than 1,000 eBird rows.
- Refreshes expired sign-ins automatically and reloads shared data when a teammate returns to the page.
- Adds a refresh button to reload the shared Supabase data immediately.
- Adds a publish button to move this browser's locally saved uploads into Supabase after sign-in.
- Shows three adventure calendars for birding, Bigfoot, and vetted extraterrestrial or psi events.
- Uses the eBird API to find recent team target birds reported within 30 miles of Morton.
- Estimates the team's combined trail mileage from dated, mapped observations while grouping nearby stops into trips.
- Uses a Netlify function for ChatGPT, so the OpenAI key is not exposed in browser code.

The `Clear this device` button only removes this browser's cached copy. It never deletes the shared team database.

## 4. First shared-data migration

After this version is deployed, sign in on the browser that still shows the three uploaded lists and select `Publish this browser's data` once. Then sign in from another browser and select `Refresh shared data`. From that point on, ordinary CSV uploads are written directly to the shared database.

## 5. Current privacy model

Only the three users in `team_members` can read or write the shared birding tables. All three can update the combined team collection; anonymous visitors cannot read it. Public sign-ups should remain disabled.
