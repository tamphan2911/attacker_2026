import { readdir, rm, stat } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/db";
import type {
  AdminStorageImageCategory,
  AdminStorageImageRow,
  AdminStorageReference,
  AdminStorageSubmissionFileRow,
} from "@/types/admin-storage";

type ServiceSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

type ServiceFailure = {
  ok: false;
  status: number;
  error: string;
  references?: AdminStorageReference[];
};

type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

const imageCategories: AdminStorageImageCategory[] = [
  "avatar-images",
  "content-images",
  "hero-slide-images",
  "judge-images",
  "news-images",
  "sponsor-images",
];

const categoryUrlPrefix: Record<AdminStorageImageCategory, string> = {
  "avatar-images": "/api/avatar-images/",
  "content-images": "/api/content-images/",
  "hero-slide-images": "/api/hero-slide-images/",
  "judge-images": "/api/judge-images/",
  "news-images": "/api/news-images/",
  "sponsor-images": "/api/sponsor-images/",
};

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string, references?: AdminStorageReference[]): ServiceFailure {
  return { ok: false, status, error, references };
}

function resolveAppStorageRoot() {
  const configuredRoot = process.env.APP_STORAGE_ROOT?.trim();

  if (!configuredRoot) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), "storage");
  }

  return path.isAbsolute(configuredRoot)
    ? configuredRoot
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredRoot);
}

function resolveStoragePath(folder: string, storageKey = "") {
  const root = path.resolve(resolveAppStorageRoot(), folder);
  const resolvedPath = path.resolve(root, storageKey);
  const allowedPrefix = `${root}${path.sep}`;

  if (resolvedPath !== root && !resolvedPath.startsWith(allowedPrefix)) {
    throw new Error("Invalid storage key.");
  }

  return { root, resolvedPath };
}

async function listStorageFiles(folder: string) {
  const { root } = resolveStoragePath(folder);
  const rows: Array<{ storageKey: string; sizeBytes: number; updatedAt: string }> = [];

  async function visit(directory: string) {
    let entries: Dirent[];
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }
      throw error;
    }

    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await visit(entryPath);
          return;
        }

        if (!entry.isFile()) {
          return;
        }

        const fileStat = await stat(entryPath);
        rows.push({
          storageKey: path.relative(root, entryPath).split(path.sep).join("/"),
          sizeBytes: fileStat.size,
          updatedAt: fileStat.mtime.toISOString(),
        });
      }),
    );
  }

  await visit(root);
  return rows.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function pushCmsReferences(
  references: AdminStorageReference[],
  cmsEntries: Array<{ scope: string; payload: string }>,
  url: string,
) {
  for (const entry of cmsEntries) {
    if (entry.payload.includes(url)) {
      references.push({
        label: "CMS content",
        detail: entry.scope,
        href: entry.scope === "site-page-content" ? "/admin/content" : undefined,
      });
    }
  }
}

async function findImageReferences(category: AdminStorageImageCategory, storageKey: string) {
  const url = `${categoryUrlPrefix[category]}${storageKey}`;
  const [users, teams, newsPosts, cmsEntries] = await Promise.all([
    prisma.user.findMany({
      where: { avatarImageSrc: url },
      select: { id: true, name: true, loginId: true },
      take: 25,
    }),
    prisma.team.findMany({
      where: { avatarImageSrc: url },
      select: { id: true, name: true, tag: true },
      take: 25,
    }),
    prisma.newsPost.findMany({
      where: { coverImageSrc: url },
      select: { slug: true, titleEn: true, titleVi: true },
      take: 25,
    }),
    prisma.cmsEntry.findMany({
      where: { payload: { contains: url } },
      select: { scope: true, payload: true },
      take: 25,
    }),
  ]);

  const references: AdminStorageReference[] = [];

  users.forEach((user) => {
    references.push({
      label: "User avatar",
      detail: `${user.name} (${user.loginId})`,
      href: `/admin/users/${user.id}/profile`,
    });
  });

  teams.forEach((team) => {
    references.push({
      label: "Team avatar",
      detail: `${team.name} (#${team.tag})`,
      href: `/admin/teams/${team.id}`,
    });
  });

  newsPosts.forEach((post) => {
    references.push({
      label: "News cover",
      detail: post.titleEn || post.titleVi || post.slug,
      href: `/admin/news/${post.slug}`,
    });
  });

  pushCmsReferences(references, cmsEntries, url);
  return references;
}

async function findSubmissionFileReferences(storageKey: string) {
  const submissions = await prisma.teamSubmission.findMany({
    where: { resourceStorageKey: storageKey },
    select: {
      id: true,
      round: true,
      version: true,
      title: true,
      team: { select: { name: true, tag: true } },
    },
    take: 25,
  });

  return submissions.map<AdminStorageReference>((submission) => ({
    label: submission.round === "ROUND_2" ? "Round 2 submission" : "Final/Emerging submission",
    detail: `${submission.team.name} (#${submission.team.tag}) · v${submission.version} · ${submission.title}`,
    href: submission.round === "ROUND_2" ? "/admin/submissions" : "/admin/submissions/round-3",
  }));
}

export async function readAdminStorageImages(): Promise<AdminStorageImageRow[]> {
  const rows = await Promise.all(
    imageCategories.map(async (category) => {
      const files = await listStorageFiles(category);
      return Promise.all(
        files.map(async (file) => ({
          category,
          storageKey: file.storageKey,
          url: `${categoryUrlPrefix[category]}${file.storageKey}`,
          sizeBytes: file.sizeBytes,
          updatedAt: file.updatedAt,
          usedBy: await findImageReferences(category, file.storageKey),
        })),
      );
    }),
  );

  return rows.flat().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function deleteAdminStorageImage(
  category: string,
  storageKey: string,
): Promise<ServiceResult<{ deleted: true }>> {
  if (!imageCategories.includes(category as AdminStorageImageCategory)) {
    return fail(400, "Unknown image storage category.");
  }

  const typedCategory = category as AdminStorageImageCategory;
  const references = await findImageReferences(typedCategory, storageKey);
  if (references.length) {
    return fail(
      409,
      "This image is still used on the site. Remove or replace that reference before deleting the file.",
      references,
    );
  }

  const { resolvedPath } = resolveStoragePath(typedCategory, storageKey);
  await rm(resolvedPath, { force: true });
  return ok({ deleted: true });
}

export async function readAdminStorageSubmissionFiles(): Promise<AdminStorageSubmissionFileRow[]> {
  const files = await listStorageFiles("team-submissions");
  const rows = await Promise.all(
    files.map(async (file) => ({
      storageKey: file.storageKey,
      sizeBytes: file.sizeBytes,
      updatedAt: file.updatedAt,
      usedBy: await findSubmissionFileReferences(file.storageKey),
    })),
  );

  return rows.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function deleteAdminStorageSubmissionFile(
  storageKey: string,
): Promise<ServiceResult<{ deleted: true }>> {
  const references = await findSubmissionFileReferences(storageKey);
  if (references.length) {
    return fail(
      409,
      "This PDF is still attached to a team submission. Delete the submission record first so the site does not keep a broken download link.",
      references,
    );
  }

  const { resolvedPath } = resolveStoragePath("team-submissions", storageKey);
  await rm(resolvedPath, { force: true });
  return ok({ deleted: true });
}
