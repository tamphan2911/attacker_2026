export const DEFAULT_JUDGE_PASSWORD = "Judge@2026";

export function getDefaultJudgePassword() {
  return DEFAULT_JUDGE_PASSWORD;
}

export function getJudgeLoginIdFromProfileId(judgeProfileId: string) {
  return judgeProfileId.trim().toLowerCase();
}
