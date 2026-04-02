import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
  login: z.string().trim().min(1),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login: { label: "Email or account ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const login = parsed.data.login.trim().toLowerCase();
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: login }, { loginId: login }],
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          loginId: user.loginId,
        };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? token.role;
        token.loginId = user.loginId ?? token.loginId;
      }

      if (!token.sub) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          role: true,
          loginId: true,
          name: true,
          email: true,
        },
      });

      if (!dbUser) {
        return token;
      }

      token.role = dbUser.role;
      token.loginId = dbUser.loginId;
      token.name = dbUser.name;
      token.email = dbUser.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? session.user.role;
        session.user.loginId = token.loginId ?? session.user.email ?? "";
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
      }

      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
