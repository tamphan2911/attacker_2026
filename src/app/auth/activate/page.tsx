import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthActivatePage } from "@/components/auth-email-pages";

export const metadata: Metadata = {
  title: "Activate account",
};

export default function AuthActivateRoute() {
  return (
    <Suspense fallback={null}>
      <AuthActivatePage />
    </Suspense>
  );
}
