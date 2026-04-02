import type { Metadata } from "next";

import { ContactPage } from "@/components/contact-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "Official contact information, campus location, and support lines for Attacker 2026.",
};

export default function Page() {
  return <ContactPage />;
}
