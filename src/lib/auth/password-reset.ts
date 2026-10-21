import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export interface ResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: {
    id: string;
    email: string;
    name: string;
    accountStatus: string;
    memberships?: { businessId: string }[];
  };
}

/**
 * Creates a secure reset token, invalidating any previous unused tokens for the user
 */
export async function createResetToken(userId: string): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

  const prismaAny = prisma as any;

  if (prismaAny.passwordResetToken) {
    await prismaAny.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prismaAny.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  } else {
    // Dynamic database fallback if the running server has not reloaded generated models
    await prisma.$executeRawUnsafe(
      `UPDATE "password_reset_tokens" SET "usedAt" = NOW() WHERE "userId" = $1 AND "usedAt" IS NULL`,
      userId
    );

    const tokenId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "password_reset_tokens" ("id", "userId", "tokenHash", "expiresAt", "createdAt") VALUES ($1, $2, $3, $4, NOW())`,
      tokenId,
      userId,
      tokenHash,
      expiresAt
    );
  }

  return { rawToken, expiresAt };
}

/**
 * Looks up and validates a token
 */
export async function findResetRecord(rawToken: string): Promise<ResetRecord | null> {
  const tokenHash = hashToken(rawToken);
  const prismaAny = prisma as any;

  if (prismaAny.passwordResetToken) {
    const record = await prismaAny.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            accountStatus: true,
            memberships: { take: 1, select: { businessId: true } },
          },
        },
      },
    });
    return record as ResetRecord | null;
  }

  // Raw SQL fallback
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT t."id", t."userId", t."tokenHash", t."expiresAt", t."usedAt", 
            u."email", u."name", u."accountStatus"
     FROM "password_reset_tokens" t
     JOIN "users" u ON t."userId" = u."id"
     WHERE t."tokenHash" = $1
     LIMIT 1`,
    tokenHash
  );

  if (!rows || rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: new Date(row.expiresAt),
    usedAt: row.usedAt ? new Date(row.usedAt) : null,
    user: {
      id: row.userId,
      email: row.email,
      name: row.name,
      accountStatus: row.accountStatus,
    },
  };
}

/**
 * Consumes the reset token and updates the user's password atomically
 */
export async function consumeResetToken(record: ResetRecord, newPasswordHash: string): Promise<void> {
  const prismaAny = prisma as any;

  if (prismaAny.passwordResetToken) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prismaAny.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prismaAny.passwordResetToken.updateMany({
        where: {
          userId: record.userId,
          id: { not: record.id },
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          businessId: record.user.memberships?.[0]?.businessId || null,
          actorUserId: record.user.id,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "User",
          entityId: record.user.id,
          metadata: {
            email: record.user.email,
            resetCompletedAt: new Date().toISOString(),
          },
        },
      }),
    ]);
  } else {
    // SQL atomic transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.$executeRawUnsafe(
        `UPDATE "password_reset_tokens" SET "usedAt" = NOW() WHERE "id" = $1`,
        record.id
      ),
      prisma.$executeRawUnsafe(
        `UPDATE "password_reset_tokens" SET "usedAt" = NOW() WHERE "userId" = $1 AND "usedAt" IS NULL`,
        record.userId
      ),
      prisma.auditLog.create({
        data: {
          businessId: record.user.memberships?.[0]?.businessId || null,
          actorUserId: record.user.id,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "User",
          entityId: record.user.id,
          metadata: {
            email: record.user.email,
            resetCompletedAt: new Date().toISOString(),
          },
        },
      }),
    ]);
  }
}
