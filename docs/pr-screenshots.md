# PR screenshots

`npm run screenshots:pr` captures before/after screenshots for a pull request, so reviewers can see a visual change without running the branch.

The script:

1. Starts an in-memory MongoDB and seeds it with sample projects and editions from `scripts/helpers/preview-seed.mjs`: one active edition, one upcoming, one undated and one archived. No shared or production database is touched.
2. Runs the current checkout with `next dev` on port 3301. Its build output goes to `.preview/pr-screenshots`, so it does not clash with an `npm run dev` already running in the same checkout.
3. With `--before <git ref>`, checks that ref out into a temporary worktree and runs it on port 3302 against the same database.
4. Captures each shot with Playwright, using reduced motion, a non-sticky header and the dev overlay hidden.
5. Writes the images and a ready-to-paste `screenshots.md` to `.preview/screenshots/`. That folder is gitignored.
6. With `--publish <pr-number>`, pushes the images to `pr-<number>/` on the `pr-assets` branch and writes `screenshots.md` with absolute image URLs.

## Usage

```bash
# Full pages of /, /despre and /proiecte (desktop) and / (mobile), current checkout only
npm run screenshots:pr

# Before/after against main, published for PR 42
npm run screenshots:pr -- --before origin/main --publish 42

# Specific sections, from a shots file
npm run screenshots:pr -- --before origin/main --shots .preview/shots.json --publish 42

# Without seeded data, to show empty states
npm run screenshots:pr -- --empty
```

After publishing, paste `.preview/screenshots/screenshots.md` into the PR description. You can also apply it with `gh pr edit <number> --body-file <file>`, after adding it to the existing description.

## Shots file

The shots file is a JSON array. Each entry has:

| Field | Meaning |
| --- | --- |
| `name` | Used in the file name: `before-<name>.png` and `after-<name>.png`. |
| `path` | Route to open, for example `/despre`. |
| `device` | `desktop` (1440×900) or `mobile` (375×812 at 2×). Defaults to `desktop`. |
| `selector` | Optional. A CSS selector, or a list of them. The first one found on the page is captured. Use a list when a section was replaced, for example `["#evenimente", "#proiecte"]`. If none is found, or `selector` is omitted, the full page is captured. |

```json
[
  { "name": "under-hero", "path": "/", "selector": ["#evenimente", "#proiecte"] },
  { "name": "footer", "path": "/", "selector": "footer > div:last-child" },
  { "name": "about-mobile", "path": "/", "device": "mobile", "selector": "section[aria-labelledby=\"about-title\"]" }
]
```

## Requirements and notes

- `gh` must be signed in. The script reads the repository name from it, and publishing pushes to `origin`.
- Playwright's bundled Chromium is used when installed (`npx playwright install chromium`). Otherwise the script falls back to a locally installed Chrome or Edge. Set `PR_SCREENSHOTS_CHANNEL` to force a specific channel.
- Clerk needs well-formed keys even for signed-out pages. If `.env.staging.local` holds test keys (`pk_test_`, `sk_test_`), the script uses them. Otherwise it uses the same placeholders as `npm run build:isolated`.
- `pr-assets` is an orphan branch that holds only images. It shares no history with `main`, and nothing deploys from it. The repository is public, so images on it are public too. Do not capture pages that show personal data.
- A run takes about a minute per checkout, mostly `next dev` compiling the routes on first request.
