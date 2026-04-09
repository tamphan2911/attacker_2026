import { execSync, spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { PrismaClient } from "@prisma/client";

function resolveAppStorageRoot() {
  const configuredRoot = process.env.APP_STORAGE_ROOT?.trim();

  if (!configuredRoot) {
    return path.resolve(process.cwd(), "storage");
  }

  return path.isAbsolute(configuredRoot)
    ? configuredRoot
    : path.resolve(process.cwd(), configuredRoot);
}

async function preparePersistentDirectories() {
  const appStorageRoot = resolveAppStorageRoot();
  const directories = [
    appStorageRoot,
    path.join(appStorageRoot, "sqlite"),
    path.join(appStorageRoot, "team-submissions"),
  ];

  await Promise.all(
    directories.map((directoryPath) =>
      mkdir(directoryPath, { recursive: true }),
    ),
  );

  process.stdout.write(
    `[deploy] persistent storage prepared at ${appStorageRoot}\n`,
  );
}

function runCommand(command) {
  execSync(command, {
    stdio: "inherit",
    env: process.env,
  });
}

async function maybeSeedDatabase() {
  if (process.env.BOOTSTRAP_DEMO_DATA !== "true") {
    return;
  }

  const prisma = new PrismaClient();

  try {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      process.stdout.write("[deploy] database already has data, skipping seed\n");
      return;
    }
  } finally {
    await prisma.$disconnect();
  }

  process.stdout.write("[deploy] database is empty, running seed\n");
  runCommand("npx prisma db seed");
}

function startNextServer() {
  const port = process.env.PORT?.trim() || "3000";
  const child = spawn(
    "npx",
    ["next", "start", "--hostname", "0.0.0.0", "--port", port],
    {
      stdio: "inherit",
      env: process.env,
    },
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    process.stderr.write(`[deploy] failed to start Next.js: ${error.message}\n`);
    process.exit(1);
  });
}

async function main() {
  await preparePersistentDirectories();
  // Railway boots should not block on Prisma's interactive data-loss warning prompt.
  runCommand("npx prisma db push --skip-generate --accept-data-loss");
  await maybeSeedDatabase();
  startNextServer();
}

main().catch((error) => {
  process.stderr.write(`[deploy] startup failed: ${error.message}\n`);
  process.exit(1);
});
