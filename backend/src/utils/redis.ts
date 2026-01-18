import { Redis } from "@upstash/redis";
import { ApiError } from "./ApiError.js";

function mustGetEnv(name: string) {
  const val = process.env[name];
  if (!val) throw new ApiError(500, "CONFIG_ERROR", `Missing env var: ${name}`);
  return val;
}

export const redis = new Redis({
  url: mustGetEnv("UPSTASH_REDIS_REST_URL"),
  token: mustGetEnv("UPSTASH_REDIS_REST_TOKEN"),
});
