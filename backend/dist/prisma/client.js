import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
function mustGetDatabaseUrl() {
    const url = process.env.DATABASE_URL;
    if (!url)
        throw new Error("Missing DATABASE_URL");
    return url;
}
const pool = new Pool({ connectionString: mustGetDatabaseUrl() });
const adapter = new PrismaPg(pool);
export const prisma = global.__prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
if (process.env.NODE_ENV !== "production")
    global.__prisma = prisma;
