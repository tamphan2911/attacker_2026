import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse } from "@/server/route-utils";
import { serializeTeam, serializeUser } from "@/server/site-serializers";

export async function GET(request: Request) {
  const currentUser = await getCurrentDbUser();
  if (!currentUser) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return Response.json({ users: [], teams: [] }, { status: 200 });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      role: UserRole.STUDENT,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { university: { contains: query, mode: "insensitive" } },
        { major: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      accounts: {
        select: { provider: true },
      },
      teamMembership: {
        include: {
          team: {
            include: {
              members: {
                select: { userId: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    take: 12,
  });

  const teamById = new Map<string, NonNullable<(typeof users)[number]["teamMembership"]>["team"]>();
  for (const user of users) {
    const team = user.teamMembership?.team;
    if (team) {
      teamById.set(team.id, team);
    }
  }

  return Response.json(
    {
      users: users.map(serializeUser),
      teams: Array.from(teamById.values()).map(serializeTeam),
    },
    { status: 200 },
  );
}
