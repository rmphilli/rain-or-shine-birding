# Rain or Shine Birding Team Setup

## 1. Supabase

Create a Supabase project, open the SQL editor, and run `database/schema.sql`.

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
- `OPENAI_MODEL` optional, defaults to `gpt-5.2`

Redeploy after saving variables.

## 3. What this version does

- Works locally with browser storage if Supabase is not configured.
- Uses Supabase shared data after sign-in.
- Saves imported observations and milestone badges to Supabase.
- Uses a Netlify function for ChatGPT, so the OpenAI key is not exposed in browser code.

## 4. Current privacy model

Any authenticated user can read and write the team tables. For the three-person private team, that keeps the setup simple. If the app grows, add a `team_members` table and tighten the row-level security policies.
