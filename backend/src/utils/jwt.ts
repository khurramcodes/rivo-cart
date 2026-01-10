
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { ApiError } from "./ApiError.js";

export type JwtUserClaims = {
  sub: string;
  role: "USER" | "ADMIN";
};

function mustGetEnv(name: string) {
  const val = process.env[name];
  if (!val) throw new ApiError(500, "CONFIG_ERROR", `Missing env var: ${name}`);
  return val;
}

export function signAccessToken(claims: JwtUserClaims) {
  const secret = mustGetEnv("JWT_SECRET") as Secret;
  const expiresInRaw = process.env.JWT_ACCESS_EXPIRES_IN ?? "24h";
  const options: SignOptions = { expiresIn: expiresInRaw as SignOptions["expiresIn"] };
  return jwt.sign(claims, secret, options);
}

export function signRefreshToken(claims: JwtUserClaims) {
  const secret = mustGetEnv("JWT_SECRET") as Secret;
  const expiresInRaw = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
  const options: SignOptions = { expiresIn: expiresInRaw as SignOptions["expiresIn"] };
  return jwt.sign(claims, secret, options);
}

export function verifyToken(token: string): JwtUserClaims {
  const secret = mustGetEnv("JWT_SECRET") as Secret;
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded !== "object" || decoded === null) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
    }
    const { sub, role } = decoded as Record<string, unknown>;
    if (typeof sub !== "string" || (role !== "USER" && role !== "ADMIN")) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
    }
    return { sub, role };
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}


