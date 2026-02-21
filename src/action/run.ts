import * as core from "@actions/core";
import * as github from "@actions/github";

import { generateEnhancedSummary } from "../core/ai.js";
import { analyzePullRequest } from "../core/analyzer.js";
import { loadConfig, shouldExclude } from "../core/config.js";
import { renderMarkdownReport } from "../core/renderer.js";
import type { PullRequestData } from "../core/types.js";

const MARKER = "<!-- mergelens-comment -->";

async function run(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN environment variable.");
  }

  const context = github.context;
  const pullRequest = context.payload.pull_request;
  if (!pullRequest) {
    core.info("No pull_request payload found. Skipping.");
    return;
  }

  const octokit = github.getOctokit(token);
  const { owner, repo } = context.repo;
  const pull_number = pullRequest.number;
  const config = loadConfig(process.cwd());

  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number,
    per_page: 100
  });

  const prData: PullRequestData = {
    repository: `${owner}/${repo}`,
    number: pull_number,
    title: pullRequest.title,
    body: pullRequest.body ?? undefined,
    author: pullRequest.user?.login ?? "unknown",
    baseRef: pullRequest.base.ref,
    headRef: pullRequest.head.ref,
    files: files
      .filter((file) => !shouldExclude(file.filename, config.exclude))
      .map((file) => ({
        path: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch ?? undefined
      }))
  };

  const analysis = analyzePullRequest(prData, { config });
  const enhanced = await generateEnhancedSummary(prData, analysis.summary);
  const body = renderMarkdownReport(prData, {
    ...analysis,
    summary: enhanced.summary,
    summarySource: enhanced.source
  });

  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pull_number,
    per_page: 100
  });

  const existing = comments.find(
    (comment) => comment.user?.type === "Bot" && comment.body?.includes(MARKER)
  );

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body
    });
    core.info(`Updated existing MergeLens comment (${existing.id}).`);
  } else {
    const created = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body
    });
    core.info(`Created MergeLens comment (${created.data.id}).`);
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  core.setFailed(message);
});
