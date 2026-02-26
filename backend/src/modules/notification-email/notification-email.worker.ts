import {
  getPendingEmailNotifications,
  markEmailFailed,
  markEmailSent,
} from "../notification/notification.repository.js";
import { sendNotificationEmail } from "./notification-email.service.js";

const POLL_INTERVAL_MS = 5000;
const BATCH_SIZE = 10;

let timer: NodeJS.Timeout | null = null;
let isRunning = false;

async function runCycle() {
  if (isRunning) return;
  isRunning = true;
  try {
    const pending = await getPendingEmailNotifications(BATCH_SIZE);
    for (const n of pending) {
      try {
        await sendNotificationEmail({
          to: n.email,
          subject: n.title,
          message: n.message,
        });
        await markEmailSent(n.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown email error";
        await markEmailFailed(n.id, message);
      }
    }
  } catch (error) {
    console.error("[notification-email-worker] cycle failed:", error);
  } finally {
    isRunning = false;
  }
}

export function startNotificationEmailWorker() {
  if (timer) return;
  void runCycle();
  timer = setInterval(() => {
    void runCycle();
  }, POLL_INTERVAL_MS);
}

export function stopNotificationEmailWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
