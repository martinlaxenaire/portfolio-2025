import { defineEventHandler } from "h3";

export interface GithubContribution {
  type: "follower" | "star" | "commit" | "pr" | "issue";
  label:
    | "Number of followers"
    | "Earned stars"
    | "Number of commits"
    | "Number of pull requests"
    | "Number of issues closed";
  count: number;
}

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

export default defineEventHandler(
  async (event): Promise<GithubContribution[]> => {
    const runtimeConfig = useRuntimeConfig();
    const username = "martinlaxenaire";

    const query = `
    {
      user(login: "${username}") {
        followers {
          totalCount
        }
        repositories(ownerAffiliations: OWNER, privacy: PUBLIC, first: 100) {
          nodes {
            stargazerCount
            pullRequests(first: 1) {
              totalCount
            }
            defaultBranchRef {
              target {
                ... on Commit {
                  history(author: { emails: ["martin.laxenaire@gmail.com"] }) {
                    totalCount
                  }
                }
              }
            }
          }
        }
      }
      search(query: "involves:${username} is:issue is:closed", type: ISSUE, first: 1) {
        issueCount
      }
    }
  `;

    try {
      const response = await fetch(GITHUB_GRAPHQL_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${runtimeConfig.githubAccessToken}`,
        },
        body: JSON.stringify({ query }),
      });

      const { data } = await response.json();

      if (!data) {
        throw new Error("Failed to fetch data from GitHub.");
      }

      // Sum total PRs only from public repos
      const totalPRs = data.user.repositories.nodes.reduce(
        (sum: number, repo: { pullRequests: { totalCount: number } }) =>
          sum + repo.pullRequests.totalCount,
        0
      );

      // Sum total stars from all owned repositories
      const totalStars = data.user.repositories.nodes.reduce(
        (sum: number, repo: { stargazerCount: number }) =>
          sum + repo.stargazerCount,
        0
      );

      const totalCommits = data.user.repositories.nodes.reduce(
        (
          sum: number,
          repo: {
            defaultBranchRef?: {
              target?: { history?: { totalCount: number } };
            };
          }
        ) => sum + (repo.defaultBranchRef?.target?.history?.totalCount || 0),
        0
      );

      return [
        {
          type: "star",
          label: "Earned stars",
          count: totalStars,
        },
        {
          type: "commit",
          label: "Number of commits",
          count: totalCommits,
        },
        {
          type: "follower",
          label: "Number of followers",
          count: data.user.followers.totalCount,
        },
        {
          type: "pr",
          label: "Number of pull requests",
          count: totalPRs,
        },
        {
          type: "issue",
          label: "Number of issues closed",
          count: data.search.issueCount,
        },
      ];
    } catch (error) {
      console.error("GitHub API error:", error);
      return [];
    }
  }
);
