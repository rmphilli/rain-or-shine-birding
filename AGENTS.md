# Working on Rain or Shine

Be friendly and concise, with unconditional positive regard. Ground claims in observed evidence.

## Scope and goals

- Canonical repo: `C:\Users\12177\Documents\Codex\2026-05-29\what-can-i-do-here-on\work\rain-or-shine-live`.
- Maintain the existing private Rain or Shine Birding Team site for Jeff, Alex, and Matt.
- Read `README.md`, `PROJECT-HANDOFF.md`, `SETUP.md`, and the relevant source before changing behavior.
- Inspect Git status first. Preserve unrelated changes, ignored `artifacts/` recovery material, and `.netlify/` history.
- Prefer small, reversible changes. Do not rebuild, switch frameworks, introduce commercial/multi-team features, or borrow infrastructure from `flock-clubhouse` without an explicit request.
- The owner authorized a full restoration on 2026-11-01, including necessary data, security, sign-in and deployment work. Preserve all existing uploads and the private trio roster. Credential-specific choices and missing hosting access still need to be resolved before dependent actions.

## Design principles

- Preserve the claymation/whimsical visual identity: three familiar birders, birds, rain-fresh nature, cream/sage/moss palette, warm yellow accents, and playful Bigfoot/UFO details.
- Preserve the team name and motto: "Blessed are the whimsical, for they shall see birds."
- Keep member colors consistent: Matt berry, Jeff blue, Alex green. Preserve responsive behavior and map attribution.
- Respect reduced motion, readable contrast, labeled controls, and keyboard access. Audio must start only after user action and remain stoppable.
- Label estimates and fallbacks honestly. Field miles are estimates, local assistant answers are not live AI identifications, and stored deals/events are not continuously verified.
- Preserve the existing prohibited-event filter and the alien/psi topic scope. Do not widen event topics as an incidental refactor.

## Privacy and security

- Treat life lists, exact locations, original CSVs, credentials, and browser sessions as private. Use only synthetic or checked-in sample data in tests.
- Never commit keys, session tokens, raw private exports, or production DB snapshots. `assets/` and `samples/` are public.
- `SUPABASE_ANON_KEY` is browser-safe only with correct RLS. Never expose a service-role or OpenAI/eBird secret key.
- Keep shared tables roster-protected; do not broaden signup, roster, grants, or policies to solve a connectivity problem.
- The old schema seeded all existing Auth users. That broad seed has been removed from source. Never rerun old copies; provision only individually verified trio accounts and preserve the current roster.
- JWT decoding in the browser is for display, not authentication. Future assistant auth must verify the token server-side and check roster membership by user ID.
- Keep user-provided text escaped before HTML insertion. Do not log message bodies, bird photos, or tokens during security work.
- The restoration assistant enforces server-verified Auth and roster membership, atomic quotas, bounded input/output and deadlines. Preserve those controls and verify the deployment receipt before attributing them to production. Do not restore an older anonymous paid handler during rollback; disable paid calls instead.

## Testing expectations

- Run `npm run check` for behavior/tooling changes and `npm run build` for publish changes. Use Node 22. No dependency installation or credentials are required.
- Tests execute actual `app.js` with isolated substitutes. Do not replace the function under test with a stub or duplicate its algorithm in a test.
- Extend behavioral cases for imports, taxonomy, overlap, badges, sync, token rotation, and failure paths when changing those areas.
- Tests titled `KNOWN LIMITATION` describe current defects; after an authorized fix, replace them with the desired behavior. Do not preserve data-loss behavior merely to keep an old assertion green.
- A green local suite does not prove real browser layout, Leaflet, database atomicity, RLS, or production availability. State exactly what was and was not verified.
- For UI edits, check desktop and narrow mobile rendering, keyboard controls, and overflow. If browser inspection is blocked, report it; do not claim visual verification.
- Never use production imports, publish actions, paid AI calls, or destructive SQL as incidental smoke tests.

## Deployment rules

- No deployment or remote push merely because checks pass. Follow the owner's authorized restoration scope and verify the exact existing site before publication.
- Before publishing, verify Netlify site ID/domain, repo, base, branch, environment contexts and rollback deploy. A push may auto-deploy.
- Publish only generated `dist`; bundle `netlify/functions` separately. Never publish the repository root or recovery artifacts.
- Treat generated `.netlify/` files as historical metadata. Source configuration is `netlify.toml`.
- Preview and production must use deliberately chosen data/config. Keep Flock Clubhouse separate.
- Do not resume an inactive Supabase project, apply schema, change secrets, or edit Auth settings incidentally. Record the intended change and use the authorization for that specific task.
- Keep database backup/restore independent from frontend deployment rollback.

## Do not break

- CSV aliases, quoting, source metadata, unknown `X` counts, null coordinates, and per-member replacement; blank imports must not clear records.
- Distinguish team union, all-three overlap, raw observation count, and the sum of member life-list counts.
- Preserve current taxonomy aliases/exclusions and Matt's exact canonical-233/display-232 exception until explicitly reconciled; never delete source rows to force a count.
- Badge order is earliest known date, then species and place; award first and every 50th eligible species; recomputation preserves award timestamps.
- Observation replacement is an atomic RPC. Badge upserts and multi-member publishing are separate operations; do not describe them as one transaction.
- Preserve cloud pagination beyond 1,000 rows, refresh-token rotation, shared in-flight refresh, and a maximum of one retry after an authenticated 401.
- Preserve local-only use, empty-cloud recovery copies, visible sync failure messages, and explicit publish confirmation.
- "Clear this device" must never delete cloud records. Sign-out currently leaves cached bird data; do not imply it wipes the device.
- Preserve the assistant's message/photo payload, `{reply}` response, model default, and honest fallback when introducing authentication. Change browser and function together.
