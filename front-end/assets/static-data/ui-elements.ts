import type { GithubContribution } from "~/server/api/github";

export const UIElements = {
  common: {
    loading: "Loading",
    noData: "No data available",
  },
  header: {
    sourceCode: "Source code repository",
    themeSwitcher: (alternateTheme: Theme = "light") =>
      `Switch to ${alternateTheme} theme`,
    colorPaletteButton: "New color palette",
  },
  game: {
    complete: (percentComplete: number = 0) => `${percentComplete}% complete`,
    unlocked: (current: number = 0, max: number = 0) =>
      `Unlocked: ${current}/${max}`,
    currentXPPoints: (points: number = 0) =>
      `Current experience points: ${points}`,
    nextLevel: (pointsNeeded: number = 0) =>
      `Next level in ${pointsNeeded} ${pointsNeeded > 1 ? "points" : "point"}.`,
    guideline:
      "Interact with the site to gain experience points and unlock new contents and features!",
    contents: {
      title: "Contents",
      completed: "New content unlocked!",
    },
    features: {
      title: "Features",
      completed: "New feature unlocked!",
    },
    scrollToContinue: "Scroll to continue",
    skip: {
      disclaimer: "Don't want to play the game? Too bad!",
      button: "Unlock everything",
    },
  },
  hero: {
    guideline: "Slide to begin",
  },
  projects: {
    hoverTitle: "Click!",
  },
  years: {
    guideline: "Drag left",
  },
  invoices: {
    guideline: "Click & hold",
    completed: "Well done!!",
  },
  openSource: {
    guideline: "Draw a line",
    completed: "Excellent!!",
    githubLabels: (type: GithubContribution["type"] = "star"): string => {
      return (() => {
        switch (type) {
          case "star":
            return "Earned stars";
          case "commit":
            return "Number of commits";
          case "follower":
            return "Number of followers";
          case "pr":
            return "Number of pull requests";
          case "issue":
            return "Number of issues closed";
        }
      })();
    },
  },
};
