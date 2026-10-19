import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveDbUrl(): string {
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const candidates = [
      path.join(process.cwd(), "prisma", "dev.db"),
      path.join(process.cwd(), "dev.db"),
      "/var/task/prisma/dev.db",
      "/var/task/dev.db",
    ];
    const dst = "/tmp/vidyora-dev.db";
    try {
      if (!fs.existsSync(dst)) {
        const src = candidates.find((p) => fs.existsSync(p));
        if (src) fs.copyFileSync(src, dst);
      }
      if (fs.existsSync(dst)) {
        process.env.DATABASE_URL = "file:" + dst;
        return process.env.DATABASE_URL;
      }
    } catch {
      // fall through to default
    }
  }
  return process.env.DATABASE_URL || "file:./dev.db";
}

const dbUrl = resolveDbUrl();
process.env.DATABASE_URL = dbUrl;

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
