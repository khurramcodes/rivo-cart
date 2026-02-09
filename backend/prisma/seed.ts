import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function mustGetDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return url;
}

const pool = new Pool({ connectionString: mustGetDatabaseUrl() });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function mustGetEnv(name: string) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

async function main() {
  const email = mustGetEnv("ADMIN_SEED_EMAIL").toLowerCase();
  const password = mustGetEnv("ADMIN_SEED_PASSWORD");
  const name = process.env.ADMIN_SEED_NAME ?? "Admin";
  const firstName = process.env.ADMIN_SEED_FIRST_NAME ?? "Admin";
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== UserRole.ADMIN) {
      await prisma.user.update({
        where: { email },
        data: { role: UserRole.ADMIN },
      });
    }
    // eslint-disable-next-line no-console
    console.log(`Admin seed: user already exists (${email})`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: `${firstName}`,
      firstName,
      email,
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Admin seed: created admin user (${email})`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


