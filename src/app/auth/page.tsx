import type { Metadata } from "next";

import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Frontend-ready sign in and registration experience for Attacker 2026.",
};

export default function Page() {
  return <AuthPage />;
}
