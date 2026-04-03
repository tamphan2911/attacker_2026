import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicUserProfilePage } from "@/components/public-user-profile-page";
import { getPublicUserProfileById } from "@/server/user-service";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getPublicUserProfileById(userId);

  if (!profile) {
    return {
      title: "Profile",
    };
  }

  return {
    title: `${profile.name} | Attacker 2026`,
    description: `${profile.name} - ${profile.university}`,
  };
}

export default async function PublicUserProfileRoute({ params }: PageProps) {
  const { userId } = await params;
  const profile = await getPublicUserProfileById(userId);

  if (!profile) {
    notFound();
  }

  return <PublicUserProfilePage profile={profile} />;
}
