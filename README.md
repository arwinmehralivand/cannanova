# cannanova

Static landing pages for Cannanova.

## Editing with Claude Code

Describe the change you want; Claude works on a branch, opens a PR, and shares a
preview link. Review the rendered preview, then merge to `main` to publish.

- Source lives as plain HTML/CSS in this repo — no build step required.
- The `frontend-design` skill (in `.claude/skills/`) guides visual/design work.

## Deploy

Connect this repo to a static host (e.g. Cloudflare Pages):
`main` → production, each PR → preview deployment, rollback → revert the commit.
