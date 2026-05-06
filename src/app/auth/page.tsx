import type { Metadata } from "next";

import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Frontend-ready sign in and registration experience for Attacker 2026.",
};

export default function Page() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return <AuthPage googleEnabled={googleEnabled} />;
}
