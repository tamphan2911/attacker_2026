export type ForumModerationField =
  | "title"
  | "summary"
  | "body"
  | "contactNote"
  | "preferredRoles"
  | "reply";

export type ForumModerationCategory = "profanity" | "sexual-content" | "abusive-content";

export interface ForumModerationIssue {
  field: ForumModerationField;
  category: ForumModerationCategory;
  terms: string[];
}

type ModerationRule = {
  category: ForumModerationCategory;
  label: string;
  pattern: RegExp;
};

const moderationRules: ModerationRule[] = [
  { category: "profanity", label: "fuck", pattern: /\bfuck(?:er|ers|ing|ed)?\b/ },
  { category: "profanity", label: "shit", pattern: /\bshit(?:ty)?\b/ },
  { category: "profanity", label: "bitch", pattern: /\bbitch(?:es)?\b/ },
  { category: "profanity", label: "asshole", pattern: /\basshole\b/ },
  { category: "profanity", label: "motherfucker", pattern: /\bmotherfucker\b/ },
  { category: "profanity", label: "cunt", pattern: /\bcunt\b/ },
  { category: "profanity", label: "dit me", pattern: /\bdit(?:\s+con)?\s+me\b/ },
  { category: "profanity", label: "du me", pattern: /\bdu\s+me\b/ },
  { category: "profanity", label: "vai lon", pattern: /\bvai\s+lon\b/ },
  { category: "sexual-content", label: "porn", pattern: /\bporn(?:hub)?\b/ },
  { category: "sexual-content", label: "sex", pattern: /\bsex\b/ },
  { category: "sexual-content", label: "sexual", pattern: /\bsexual\b/ },
  { category: "sexual-content", label: "sexy", pattern: /\bsexy\b/ },
  { category: "sexual-content", label: "nude", pattern: /\bnudes?\b/ },
  { category: "sexual-content", label: "blowjob", pattern: /\bblow\s*job\b/ },
  { category: "sexual-content", label: "handjob", pattern: /\bhand\s*job\b/ },
  { category: "sexual-content", label: "hentai", pattern: /\bhentai\b/ },
  { category: "sexual-content", label: "sexting", pattern: /\bsext(?:ing)?\b/ },
  { category: "sexual-content", label: "tinh duc", pattern: /\btinh\s+duc\b/ },
  { category: "sexual-content", label: "khieu dam", pattern: /\bkhieu\s+dam\b/ },
  { category: "sexual-content", label: "clip nong", pattern: /\bclip\s+nong\b/ },
  { category: "sexual-content", label: "anh nong", pattern: /\banh\s+nong\b/ },
  { category: "abusive-content", label: "kill yourself", pattern: /\bkill\s+yourself\b/ },
  { category: "abusive-content", label: "go die", pattern: /\bgo\s+die\b/ },
  { category: "abusive-content", label: "chet di", pattern: /\bchet\s+di\b/ },
  { category: "abusive-content", label: "tu sat di", pattern: /\btu\s+sat\s+di\b/ },
];

function normalizeForumModerationInput(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function detectForumModerationIssues(
  fields: Array<{ field: ForumModerationField; value: string }>,
): ForumModerationIssue[] {
  const issues: ForumModerationIssue[] = [];

  for (const field of fields) {
    const normalized = normalizeForumModerationInput(field.value);
    if (!normalized) {
      continue;
    }

    const matchesByCategory = new Map<ForumModerationCategory, Set<string>>();

    for (const rule of moderationRules) {
      if (!rule.pattern.test(normalized)) {
        continue;
      }

      const matches = matchesByCategory.get(rule.category) ?? new Set<string>();
      matches.add(rule.label);
      matchesByCategory.set(rule.category, matches);
    }

    for (const [category, labels] of matchesByCategory.entries()) {
      issues.push({
        field: field.field,
        category,
        terms: Array.from(labels).slice(0, 6),
      });
    }
  }

  return issues;
}
