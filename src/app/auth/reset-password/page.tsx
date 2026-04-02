import type { Metadata } from "next";

import { PasswordResetRequestPage } from "@/components/auth-email-pages";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function PasswordResetRequestRoute() {
  return <PasswordResetRequestPage />;
}
