import { UserActionTokenType } from "@prisma/client";
import { hash as hashPassword } from "bcryptjs";
import { createHash, randomBytes } from "crypto";

import { contactInfo } from "@/data/site-content";
import { prisma } from "@/lib/db";
import { sendMail } from "@/server/mailer";
import { readSystemEmailTemplates } from "@/server/system-email-templates";
import type { Locale, LocalizedText, SystemEmailTemplate } from "@/types/site";

const ACTIVATION_TOKEN_MINUTES = 60 * 24;
const PASSWORD_RESET_TOKEN_MINUTES = 60;

function pickLocalizedText(locale: Locale, value: LocalizedText) {
  return value[locale];
}

function createToken() {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function replaceTemplateVars(value: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((output, [key, replacement]) => {
    return output.replaceAll(`{{${key}}}`, replacement);
  }, value);
}

function buildAppUrl(path: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return new URL(path, baseUrl).toString();
}

function renderSystemEmail({
  locale,
  template,
  actionUrl,
  name,
}: {
  locale: Locale;
  template: SystemEmailTemplate;
  actionUrl: string;
  name: string;
}) {
  const vars = {
    name,
    link: actionUrl,
    supportEmail: contactInfo.email,
    competitionName: "Attacker 2026",
  };

  const subject = replaceTemplateVars(pickLocalizedText(locale, template.subject), vars);
  const preview = replaceTemplateVars(pickLocalizedText(locale, template.preview), vars);
  const headline = replaceTemplateVars(pickLocalizedText(locale, template.headline), vars);
  const intro = replaceTemplateVars(pickLocalizedText(locale, template.intro), vars);
  const actionLabel = replaceTemplateVars(pickLocalizedText(locale, template.actionLabel), vars);
  const actionHint = replaceTemplateVars(pickLocalizedText(locale, template.actionHint), vars);
  const footer = replaceTemplateVars(pickLocalizedText(locale, template.footer), vars);

  const html = `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;padding:0;background:#eff5fb;color:#0f172a;font-family:'Be Vietnam Pro',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eff5fb;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid rgba(15,23,42,0.08);border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.10);">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,#0b3158 0%,#105892 52%,#1772d0 100%);color:#ffffff;">
                <div style="display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.10);font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">Attacker 2026</div>
                <h1 style="margin:18px 0 0;font-size:32px;line-height:1.15;font-weight:700;">${headline}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px 12px;">
                <p style="margin:0;font-size:16px;line-height:1.9;color:#334155;">${intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 32px 0;">
                <a href="${actionUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#58c4ff,#418bca,#2d75c5);color:#021221;text-decoration:none;font-size:14px;font-weight:700;">
                  ${actionLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 0;">
                <div style="border-radius:20px;border:1px solid rgba(15,23,42,0.08);background:#f8fbff;padding:18px 18px 16px;">
                  <p style="margin:0;font-size:13px;line-height:1.85;color:#475569;">${actionHint}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 30px;">
                <p style="margin:0;font-size:13px;line-height:1.85;color:#64748b;">${footer}</p>
                <p style="margin:12px 0 0;font-size:12px;line-height:1.8;color:#94a3b8;">${contactInfo.email}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [headline, "", intro, "", `${actionLabel}: ${actionUrl}`, "", actionHint, "", footer, "", contactInfo.email].join("\n");

  return { subject, html, text };
}

async function createActionToken({
  userId,
  email,
  type,
  expiresInMinutes,
}: {
  userId: string;
  email: string;
  type: UserActionTokenType;
  expiresInMinutes: number;
}) {
  const rawToken = createToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await prisma.$transaction([
    prisma.userActionToken.updateMany({
      where: {
        userId,
        type,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    }),
    prisma.userActionToken.create({
      data: {
        userId,
        email,
        type,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  return rawToken;
}

export async function sendAccountActivationEmail({
  userId,
  email,
  name,
  locale,
}: {
  userId: string;
  email: string;
  name: string;
  locale: Locale;
}) {
  const token = await createActionToken({
    userId,
    email,
    type: UserActionTokenType.VERIFY_EMAIL,
    expiresInMinutes: ACTIVATION_TOKEN_MINUTES,
  });
  const templates = await readSystemEmailTemplates();
  const actionUrl = buildAppUrl(`/auth/activate?token=${encodeURIComponent(token)}`);
  const mail = renderSystemEmail({
    locale,
    template: templates.activation,
    actionUrl,
    name,
  });

  return sendMail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

export async function resendAccountActivationEmail(email: string, locale: Locale) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
    },
  });

  if (!user || user.emailVerifiedAt) {
    return { mode: "log" as const, skipped: true };
  }

  const result = await sendAccountActivationEmail({
    userId: user.id,
    email: user.email,
    name: user.name,
    locale,
  });

  return { ...result, skipped: false };
}

export async function activateAccountFromToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const token = await prisma.userActionToken.findFirst({
    where: {
      tokenHash,
      type: UserActionTokenType.VERIFY_EMAIL,
    },
    include: {
      user: {
        select: {
          id: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!token || token.consumedAt) {
    return { ok: false as const, error: "invalid" as const };
  }

  if (token.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "expired" as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userActionToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });

    if (!token.user.emailVerifiedAt) {
      await tx.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: new Date() },
      });
    }
  });

  return { ok: true as const };
}

export async function requestPasswordReset(email: string, locale: Locale) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
      passwordHash: true,
    },
  });

  if (!user || !user.emailVerifiedAt || !user.passwordHash) {
    return { mode: "log" as const, skipped: true };
  }

  const token = await createActionToken({
    userId: user.id,
    email: user.email,
    type: UserActionTokenType.RESET_PASSWORD,
    expiresInMinutes: PASSWORD_RESET_TOKEN_MINUTES,
  });

  const templates = await readSystemEmailTemplates();
  const actionUrl = buildAppUrl(`/auth/reset-password/confirm?token=${encodeURIComponent(token)}`);
  const mail = renderSystemEmail({
    locale,
    template: templates.passwordReset,
    actionUrl,
    name: user.name,
  });

  const result = await sendMail({
    to: user.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return { ...result, skipped: false };
}

export async function resetPasswordFromToken(rawToken: string, password: string) {
  const tokenHash = hashToken(rawToken);
  const token = await prisma.userActionToken.findFirst({
    where: {
      tokenHash,
      type: UserActionTokenType.RESET_PASSWORD,
    },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!token || token.consumedAt) {
    return { ok: false as const, error: "invalid" as const };
  }

  if (token.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "expired" as const };
  }

  const passwordHash = await hashPassword(password, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: token.userId },
      data: {
        passwordHash,
      },
    });

    await tx.userActionToken.update({
      where: { id: token.id },
      data: {
        consumedAt: new Date(),
      },
    });

    await tx.userActionToken.updateMany({
      where: {
        userId: token.userId,
        type: UserActionTokenType.RESET_PASSWORD,
        consumedAt: null,
        id: { not: token.id },
      },
      data: {
        consumedAt: new Date(),
      },
    });
  });

  return { ok: true as const };
}
