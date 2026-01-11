import type { User } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { randomToken, sha256 } from "../utils/crypto.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, type JwtUserClaims } from "../utils/jwt.js";

function sanitizeUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safe } = user;
  return safe;
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "EMAIL_IN_USE", "Email is already in use");

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      password: passwordHash,
      role: "USER",
    },
  });

  const claims: JwtUserClaims = { sub: user.id, role: user.role };
  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(claims),
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
  userAgent?: string;
  ip?: string;
}) {

  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  
  if (!user) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const ok = await verifyPassword(input.password, user.password);
  if (!ok) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const claims: JwtUserClaims = { sub: user.id, role: user.role };

  const refreshToken = randomToken(48);
  const refreshTokenHash = sha256(refreshToken);
  const refreshExpiresDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
  const expiresAt = new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      userAgent: input.userAgent,
      ip: input.ip,
      expiresAt,
    },
  });

  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(claims),
    // opaque refresh token stored in HttpOnly cookie; session id helps debug/rotate
    refreshToken,
    sessionId: session.id,
  };
}

export async function rotateRefreshToken(input: { refreshToken: string }) {
  const refreshTokenHash = sha256(input.refreshToken);
  const session = await prisma.session.findFirst({
    where: { refreshTokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });

  if (!session) throw new ApiError(401, "INVALID_REFRESH", "Invalid refresh token");

  // rotate: revoke old, issue new
  const newRefreshToken = randomToken(48);
  const newRefreshTokenHash = sha256(newRefreshToken);
  const refreshExpiresDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
  const newExpiresAt = new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    }),
    prisma.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: newRefreshTokenHash,
        userAgent: session.userAgent ?? undefined,
        ip: session.ip ?? undefined,
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  const claims: JwtUserClaims = { sub: session.userId, role: session.user.role };

  return {
    user: sanitizeUser(session.user),
    accessToken: signAccessToken(claims),
    refreshToken: newRefreshToken,
  };
}

export async function logoutByRefreshToken(refreshToken: string) {
  const refreshTokenHash = sha256(refreshToken);
  await prisma.session.updateMany({
    where: { refreshTokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}


