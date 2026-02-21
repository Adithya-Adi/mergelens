import type { PullRequestData } from "./types.js";

export type SummaryResult = {
  summary: string;
  source: "heuristic" | "llm";
};

function buildPrompt(pr: PullRequestData): string {
  const filesPreview = pr.files
    .slice(0, 25)
    .map((file) => `- ${file.path} (+${file.additions} / -${file.deletions})`)
    .join("\n");

  return [
    "You are MergeLens, a concise GitHub pull request explainer.",
    "Write a 2-4 sentence TL;DR for reviewers.",
    "Focus on functional change, likely impact, and what to verify.",
    "Avoid hype and uncertainty words.",
    "",
    `Repository: ${pr.repository}`,
    `PR #${pr.number}: ${pr.title}`,
    `Author: ${pr.author}`,
    `Base -> Head: ${pr.baseRef} -> ${pr.headRef}`,
    `Description: ${pr.body ?? "(none)"}`,
    "",
    "Changed files:",
    filesPreview || "(none)",
    "",
    "Return only plain text summary."
  ].join("\n");
}

export async function generateEnhancedSummary(
  pr: PullRequestData,
  fallbackSummary: string
): Promise<SummaryResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { summary: fallbackSummary, source: "heuristic" };
  }

  const model = process.env.MERGELENS_LLM_MODEL ?? "gpt-4.1-mini";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [{ role: "user", content: buildPrompt(pr) }]
      })
    });

    if (!response.ok) {
      return { summary: fallbackSummary, source: "heuristic" };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { summary: fallbackSummary, source: "heuristic" };
    }

    return { summary: content, source: "llm" };
  } catch {
    return { summary: fallbackSummary, source: "heuristic" };
  }
}
