import type { Metadata } from "next";

import { MessageCenterPage } from "@/components/message-center-page";

export const metadata: Metadata = {
  title: "Messages",
};

export default function MessagesPage() {
  return <MessageCenterPage />;
}
