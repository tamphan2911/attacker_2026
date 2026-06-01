import { readRound2FinalistResults, type Round2AdvancementBracket } from "@/server/round2-finalists";
import type { TeamProfile } from "@/types/site";

export async function attachRound2AdvancementToTeams(
  teams: TeamProfile[],
  now = new Date(),
) {
  if (teams.length === 0) {
    return teams;
  }

  const results = await readRound2FinalistResults(now);
  if (!results.released) {
    return teams.map((team) => ({ ...team, round2Advancement: undefined }));
  }

  const bracketByTeamId = new Map<string, Round2AdvancementBracket>();
  for (const team of results.finalists) {
    bracketByTeamId.set(team.id, "finalist");
  }
  for (const team of results.emergingTeams) {
    bracketByTeamId.set(team.id, "emerging");
  }

  return teams.map((team) => ({
    ...team,
    round2Advancement: bracketByTeamId.get(team.id),
  }));
}
