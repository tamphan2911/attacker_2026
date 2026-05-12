import { getCurrentDbUser } from "@/server/auth-helpers";
import { searchMessageUserByExactEmail } from "@/server/message-service";
import { unauthorizedResponse } from "@/server/route-utils";

export async function GET(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? "";
  return Response.json(await searchMessageUserByExactEmail(user.id, email), { status: 200 });
}
