import type { Metadata } from "next";

import { ProfilePage } from "@/components/profile-page";

export const metadata: Metadata = {
  title: "Profile",
  description: "View the current account profile for the Attacker 2026 platform.",
};

export default function Page() {
  return <ProfilePage />;
}
