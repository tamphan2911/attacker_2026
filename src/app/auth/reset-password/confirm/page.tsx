import type { Metadata } from "next";
import { Suspense } from "react";

import { PasswordResetConfirmPage } from "@/components/auth-email-pages";

export const metadata: Metadata = {
  title: "Reset password / Confirm",
};

export default function PasswordResetConfirmRoute() {
  return (
    <Suspense fallback={null}>
      <PasswordResetConfirmPage />
    </Suspense>
  );
}
