import cron from "node-cron";
import { prisma } from "../prisma/client.js";
const DAYS_7_MS = 7 * 24 * 60 * 60 * 1000;
export function startCartCleanupJob() {
    cron.schedule("0 3 * * *", async () => {
        const cutoff = new Date(Date.now() - DAYS_7_MS);
        const result = await prisma.cart.deleteMany({
            where: {
                userId: null,
                createdAt: { lt: cutoff },
            },
        });
        // eslint-disable-next-line no-console
        console.log(`[cartCleanup] Deleted ${result.count} stale guest carts`);
    });
}
