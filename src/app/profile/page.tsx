import type { Metadata } from "next";

import { ProfilePage } from "@/components/profile-page";

export const metadata: Metadata = {
  title: "Profile",
  description: "Edit the current account profile for the Attacker 2026 frontend prototype.",
};

export default function Page() {
  return <ProfilePage />;
}
