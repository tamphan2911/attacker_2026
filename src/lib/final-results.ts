import type { TeamFinalOutcome, TeamProfile } from "@/types/site";

export type FinalPlacement = Exclude<TeamFinalOutcome, "emerging-team">;

export function getTeamsForFinalOutcome(
  teams: TeamProfile[],
  outcome: FinalPlacement,
  slots: number,
) {
  return [...teams]
    .filter((team) => team.finalOutcome === outcome)
    .sort((left, right) => {
      const scoreDelta =
        (right.finalScore ?? Number.NEGATIVE_INFINITY) -
        (left.finalScore ?? Number.NEGATIVE_INFINITY);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      if (left.createdAt !== right.createdAt) {
        return left.createdAt.localeCompare(right.createdAt);
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, slots);
}
