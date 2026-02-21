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

- `analyzePullRequest(pr, { config })` → baseline heuristic analysis
- `renderMarkdownReport(pr, analysis)` → PR-ready markdown output

## Repository config

You can customize behavior with `mergelens.config.json` at repo root.

- `exclude`: glob patterns ignored from analysis
- `sensitivePathPatterns`: regex strings used to flag sensitive paths
- `thresholds`: medium/high size and missing-test thresholds

Start from `mergelens.config.example.json`.

## Optional AI summary

MergeLens can enhance TL;DR with an LLM when credentials are provided.

### Provider selection

Set `MERGELENS_AI_PROVIDER` (GitHub variable):
- `openai` (default)
- `grok`
- `antropic`

### Secrets / variables

- `MERGELENS_AI_MODEL` (GitHub variable, optional): model name for the selected provider
- Provider secrets:
  - OpenAI: `OPENAI_API_KEY`
  - Antropic: `ANTHROPIC_API_KEY`
  - Grok/xAI: `XAI_API_KEY`

Without valid provider credentials, or on API failure, MergeLens automatically falls back to heuristic summary.

## GitHub Action usage

```yaml
name: MergeLens
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  mergelens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Adithya-Adi/mergelens@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ai-provider: ${{ vars.MERGELENS_AI_PROVIDER }}
          ai-model: ${{ vars.MERGELENS_AI_MODEL }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          xai-api-key: ${{ secrets.XAI_API_KEY }}
```

Use `@main` or a branch ref before the first tagged release.

## Quickstart (local dev)

```bash
npm install
npm run check
npm run dev
```

## Vision

Understand every pull request in seconds.
