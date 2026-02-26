// import "dotenv/config";
import { createApp } from "./app.js";
import { startCartCleanupJob } from "./jobs/cartCleanup.js";
import { registerNotificationEventHandlers } from "./modules/notification/notification.service.js";
import { startNotificationEmailWorker } from "./modules/notification-email/notification-email.worker.js";

const PORT = Number(process.env.PORT ?? 4000);

const app = createApp();

registerNotificationEventHandlers();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

startCartCleanupJob();
startNotificationEmailWorker();