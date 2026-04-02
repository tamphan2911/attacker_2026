import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCheckEmailPage } from "@/components/auth-email-pages";

export const metadata: Metadata = {
  title: "Check email",
};

export default function AuthCheckEmailRoute() {
  return (
    <Suspense fallback={null}>
      <AuthCheckEmailPage />
    </Suspense>
  );
}
