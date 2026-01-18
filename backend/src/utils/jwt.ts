
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { ApiError } from "./ApiError.js";

export type JwtUserPayload = {
  sub: string;
  firstName: string;
  role: "USER" | "ADMIN";
};

function mustGetEnv(name: string) {
  const val = process.env[name];
  if (!val) throw new ApiError(500, "CONFIG_ERROR", `Missing env var: ${name}`);
  return val;
}

export function signAccessToken(payload: JwtUserPayload) {
  const secret = mustGetEnv("JWT_SECRET") as Secret;
  const expiresInRaw = process.env.JWT_ACCESS_EXPIRES_IN ?? "24h";
  const options: SignOptions = { expiresIn: expiresInRaw as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(payload: JwtUserPayload) {
  const secret = mustGetEnv("JWT_SECRET") as Secret;
  const expiresInRaw = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
  const options: SignOptions = { expiresIn: expiresInRaw as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): JwtUserPayload {
  const secret = mustGetEnv("JWT_SECRET") as Secret;
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded !== "object" || decoded === null) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
    }
    const { sub, firstName, role } = decoded as Record<string, unknown>;
    if (typeof sub !== "string" || typeof firstName!== "string" || (role !== "USER" && role !== "ADMIN")) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
    }
    return { sub, firstName, role };
  } catch(error) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}


