import { PrismaClient } from "@prisma/client";
import { existsSync, copyFileSync } from "fs";
import path from "path";

// Resolve a URL do banco.
// - Local: usa DATABASE_URL do .env (SQLite em ./prisma/dev.db).
// - Nuvem (Vercel): o sistema de arquivos é só-leitura, exceto /tmp.
//   Copiamos o banco-base embarcado para /tmp na primeira execução e
//   trabalhamos a partir dali (persiste durante a sessão da função).
function resolverUrlBanco(): string {
  if (process.env.VERCEL) {
    const destino = "/tmp/alumy.db";
    if (!existsSync(destino)) {
      const base = path.join(process.cwd(), "prisma", "base.sqlite");
      if (existsSync(base)) copyFileSync(base, destino);
    }
    return `file:${destino}`;
  }
  return process.env.DATABASE_URL || "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolverUrlBanco() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
