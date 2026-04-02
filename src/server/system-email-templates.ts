import { defaultSystemEmailTemplates } from "@/data/system-email-templates";
import { prisma } from "@/lib/db";
import type { SystemEmailTemplates } from "@/types/site";

const SYSTEM_EMAIL_TEMPLATES_SCOPE = "system-email-templates";

export async function readSystemEmailTemplates() {
  const cmsEntry = await prisma.cmsEntry.findUnique({
    where: { scope: SYSTEM_EMAIL_TEMPLATES_SCOPE },
    select: { payload: true },
  });

  return cmsEntry
    ? (JSON.parse(cmsEntry.payload) as SystemEmailTemplates)
    : defaultSystemEmailTemplates;
}

export async function saveSystemEmailTemplates(templates: SystemEmailTemplates) {
  await prisma.cmsEntry.upsert({
    where: { scope: SYSTEM_EMAIL_TEMPLATES_SCOPE },
    update: { payload: JSON.stringify(templates) },
    create: {
      scope: SYSTEM_EMAIL_TEMPLATES_SCOPE,
      payload: JSON.stringify(templates),
    },
  });
}
