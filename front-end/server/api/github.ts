import { defineEventHandler } from "h3";
import { UIElements } from "~/assets/static-data/ui-elements";

export interface GithubContribution {
  type: "follower" | "star" | "commit" | "pr" | "issue";
  label: string;
  count: number;
}

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

const generateFakeData = (): GithubContribution[] => {
  return [
    {
      type: "star",
      label: UIElements.openSource.githubLabels("star"),
      count: Math.round(Math.random() * 1000) + 1500,
    },
    {
      type: "commit",
      label: UIElements.openSource.githubLabels("commit"),
      count: Math.round(Math.random() * 500) + 750,
    },
    {
      type: "follower",
      label: UIElements.openSource.githubLabels("follower"),
      count: Math.round(Math.random() * 150) + 250,
    },
    {
      type: "pr",
      label: UIElements.openSource.githubLabels("pr"),
      count: Math.round(Math.random() * 50) + 125,
    },
    {
      type: "issue",
      label: UIElements.openSource.githubLabels("issue"),
      count: Math.round(Math.random() * 50) + 75,
    },
  ];
};

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
        return generateFakeData();
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
          label: UIElements.openSource.githubLabels("star"),
          count: totalStars,
        },
        {
          type: "commit",
          label: UIElements.openSource.githubLabels("commit"),
          count: totalCommits,
        },
        {
          type: "follower",
          label: UIElements.openSource.githubLabels("follower"),
          count: data.user.followers.totalCount,
        },
        {
          type: "pr",
          label: UIElements.openSource.githubLabels("pr"),
          count: totalPRs,
        },
        {
          type: "issue",
          label: UIElements.openSource.githubLabels("issue"),
          count: data.search.issueCount,
        },
      ];
    } catch (error) {
      return generateFakeData();
    }
  }
);
