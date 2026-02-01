import "dotenv/config";
import { createApp } from "./app.js";
import { startCartCleanupJob } from "./jobs/cartCleanup.js";
const PORT = Number(process.env.PORT ?? 4000);
const app = createApp();
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
});
startCartCleanupJob();
