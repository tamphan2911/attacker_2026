import { getCurrentDbUser } from "@/server/auth-helpers";
import { getMessageUserById, searchMessageUserByExactEmail } from "@/server/message-service";
import { unauthorizedResponse } from "@/server/route-utils";

export async function GET(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "";
  if (userId) {
    return Response.json(await getMessageUserById(user.id, userId), { status: 200 });
  }

  const email = url.searchParams.get("email") ?? "";
  return Response.json(await searchMessageUserByExactEmail(user.id, email), { status: 200 });
}
