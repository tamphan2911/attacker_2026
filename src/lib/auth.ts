import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserActionTokenType } from "@prisma/client";
import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { syncJudgeAccounts } from "@/server/judge-accounts";
import { verifyTurnstileToken } from "@/server/turnstile";

const credentialsSchema = z.object({
  login: z.string().trim().min(1),
  password: z.string().min(1),
  turnstileToken: z.string().trim().min(1),
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
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const forwardedForHeader = request.headers?.["x-forwarded-for"];
        const remoteIp = Array.isArray(forwardedForHeader)
          ? forwardedForHeader[0]
          : typeof forwardedForHeader === "string"
            ? forwardedForHeader.split(",")[0]?.trim()
            : undefined;

        const turnstileVerification = await verifyTurnstileToken({
          token: parsed.data.turnstileToken,
          action: "sign_in",
          remoteIp,
        });
        if (!turnstileVerification.success) {
          throw new Error("CAPTCHA_FAILED");
        }

        await syncJudgeAccounts();

        const login = parsed.data.login.trim().toLowerCase();
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: login }, { loginId: login }],
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        if (!user.emailVerifiedAt) {
          const pendingVerification = await prisma.userActionToken.findFirst({
            where: {
              userId: user.id,
              type: UserActionTokenType.VERIFY_EMAIL,
              consumedAt: null,
            },
            select: { id: true },
          });

          if (!pendingVerification) {
            await prisma.user.update({
              where: { id: user.id },
              data: { emailVerifiedAt: new Date() },
            });
          } else {
            throw new Error("EMAIL_NOT_VERIFIED");
          }
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
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerifiedAt: new Date(),
          },
        });
      }

      return true;
    },
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
