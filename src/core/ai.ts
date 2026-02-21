import type { PullRequestData } from "./types.js";

export type SummaryResult = {
  summary: string;
  source: "heuristic" | "llm";
};

type Provider = "openai" | "antropic" | "grok";

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

function getProvider(): Provider {
  const provider = (process.env.MERGELENS_AI_PROVIDER ?? "openai").toLowerCase();
  if (provider === "grok") return "grok";
  if (provider === "antropic" || provider === "anthropic") return "antropic";
  return "openai";
}

function getModel(defaultModel: string): string {
  return process.env.MERGELENS_AI_MODEL ?? process.env.MERGELENS_LLM_MODEL ?? defaultModel;
}

async function callOpenAI(prompt: string): Promise<string | undefined> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;

  const model = getModel("gpt-4.1-mini");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) return undefined;
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim();
}

async function callAntropic(prompt: string): Promise<string | undefined> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return undefined;

  const model = getModel("claude-3-5-sonnet-latest");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 220,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) return undefined;
  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const textBlock = data.content?.find((item) => item.type === "text");
  return textBlock?.text?.trim();
}

async function callGrok(prompt: string): Promise<string | undefined> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return undefined;

  const model = getModel("grok-3-mini");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) return undefined;
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim();
}

export async function generateEnhancedSummary(
  pr: PullRequestData,
  fallbackSummary: string
): Promise<SummaryResult> {
  const prompt = buildPrompt(pr);
  const provider = getProvider();

  try {
    const content =
      provider === "antropic"
        ? await callAntropic(prompt)
        : provider === "grok"
          ? await callGrok(prompt)
          : await callOpenAI(prompt);

    if (!content) {
      return { summary: fallbackSummary, source: "heuristic" };
    }

    return { summary: content, source: "llm" };
  } catch {
    return { summary: fallbackSummary, source: "heuristic" };
  }
}
