import type { JwtUserClaims } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserClaims;
    }
  }
}

export {};


