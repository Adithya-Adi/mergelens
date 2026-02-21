export type FileChange = {
  path: string;
  additions: number;
  deletions: number;
  patch?: string;
};

export type PullRequestData = {
  repository: string;
  number: number;
  title: string;
  body?: string;
  author: string;
  baseRef: string;
  headRef: string;
  files: FileChange[];
};

export type RiskLevel = "low" | "medium" | "high";

export type AnalysisFinding = {
  id: string;
  title: string;
  detail: string;
  severity: RiskLevel;
};

export type PullRequestAnalysis = {
  summary: string;
  summarySource: "heuristic" | "llm";
  riskLevel: RiskLevel;
  totals: {
    files: number;
    additions: number;
    deletions: number;
  };
  findings: AnalysisFinding[];
  checklist: string[];
};
