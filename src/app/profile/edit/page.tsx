import type { Metadata } from "next";

import { ProfileEditPage } from "@/components/profile-page";

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Update the current account profile for the Attacker 2026 platform.",
};

export default function Page() {
  return <ProfileEditPage />;
}
