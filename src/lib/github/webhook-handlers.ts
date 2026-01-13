import { prisma } from "@/lib/prisma";
import { GitType } from "@prisma/client";

// GitHub Webhook Payload Types
interface GitHubUser {
  login: string;
  id: number;
}

interface Commit {
  id: string;
  message: string;
  timestamp: string;
  url: string;
  author: {
    name: string;
    email: string;
    username?: string;
  };
  added: string[];
  removed: string[];
  modified: string[];
}

interface PushPayload {
  ref: string;
  repository: {
    full_name: string;
    html_url: string;
  };
  sender: GitHubUser;
  commits: Commit[];
  head_commit: Commit | null;
}

interface PullRequestPayload {
  action: string;
  number: number;
  pull_request: {
    title: string;
    body: string | null;
    html_url: string;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
    };
    merged: boolean;
    additions: number;
    deletions: number;
    user: GitHubUser;
  };
  repository: {
    full_name: string;
  };
  sender: GitHubUser;
}

interface PullRequestReviewPayload {
  action: string;
  review: {
    id: number;
    body: string | null;
    state: string;
    html_url: string;
    user: GitHubUser;
  };
  pull_request: {
    number: number;
    title: string;
    html_url: string;
  };
  repository: {
    full_name: string;
  };
  sender: GitHubUser;
}

interface IssuesPayload {
  action: string;
  issue: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    state: string;
    user: GitHubUser;
  };
  repository: {
    full_name: string;
  };
  sender: GitHubUser;
}

// Find user by GitHub username
async function findUserByGitHubUsername(username: string) {
  return prisma.user.findFirst({
    where: { githubUsername: username },
  });
}

// Handle push event (commits)
export async function handlePushEvent(payload: PushPayload) {
  const { commits, repository, ref } = payload;
  const branch = ref.replace("refs/heads/", "");

  const results = [];

  for (const commit of commits) {
    const username = commit.author.username;
    if (!username) continue;

    const user = await findUserByGitHubUsername(username);
    if (!user) continue;

    // Calculate additions/deletions (rough estimate from file changes)
    const additions = commit.added.length + commit.modified.length;
    const deletions = commit.removed.length;

    const activity = await prisma.gitActivity.create({
      data: {
        type: GitType.COMMIT,
        title: commit.message.split("\n")[0].substring(0, 200),
        description: commit.message,
        sha: commit.id,
        repository: repository.full_name,
        branch,
        url: commit.url,
        additions,
        deletions,
        userId: user.id,
        timestamp: new Date(commit.timestamp),
      },
    });

    results.push(activity);
  }

  return results;
}

// Handle pull_request event
export async function handlePullRequestEvent(payload: PullRequestPayload) {
  const { action, number, pull_request, repository, sender } = payload;

  // Only handle specific actions
  if (!["opened", "reopened", "closed"].includes(action)) {
    return null;
  }

  const user = await findUserByGitHubUsername(sender.login);
  if (!user) return null;

  // Determine if it's a merge or regular PR
  const isMerge = action === "closed" && pull_request.merged;
  const type = isMerge ? GitType.MERGE : GitType.PULL_REQUEST;

  const title = isMerge
    ? `Merged: PR #${number} - ${pull_request.title}`
    : `PR #${number}: ${pull_request.title}`;

  const description = isMerge
    ? `Merged pull request #${number} into ${pull_request.base.ref}`
    : pull_request.body || "";

  const activity = await prisma.gitActivity.create({
    data: {
      type,
      title: title.substring(0, 200),
      description,
      sha: pull_request.head.sha,
      repository: repository.full_name,
      branch: pull_request.head.ref,
      url: pull_request.html_url,
      additions: pull_request.additions,
      deletions: pull_request.deletions,
      userId: user.id,
      timestamp: new Date(),
    },
  });

  return activity;
}

// Handle pull_request_review event
export async function handlePullRequestReviewEvent(
  payload: PullRequestReviewPayload
) {
  const { action, review, pull_request, repository, sender } = payload;

  // Only handle submitted reviews
  if (action !== "submitted") {
    return null;
  }

  const user = await findUserByGitHubUsername(sender.login);
  if (!user) return null;

  const stateLabel =
    review.state === "approved"
      ? "Approved"
      : review.state === "changes_requested"
        ? "Changes requested"
        : "Commented";

  const activity = await prisma.gitActivity.create({
    data: {
      type: GitType.REVIEW,
      title: `Review on PR #${pull_request.number}: ${stateLabel}`,
      description: review.body || `${stateLabel} on "${pull_request.title}"`,
      repository: repository.full_name,
      url: review.html_url,
      userId: user.id,
      timestamp: new Date(),
    },
  });

  return activity;
}

// Handle issues event
export async function handleIssuesEvent(payload: IssuesPayload) {
  const { action, issue, repository, sender } = payload;

  // Only handle specific actions
  if (!["opened", "closed", "reopened"].includes(action)) {
    return null;
  }

  const user = await findUserByGitHubUsername(sender.login);
  if (!user) return null;

  const actionLabel =
    action === "opened"
      ? "Opened"
      : action === "closed"
        ? "Closed"
        : "Reopened";

  const activity = await prisma.gitActivity.create({
    data: {
      type: GitType.ISSUE,
      title: `${actionLabel} Issue #${issue.number}: ${issue.title}`.substring(
        0,
        200
      ),
      description: issue.body || "",
      repository: repository.full_name,
      url: issue.html_url,
      userId: user.id,
      timestamp: new Date(),
    },
  });

  return activity;
}
