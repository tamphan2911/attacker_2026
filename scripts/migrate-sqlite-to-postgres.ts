import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { PrismaClient as PostgresClient } from "@prisma/client";

const SQLITE_CLIENT_ROOT = path.join(
  process.cwd(),
  "node_modules",
  ".prisma",
  "sqlite-migration",
);
const SQLITE_SCHEMA_PATH = path.join(SQLITE_CLIENT_ROOT, "schema.prisma");
const SQLITE_CLIENT_PATH = path.join(SQLITE_CLIENT_ROOT, "client", "index.js");

const COPY_PLAN = [
  ["user", "User"],
  ["userActionToken", "UserActionToken"],
  ["team", "Team"],
  ["teamMember", "TeamMember"],
  ["teamInvitation", "TeamInvitation"],
  ["messageConversation", "MessageConversation"],
  ["messageParticipant", "MessageParticipant"],
  ["directMessage", "DirectMessage"],
  ["leadershipTransferRequest", "LeadershipTransferRequest"],
  ["round1TeamLockRequest", "Round1TeamLockRequest"],
  ["round1TestBank", "Round1TestBank"],
  ["round1ExamAttempt", "Round1ExamAttempt"],
  ["round1Submission", "Round1Submission"],
  ["teamSubmission", "TeamSubmission"],
  ["round1JudgeReview", "Round1JudgeReview"],
  ["teamSubmissionJudgeReview", "TeamSubmissionJudgeReview"],
  ["newsPost", "NewsPost"],
  ["forumThread", "ForumThread"],
  ["forumReply", "ForumReply"],
  ["cmsEntry", "CmsEntry"],
  ["account", "Account"],
  ["session", "Session"],
  ["verificationToken", "VerificationToken"],
] as const;

type DelegateName = (typeof COPY_PLAN)[number][0];

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function assertPostgresUrl(databaseUrl: string) {
  if (
    databaseUrl.startsWith("postgresql://") ||
    databaseUrl.startsWith("postgres://")
  ) {
    return;
  }

  throw new Error("DATABASE_URL must point to Postgres before migration.");
}

function resolveSqliteFilePath(sqliteUrl: string) {
  if (!sqliteUrl.startsWith("file:")) {
    throw new Error("SQLITE_DATABASE_URL must use a file: URL.");
  }

  const sqlitePath = sqliteUrl.slice("file:".length);

  return path.isAbsolute(sqlitePath)
    ? sqlitePath
    : path.resolve(process.cwd(), sqlitePath);
}

async function writeTemporarySqliteSchema() {
  const sourceSchema = await readFile(
    path.join(process.cwd(), "prisma", "schema.prisma"),
    "utf8",
  );
  const sqliteSchema = sourceSchema
    .replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"')
    .replace(
      /generator client\s*\{\s*provider\s*=\s*"prisma-client-js"\s*\}/,
      [
        "generator client {",
        '  provider = "prisma-client-js"',
        '  output   = "./client"',
        "}",
      ].join("\n"),
    );

  await mkdir(SQLITE_CLIENT_ROOT, { recursive: true });
  await writeFile(SQLITE_SCHEMA_PATH, sqliteSchema);
}

async function createSqliteClient(sqliteUrl: string) {
  await writeTemporarySqliteSchema();

  execFileSync("npx", ["prisma", "generate", "--schema", SQLITE_SCHEMA_PATH], {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: sqliteUrl,
    },
  });

  const sqliteClientModule = await import(pathToFileURL(SQLITE_CLIENT_PATH).href);
  const SqliteClient =
    sqliteClientModule.PrismaClient ??
    sqliteClientModule.default?.PrismaClient;

  if (!SqliteClient) {
    throw new Error("Failed to load generated SQLite Prisma client.");
  }

  return new SqliteClient({
    datasources: {
      db: {
        url: sqliteUrl,
      },
    },
  });
}

async function assertTargetIsEmpty(postgres: PostgresClient) {
  const counts = await Promise.all(
    COPY_PLAN.map(async ([delegateName, label]) => {
      const delegate = postgres[delegateName as DelegateName] as {
        count: () => Promise<number>;
      };
      const count = await delegate.count();

      return { label, count };
    }),
  );
  const occupied = counts.filter(({ count }) => count > 0);

  if (occupied.length === 0) {
    return;
  }

  const summary = occupied
    .map(({ label, count }) => `${label}: ${count}`)
    .join(", ");

  throw new Error(
    `Postgres target is not empty (${summary}). Restore a clean Postgres database before running the SQLite migration.`,
  );
}

async function copyModel(
  sqlite: Record<string, unknown>,
  postgres: Record<string, unknown>,
  delegateName: DelegateName,
  label: string,
) {
  const sourceDelegate = sqlite[delegateName] as {
    findMany: () => Promise<Record<string, unknown>[]>;
  };
  const targetDelegate = postgres[delegateName] as {
    createMany: (args: { data: Record<string, unknown>[] }) => Promise<{
      count: number;
    }>;
  };
  const rows = await sourceDelegate.findMany();

  if (rows.length === 0) {
    process.stdout.write(`[migrate] ${label}: 0 rows\n`);
    return;
  }

  let copied = 0;

  for (let index = 0; index < rows.length; index += 250) {
    const chunk = rows.slice(index, index + 250);
    const result = await targetDelegate.createMany({ data: chunk });
    copied += result.count;
  }

  process.stdout.write(`[migrate] ${label}: ${copied} rows\n`);
}

async function main() {
  const postgresUrl = requireEnv("DATABASE_URL");
  const sqliteUrl = requireEnv("SQLITE_DATABASE_URL");
  const sqlitePath = resolveSqliteFilePath(sqliteUrl);

  assertPostgresUrl(postgresUrl);

  if (!existsSync(sqlitePath)) {
    throw new Error(`SQLite database file was not found: ${sqlitePath}`);
  }

  const sqlite = await createSqliteClient(sqliteUrl);
  const postgres = new PostgresClient();

  try {
    await assertTargetIsEmpty(postgres);

    await postgres.$transaction(
      async (transaction) => {
        for (const [delegateName, label] of COPY_PLAN) {
          await copyModel(
            sqlite as Record<string, unknown>,
            transaction as unknown as Record<string, unknown>,
            delegateName,
            label,
          );
        }
      },
      {
        timeout: Number(
          process.env.MIGRATE_SQLITE_TO_POSTGRES_TIMEOUT_MS ?? 120_000,
        ),
      },
    );

    process.stdout.write("[migrate] SQLite to Postgres migration complete\n");
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

main().catch((error) => {
  process.stderr.write(`[migrate] ${error.message}\n`);
  process.exit(1);
});
