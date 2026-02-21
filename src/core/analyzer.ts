import type {
  AnalysisFinding,
  PullRequestAnalysis,
  PullRequestData,
  RiskLevel
} from "./types.js";
import type { ResolvedMergeLensConfig } from "./config.js";

type AnalyzeOptions = {
  config: ResolvedMergeLensConfig;
};

function maxSeverity(current: RiskLevel, candidate: RiskLevel): RiskLevel {
  const rank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
  return rank[candidate] > rank[current] ? candidate : current;
}

function hasTestFile(paths: string[]): boolean {
  return paths.some((path) => /test|spec|__tests__/i.test(path));
}

export function analyzePullRequest(
  pr: PullRequestData,
  options: AnalyzeOptions
): PullRequestAnalysis {
  const { config } = options;

  const totals = pr.files.reduce(
    (acc, file) => {
      acc.files += 1;
      acc.additions += file.additions;
      acc.deletions += file.deletions;
      return acc;
    },
    { files: 0, additions: 0, deletions: 0 }
  );

  const findings: AnalysisFinding[] = [];
  let riskLevel: RiskLevel = "low";

  if (
    totals.files > config.thresholds.highFiles ||
    totals.additions + totals.deletions > config.thresholds.highChanges
  ) {
    findings.push({
      id: "large-pr",
      title: "Large pull request",
      detail:
        "This PR is relatively large and may be harder to review thoroughly in one pass.",
      severity: "high"
    });
    riskLevel = maxSeverity(riskLevel, "high");
  } else if (
    totals.files > config.thresholds.mediumFiles ||
    totals.additions + totals.deletions > config.thresholds.mediumChanges
  ) {
    findings.push({
      id: "medium-size-pr",
      title: "Moderate-sized pull request",
      detail:
        "This PR touches multiple files. Consider reviewing by module or commit.",
      severity: "medium"
    });
    riskLevel = maxSeverity(riskLevel, "medium");
  }

  const sensitiveMatchers = config.sensitivePathPatterns.map(
    (pattern) => new RegExp(pattern, "i")
  );

  const sensitiveFiles = pr.files
    .map((file) => file.path)
    .filter((path) => sensitiveMatchers.some((pattern) => pattern.test(path)));

  if (sensitiveFiles.length > 0) {
    findings.push({
      id: "sensitive-paths",
      title: "Sensitive code paths changed",
      detail: `Sensitive paths touched: ${sensitiveFiles
        .slice(0, 5)
        .join(", ")}${sensitiveFiles.length > 5 ? "..." : ""}`,
      severity: "high"
    });
    riskLevel = maxSeverity(riskLevel, "high");
  }

  if (
    !hasTestFile(pr.files.map((file) => file.path)) &&
    totals.additions > config.thresholds.missingTestsMinAdditions
  ) {
    findings.push({
      id: "missing-tests",
      title: "No test files detected",
      detail:
        "Code changes are non-trivial, but no obvious tests were added/updated.",
      severity: "medium"
    });
    riskLevel = maxSeverity(riskLevel, "medium");
  }

  const checklist = [
    "Validate logic changes for edge cases and failure paths.",
    "Confirm tests cover new or modified behavior.",
    "Check for backward compatibility and migration impact.",
    "Verify docs/changelog updates if public behavior changed."
  ];

  const summary =
    findings.length === 0
      ? "PR looks straightforward with no immediate risk flags from baseline heuristics."
      : `Found ${findings.length} risk signal${
          findings.length > 1 ? "s" : ""
        } from baseline heuristics.`;

  return {
    summary,
    riskLevel,
    totals,
    findings,
    checklist
  };
}
