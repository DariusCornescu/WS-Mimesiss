# Pull request automation

Pull requests merge themselves once the required checks pass. A human only acts to hold one.

## Default

`.github/workflows/auto-merge.yml` arms GitHub auto-merge (squash) on every PR into `main`. GitHub then
waits for the required checks on `main`: Lint & typecheck, Production build, Unit, component and handler
tests, and Payment concurrency and rollback.

## Labels

| Label | Meaning | Who sets it |
|-------|---------|-------------|
| `needs-review` | A human must decide. Turns auto-merge off and beats every other label. | You |
| `agent-hold` | Temporary stop owned by an automated helper, not a review queue. Turns auto-merge off. | Helper or you |
| `automerge` | Merge on green even for `review/` or `hold/` branches and Dependabot PRs. `needs-review` and `agent-hold` still win. | You |
| `sensitive-paths` | The PR touches auth, payments, middleware, API routes, models, workflows or the lockfile. Awareness only, still auto-merges. | Automatic |
| `merge-conflict` | The PR conflicts with `main`. Cleared when the conflict is resolved. | Automatic |

Other holds: draft PRs, head branches starting with `review/` or `hold/`, fork PRs and Dependabot PRs.

Payment, auth and security changes should get `needs-review` before the PR is marked ready.

## Notes

- Do not enable "Require branches to be up to date before merging": native auto-merge does not update a
  branch, so PRs would stall whenever `main` moves.
- Deleting a PR's head branch closes the PR. The repository deletes the branch itself after merge.
- Both workflows read PR metadata only. They never check out or run code from a pull request.
