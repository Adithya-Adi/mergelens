# MergeLens

MergeLens is a GitHub-native PR explainer that summarizes pull requests, highlights risk hotspots, and posts a reviewer-friendly comment directly in the PR.

## Status

🚧 Project initialized. GitHub Action is wired to MergeLens core analyzer and posts/updates a sticky PR comment on each PR update.

## Planned milestones

1. Parse PR metadata + changed files from GitHub API
2. Generate concise AI summary + risk checklist
3. Post/update sticky PR comment
4. Add config support (`mergelens.config.json`)

## Core module (new)

MergeLens now exposes a reusable TypeScript core:

- `analyzePullRequest(pr)` → baseline heuristic analysis
- `renderMarkdownReport(pr, analysis)` → PR-ready markdown output

## Quickstart

```bash
npm install
npm run check
npm run dev
```

## Vision

Understand every pull request in seconds.
