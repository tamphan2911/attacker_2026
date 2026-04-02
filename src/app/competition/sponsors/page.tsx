import type { Metadata } from "next";

import { SponsorsPage } from "@/components/sponsors-page";

export const metadata: Metadata = {
  title: "Sponsors",
};

export default function Page() {
  return <SponsorsPage />;
}
