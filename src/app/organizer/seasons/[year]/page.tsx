import type { Metadata } from "next";

import { OrganizerSeasonRoute } from "@/components/organizer-season-page";
import { defaultPageContent } from "@/data/site-content";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateStaticParams() {
  return defaultPageContent.organizer.seasonStories.map((story) => ({
    year: encodeURIComponent(story.year),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const decodedYear = decodeURIComponent(year);
  const story = defaultPageContent.organizer.seasonStories.find((item) => item.year === decodedYear);

  if (!story) {
    return {
      title: "Organizer season",
    };
  }

  return {
    title: `${story.year} | ${story.title.en}`,
    description: story.body.en,
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  return <OrganizerSeasonRoute year={year} />;
}
