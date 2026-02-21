# MergeLens

MergeLens is a GitHub Action that explains pull requests with:
- clear TL;DR summaries,
- change/risk signals,
- reviewer checklists,
- and a sticky PR comment that updates on every push.

---

## Install in any repository

Create `.github/workflows/mergelens.yml`:

```yaml
name: MergeLens PR Comment

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
          groq-api-key: ${{ secrets.GROQ_API_KEY }}
```

That’s enough to start posting comments on PRs.

---

## AI provider configuration

Set `MERGELENS_AI_PROVIDER` (Repository Variable):
- `openai` (default)
- `antropic`
- `grok` (xAI)
- `groq`

Set `MERGELENS_AI_MODEL` (Repository Variable, optional):
- model name for the selected provider

Set provider secret(s) (Repository Secrets):
- OpenAI: `OPENAI_API_KEY`
- Antropic: `ANTHROPIC_API_KEY`
- xAI/Grok: `XAI_API_KEY`
- Groq: `GROQ_API_KEY`

> If AI credentials are missing/invalid or the provider call fails, MergeLens automatically falls back to heuristic summary mode.

---

## Repository-level tuning

You can customize behavior using `mergelens.config.json` at repo root.

Example:

```json
{
  "exclude": ["**/*.lock", "**/dist/**", "**/__snapshots__/**"],
  "sensitivePathPatterns": ["auth", "permission", "payment", "secret", "token", "infra"],
  "thresholds": {
    "mediumFiles": 12,
    "highFiles": 30,
    "mediumChanges": 400,
    "highChanges": 1000,
    "missingTestsMinAdditions": 80
  }
}
```

Fields:
- `exclude`: file globs to skip from analysis
- `sensitivePathPatterns`: path patterns to flag high-risk areas
- `thresholds`: PR size and missing-test detection limits

---

## Output in PR

MergeLens adds/updates one sticky comment containing:
- PR overview + risk level
- TL;DR (LLM or heuristic fallback)
- file/addition/deletion stats
- risk findings
- reviewer checklist

---

## Local development

```bash
npm install
npm run check
npm run build
npm run dev
```

---

## Next steps

- Add safe debug mode for AI fallback reasons (without exposing secrets).
- Add inline per-file highlights for large PRs.
- Add optional fail-on-high-risk gate for protected branches.
- Add support for ignoring bot-generated files by default.
- Add richer release notes + changelog automation.

---

**Vision:** Understand every pull request in seconds.
