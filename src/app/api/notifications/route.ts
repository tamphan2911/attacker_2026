import { getCurrentDbUser } from "@/server/auth-helpers";
import { listUnreadNotifications } from "@/server/message-service";
import { unauthorizedResponse } from "@/server/route-utils";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  return Response.json(await listUnreadNotifications(user), { status: 200 });
}
