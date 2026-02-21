import type { PullRequestAnalysis, PullRequestData } from "./types.js";

function riskBadge(level: PullRequestAnalysis["riskLevel"]): string {
  switch (level) {
    case "high":
      return "🔴 High";
    case "medium":
      return "🟠 Medium";
    default:
      return "🟢 Low";
  }
}

export function renderMarkdownReport(
  pr: PullRequestData,
  analysis: PullRequestAnalysis
): string {
  const findingsSection =
    analysis.findings.length === 0
      ? "- No major risk findings from baseline heuristics."
      : analysis.findings
          .map(
            (finding) =>
              `- **${finding.title}** (${finding.severity}): ${finding.detail}`
          )
          .join("\n");

  const checklistSection = analysis.checklist.map((item) => `- [ ] ${item}`).join("\n");

  return [
    "<!-- mergelens-comment -->",
    "## 🔎 MergeLens Report",
    "",
    `**PR:** #${pr.number} - ${pr.title}`,
    `**Repository:** ${pr.repository}`,
    `**Risk level:** ${riskBadge(analysis.riskLevel)}`,
    `**Summary source:** ${analysis.summarySource === "llm" ? "🤖 LLM" : "🧠 Heuristic fallback"}`,
    "",
    "### TL;DR",
    analysis.summary,
    "",
    "### Change stats",
    `- Files: **${analysis.totals.files}**`,
    `- Additions: **${analysis.totals.additions}**`,
    `- Deletions: **${analysis.totals.deletions}**`,
    "",
    "### Risk findings",
    findingsSection,
    "",
    "### Reviewer checklist",
    checklistSection
  ].join("\n");
}
