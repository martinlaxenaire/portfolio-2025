import type { GameQueryResult } from "~/types/sanity.types";

export function useLevelExperience() {
  const levels = useState(
    "levels",
    () => [] as NonNullable<NonNullable<GameQueryResult>["levels"]>
  );
  const features = useState(
    "features",
    () => [] as NonNullable<NonNullable<GameQueryResult>["features"]>
  );

  const isGameActive = useState("isGameActive", () => true);

  const currentLevel = useState("level", () => 0);
  const currentLevelPoints = useState("levelPoints", () => 0);

  const currentFeature = useState("feature", () => 0);
  const currentFeaturePoints = useState("featurePoints", () => 0);

  const addLevelPoints = (points: number = 0) => {
    if (isGameActive.value) {
      currentLevelPoints.value += points;
    }
  };

  const addFeaturePoints = (points: number = 0) => {
    if (isGameActive.value) {
      currentFeaturePoints.value += points;
    }
  };

  return {
    levels,
    features,
    isGameActive,
    currentLevel,
    currentLevelPoints,
    currentFeature,
    currentFeaturePoints,
    addLevelPoints,
    addFeaturePoints,
  };
}
