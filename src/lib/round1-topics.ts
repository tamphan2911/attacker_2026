import type { Round1TestBank } from "@/types/site";

export const ROUND1_TOPIC_LIMIT = 6;
export const ROUND1_TOPICS_SCOPE = "round1-topics";

export function normalizeRound1TopicName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeRound1Topics(topics: string[]) {
  const seen = new Set<string>();
  const normalizedTopics: string[] = [];

  topics.forEach((topic) => {
    const normalizedTopic = normalizeRound1TopicName(topic);
    const topicKey = normalizedTopic.toLowerCase();

    if (!normalizedTopic || seen.has(topicKey)) {
      return;
    }

    seen.add(topicKey);
    normalizedTopics.push(normalizedTopic);
  });

  return normalizedTopics;
}

export function deriveRound1TopicsFromBanks(banks: Array<Pick<Round1TestBank, "questions">>) {
  return normalizeRound1Topics(
    banks.flatMap((bank) => bank.questions.map((question) => question.topic)),
  ).slice(0, ROUND1_TOPIC_LIMIT);
}

export function isRound1ManagedTopic(topic: string, topics: string[]) {
  const topicKey = normalizeRound1TopicName(topic).toLowerCase();

  return normalizeRound1Topics(topics).some(
    (managedTopic) => managedTopic.toLowerCase() === topicKey,
  );
}
